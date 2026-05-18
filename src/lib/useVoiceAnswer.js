import { useState, useRef, useCallback, useEffect } from 'react'
import { checkVoiceAnswer } from './gemini'

export const VOICE_STATUS = {
  IDLE:       'idle',
  LISTENING:  'listening',
  EVALUATING: 'evaluating', // waiting for AI response
}

export function useVoiceAnswer() {
  const [status, setStatus] = useState(VOICE_STATUS.IDLE)
  const recognitionRef      = useRef(null)
  const handledRef          = useRef(false)

  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => () => recognitionRef.current?.abort(), [])

  const reset = useCallback(() => {
    recognitionRef.current?.abort()
    setStatus(VOICE_STATUS.IDLE)
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.abort()
    setStatus(VOICE_STATUS.IDLE)
  }, [])

  /**
   * Start listening, then evaluate with AI.
   * @param {string} targetWord  — the correct German word
   * @param {{ onCorrect: () => void, onFeedback: (result: { status, feedback, said }) => void }} callbacks
   */
  const start = useCallback(
    (targetWord, { onCorrect, onFeedback }) => {
      if (!isSupported) return
      recognitionRef.current?.abort()

      const SR  = window.SpeechRecognition || window.webkitSpeechRecognition
      const rec = new SR()
      rec.lang            = 'de-DE'
      rec.interimResults  = false
      rec.maxAlternatives = 5
      handledRef.current  = false

      rec.onstart = () => setStatus(VOICE_STATUS.LISTENING)

      rec.onresult = async (e) => {
        handledRef.current = true
        const alternatives = Array.from(e.results[0]).map(a => a.transcript.trim())
        const best         = alternatives[0]

        // Fast path: exact match on any alternative
        const target  = targetWord.toLowerCase().trim()
        const matched = alternatives.some(s => s.toLowerCase().trim() === target)
        if (matched) {
          setStatus(VOICE_STATUS.IDLE)
          onCorrect()
          return
        }

        // AI evaluation for non-exact match
        setStatus(VOICE_STATUS.EVALUATING)
        try {
          const result = await checkVoiceAnswer(targetWord, best)
          setStatus(VOICE_STATUS.IDLE)
          if (result.status === 'correct') {
            onCorrect()
          } else {
            onFeedback({ status: result.status, feedback: result.feedback, said: best })
          }
        } catch {
          setStatus(VOICE_STATUS.IDLE)
          onFeedback({
            status:   'incorrect',
            feedback: `Вы сказали «${best}», нужно «${targetWord}».`,
            said:     best,
          })
        }
      }

      rec.onerror = (e) => {
        handledRef.current = true
        if (e.error === 'aborted') return
        setStatus(VOICE_STATUS.IDLE)
        if (e.error !== 'no-speech') {
          onFeedback({ status: 'incorrect', feedback: 'Не удалось распознать речь. Попробуйте снова.', said: '' })
        }
      }

      rec.onend = () => {
        if (!handledRef.current) setStatus(VOICE_STATUS.IDLE)
      }

      recognitionRef.current = rec
      rec.start()
    },
    [isSupported]
  )

  return { status, isSupported, start, stop, reset, VOICE_STATUS }
}
