import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildStudyQueue, RATING } from '../lib/srs'
import { speakGerman } from '../lib/tts'
import { useLanguage } from '../hooks/useLanguage'
import { t } from '../i18n/translations'
import { recordStudy } from '../lib/studyHistory'

function buildDisplayWord(word) {
  return word.article ? `${word.article} ${word.word}` : word.word
}

function normalizeInput(s) {
  return s.toLowerCase().trim()
    .replace(/ue/g, 'ü').replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ss/g, 'ß')
}

function isCorrectAnswer(input, word) {
  const norm = normalizeInput(input)
  return norm === word.word.toLowerCase() || norm === buildDisplayWord(word).toLowerCase()
}

export default function ListeningMode({ words, progressMap, updateProgress }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [done, setDone] = useState(false)
  const inputRef = useRef(null)

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    const q = buildStudyQueue(words, progressMap, 20)
    if (q.length === 0) { setDone(true); return }
    setQueue(q)
  }, [])

  const currentWord = queue[index]

  useEffect(() => {
    if (!currentWord || !ttsSupported) return
    const timer = setTimeout(() => {
      speakGerman(buildDisplayWord(currentWord))
      inputRef.current?.focus()
    }, 300)
    return () => clearTimeout(timer)
  }, [currentWord?.id])

  const playWord = () => {
    if (!currentWord) return
    speakGerman(buildDisplayWord(currentWord))
  }

  const goNext = useCallback(() => {
    const next = index + 1
    if (next >= queue.length) {
      setDone(true)
    } else {
      setIndex(next)
      setInput('')
      setResult(null)
    }
  }, [index, queue.length])

  const handleCheck = async () => {
    if (!input.trim() || !currentWord || result) return
    recordStudy(1)
    const correct = isCorrectAnswer(input.trim(), currentWord)
    if (correct) {
      setResult('correct')
      setScore(s => ({ ...s, correct: s.correct + 1 }))
      await updateProgress(currentWord.id, RATING.EASY)
    } else {
      setResult('wrong')
      setScore(s => ({ ...s, wrong: s.wrong + 1 }))
      await updateProgress(currentWord.id, RATING.AGAIN)
      speakGerman(buildDisplayWord(currentWord))
    }
  }

  const handleRetry = () => {
    setInput('')
    setResult(null)
    setTimeout(() => {
      speakGerman(buildDisplayWord(currentWord))
      inputRef.current?.focus()
    }, 100)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (!result) handleCheck()
      else if (result === 'correct') goNext()
    }
  }

  const startOver = () => {
    const q = buildStudyQueue(words, progressMap, 20)
    setQueue(q)
    setIndex(0)
    setDone(false)
    setScore({ correct: 0, wrong: 0 })
    setInput('')
    setResult(null)
  }

  if (done) {
    const total = score.correct + score.wrong
    return (
      <div className="py-12 flex flex-col items-center gap-6 animate-fade-in text-center">
        <div className="text-5xl">🎧</div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">{t('listen_done_title', lang)}</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1">{t('listen_done_sub', lang, { n: total })}</p>
        </div>
        {total > 0 && (
          <div className="flex gap-8 text-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{score.correct}</div>
              <div className="text-stone-400 mt-1">{t('listen_score_correct', lang)}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-rose-500">{score.wrong}</div>
              <div className="text-stone-400 mt-1">{t('listen_score_wrong', lang)}</div>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={startOver}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
            {t('listen_another', lang)}
          </button>
          <button onClick={() => navigate('/')}
            className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            {t('listen_home', lang)}
          </button>
        </div>
      </div>
    )
  }

  if (!currentWord) return null

  const translation = lang === 'pl' ? currentWord.pl : currentWord.en

  return (
    <div className="py-6 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')} className="text-stone-400 hover:text-stone-600 text-sm">
          {t('listen_back', lang)}
        </button>
        <span className="text-sm text-stone-400 font-mono">{index + 1} / {queue.length}</span>
        <div />
      </div>

      <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full progress-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      {!ttsSupported ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🔇</div>
          <p className="text-amber-800 dark:text-amber-400 text-sm">{t('listen_no_tts', lang)}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-8 flex flex-col items-center gap-6 transition-colors">

          {/* Play button */}
          <button
            onClick={playWord}
            className="w-24 h-24 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 border-2 border-brand-200 dark:border-brand-700 rounded-full flex items-center justify-center text-4xl transition-all active:scale-95"
            aria-label="Play word"
          >
            🔊
          </button>

          <p className="text-xs text-stone-400 text-center">{t('listen_tip', lang)}</p>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('listen_placeholder', lang)}
            disabled={!!result}
            className={`w-full px-4 py-3 text-center text-xl border-2 rounded-xl focus:outline-none transition-colors ${
              result === 'correct'
                ? 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                : result === 'wrong'
                ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-900/20 dark:border-rose-700 dark:text-rose-300'
                : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white focus:border-brand-400 dark:focus:border-brand-500'
            }`}
          />

          {/* Feedback */}
          {result === 'correct' && (
            <div className="w-full text-center space-y-1">
              <div className="text-2xl">✅</div>
              <div className="font-bold text-stone-900 dark:text-white text-xl">{buildDisplayWord(currentWord)}</div>
              <div className="text-brand-600 dark:text-brand-400 font-medium">{translation}</div>
            </div>
          )}
          {result === 'wrong' && (
            <div className="w-full text-center space-y-1">
              <div className="text-2xl">❌</div>
              <div className="text-sm text-stone-500 dark:text-stone-400">{t('listen_answer_was', lang)}</div>
              <div className="font-bold text-stone-900 dark:text-white text-xl">{buildDisplayWord(currentWord)}</div>
              <div className="text-brand-600 dark:text-brand-400 font-medium">{translation}</div>
            </div>
          )}

          {/* Action buttons */}
          {!result && (
            <button
              onClick={handleCheck}
              disabled={!input.trim()}
              className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {t('listen_check', lang)}
            </button>
          )}
          {result === 'correct' && (
            <button onClick={goNext}
              className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors">
              {t('listen_next', lang)}
            </button>
          )}
          {result === 'wrong' && (
            <div className="w-full flex gap-3">
              <button onClick={handleRetry}
                className="flex-1 py-3 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                {t('listen_retry', lang)}
              </button>
              <button onClick={goNext}
                className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors">
                {t('listen_next', lang)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
