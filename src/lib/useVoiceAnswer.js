import { useState, useRef, useCallback, useEffect } from 'react'

export const VOICE_STATUS = {
  IDLE: 'idle',
  LISTENING: 'listening',
  ERROR: 'error',
}

export function useVoiceAnswer() {
  const [status, setStatus] = useState(VOICE_STATUS.IDLE)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const handledRef = useRef(false)

  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => () => recognitionRef.current?.abort(), [])

  const reset = useCallback(() => {
    recognitionRef.current?.abort()
    setStatus(VOICE_STATUS.IDLE)
    setTranscript('')
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.abort()
    setStatus(VOICE_STATUS.IDLE)
  }, [])

  const start = useCallback(
    (targetWord, onCorrect, onIncorrect) => {
      if (!isSupported) return
      recognitionRef.current?.abort()

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      const rec = new SR()
      rec.lang = 'de-DE'
      rec.interimResults = false
      rec.maxAlternatives = 5
      handledRef.current = false

      rec.onstart = () => setStatus(VOICE_STATUS.LISTENING)

      rec.onresult = (e) => {
        handledRef.current = true
        const alternatives = Array.from(e.results[0]).map((a) =>
          a.transcript.trim()
        )
        const target = targetWord.toLowerCase().trim()
        const matched = alternatives.some(
          (s) => s.toLowerCase().trim() === target
        )
        const best = alternatives[0]
        setTranscript(best)

        if (matched) {
          setStatus(VOICE_STATUS.IDLE)
          onCorrect()
        } else {
          setStatus(VOICE_STATUS.ERROR)
          onIncorrect(best)
        }
      }

      rec.onerror = (e) => {
        handledRef.current = true
        if (e.error === 'aborted') return
        if (e.error === 'no-speech') {
          setStatus(VOICE_STATUS.IDLE)
          return
        }
        setStatus(VOICE_STATUS.ERROR)
        onIncorrect('')
      }

      rec.onend = () => {
        if (!handledRef.current) setStatus(VOICE_STATUS.IDLE)
      }

      recognitionRef.current = rec
      rec.start()
    },
    [isSupported]
  )

  return { status, transcript, isSupported, start, stop, reset }
}
