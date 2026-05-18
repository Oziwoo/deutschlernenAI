import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORY_COLORS } from '../data/words'
import { buildStudyQueue, RATING } from '../lib/srs'
import { fetchExplanation } from '../lib/gemini'
import { speakGerman } from '../lib/tts'
import { useLanguage } from '../hooks/useLanguage'
import { t, getCategoryNames } from '../i18n/translations'
import { useVoiceAnswer, VOICE_STATUS } from '../lib/useVoiceAnswer'

function ArticleBadge({ article }) {
  if (!article) return null
  const cls = { der:'badge-der', die:'badge-die', das:'badge-das' }[article] || ''
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${cls}`}>
      {article}
    </span>
  )
}

function TranslationPill({ word, lang }) {
  const translation = lang === 'pl' ? word.pl : word.en
  if (!translation) return null
  return (
    <div className="flex items-center gap-2 justify-center">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300 text-sm font-semibold">
        <span>{lang === 'en' ? '🇬🇧' : '🇵🇱'}</span>
        <span>{translation}</span>
      </span>
    </div>
  )
}

export default function LearnMode({ progressMap, updateProgress, words }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const catNames = getCategoryNames(lang)

  const [queue, setQueue]           = useState([])
  const [index, setIndex]           = useState(0)
  const [flipped, setFlipped]       = useState(false)
  const [explanation, setExpl]      = useState(null)
  const [loadingExpl, setLoadExpl]  = useState(false)
  const [sessionDone, setDone]      = useState(false)
  const [score, setScore]           = useState({ good:0, hard:0, again:0 })
  const cache                       = useRef({})

  const { status: voiceStatus, isSupported: voiceSupported, start: voiceStart, stop: voiceStop, reset: voiceReset } = useVoiceAnswer()
  const [voiceResult, setVoiceResult] = useState(null) // { status, feedback, said }
  const autoRateRef                   = useRef(null)

  const RATINGS = [
    { value: RATING.AGAIN, label: t('learn_again', lang), sub: t('learn_again_sub', lang), cls: 'border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30' },
    { value: RATING.HARD,  label: t('learn_hard', lang),  sub: t('learn_hard_sub', lang),  cls: 'border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30' },
    { value: RATING.GOOD,  label: t('learn_know', lang),  sub: t('learn_good_sub', lang),  cls: 'border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30' },
    { value: RATING.EASY,  label: t('learn_easy', lang),  sub: t('learn_easy_sub', lang),  cls: 'border-green-300 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30' },
  ]

  useEffect(() => {
    const q = buildStudyQueue(words, progressMap, 20)
    if (q.length === 0) setDone(true)
    else setQueue(q)
  }, [])

  // Reset voice state whenever the card changes
  useEffect(() => {
    voiceReset()
    setVoiceResult(null)
    clearTimeout(autoRateRef.current)
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps

  // Abort any in-progress recognition on unmount
  useEffect(() => () => { voiceReset(); clearTimeout(autoRateRef.current) }, []) // eslint-disable-line

  const currentWord = queue[index]

  const loadExpl = useCallback(async (word) => {
    const cacheKey = `${word.id}_${lang}`
    if (cache.current[cacheKey]) { setExpl(cache.current[cacheKey]); return }
    setLoadExpl(true)
    setExpl(null)
    const text = await fetchExplanation(word, lang)
    cache.current[cacheKey] = text
    setExpl(text)
    setLoadExpl(false)
  }, [lang])

  const handleFlip = () => {
    if (flipped) return
    setFlipped(true)
    loadExpl(currentWord)
  }

  const handleRate = async (rating) => {
    if (!currentWord) return
    clearTimeout(autoRateRef.current)
    setScore(s => ({
      good:  s.good  + (rating >= RATING.GOOD  ? 1 : 0),
      hard:  s.hard  + (rating === RATING.HARD  ? 1 : 0),
      again: s.again + (rating === RATING.AGAIN ? 1 : 0),
    }))
    await updateProgress(currentWord.id, rating)
    const next = index + 1
    if (next >= queue.length) setDone(true)
    else { setIndex(next); setFlipped(false); setExpl(null) }
  }

  const startVoice = () => {
    setVoiceResult(null)
    voiceStart(currentWord.word, {
      onCorrect: () => {
        clearTimeout(autoRateRef.current)
        handleFlip()
        autoRateRef.current = setTimeout(() => handleRate(RATING.GOOD), 1400)
      },
      onFeedback: (result) => {
        setVoiceResult(result)
      },
    })
  }

  if (sessionDone) {
    const total = score.good + score.hard + score.again
    return (
      <div className="py-12 flex flex-col items-center gap-6 animate-fade-in text-center">
        <div className="text-5xl">🎉</div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">{t('learn_done_title', lang)}</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            {total > 0
              ? t('learn_done_sub', lang, { n: total })
              : t('learn_done_all', lang)}
          </p>
        </div>
        {total > 0 && (
          <div className="flex gap-6 text-sm">
            <div className="text-center"><div className="text-2xl font-bold text-green-500">{score.good}</div><div className="text-stone-400">{t('score_know', lang)}</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-amber-500">{score.hard}</div><div className="text-stone-400">{t('score_hard', lang)}</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-rose-500">{score.again}</div><div className="text-stone-400">{t('score_again', lang)}</div></div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => { setDone(false); setQueue(buildStudyQueue(words, progressMap, 20)); setIndex(0); setFlipped(false); setExpl(null) }}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
            {t('learn_another', lang)}
          </button>
          <button onClick={() => navigate('/')}
            className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            {t('learn_home', lang)}
          </button>
        </div>
      </div>
    )
  }

  if (!currentWord) return null

  const catColor  = CATEGORY_COLORS[currentWord.category] || '#6b7280'
  const progress  = progressMap[currentWord.id]
  const remaining = queue.length - index

  const statusLabel = progress
    ? (progress.status === 'mastered' ? t('status_mastered', lang) :
       progress.status === 'review'   ? t('status_review', lang)   :
       progress.status === 'learning' ? t('status_learning', lang) : t('status_new', lang))
    : t('status_new', lang)

  const statusCls = progress
    ? (progress.status === 'mastered' ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' :
       progress.status === 'review'   ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'   :
       progress.status === 'learning' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
       'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500')
    : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'

  return (
    <div className="py-6 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')} className="text-stone-400 hover:text-stone-600 text-sm">{t('learn_back', lang)}</button>
        <span className="text-sm text-stone-400 font-mono">{index + 1} / {queue.length}</span>
        <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: catColor }}>
          {catNames[currentWord.category]}
        </span>
      </div>

      <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full progress-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      <div className="flip-container" style={{ minHeight: '340px' }}>
        <div className={`flip-inner relative ${flipped ? 'flipped' : ''}`} style={{ minHeight: '340px' }}>

          {/* Front */}
          <div className="flip-front absolute inset-0 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center p-8 gap-4 transition-colors">
            <ArticleBadge article={currentWord.article} />
            <div className="flex items-center gap-3">
              <div className="text-5xl font-bold text-stone-900 dark:text-white text-center leading-tight">{currentWord.word}</div>
              <button onClick={(e) => { e.stopPropagation(); speakGerman(currentWord.word) }}
                className="p-2 text-stone-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-xl transition-colors">
                🔊
              </button>
            </div>
            <div className="text-sm text-stone-400 font-mono">#{currentWord.rank}</div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusCls}`}>{statusLabel}</span>
            </div>
            <div className="mt-4 flex flex-col gap-2 w-full">
              <div className="flex gap-2">
                <button onClick={handleFlip}
                  className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 active:scale-95 transition-all">
                  {t('learn_show_expl', lang)}
                </button>
                {voiceSupported && (
                  <button
                    onClick={
                      voiceStatus === VOICE_STATUS.LISTENING  ? voiceStop  :
                      voiceStatus === VOICE_STATUS.EVALUATING ? undefined   : startVoice
                    }
                    disabled={voiceStatus === VOICE_STATUS.EVALUATING}
                    className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border-2 font-medium transition-all active:scale-95 disabled:cursor-wait ${
                      voiceStatus === VOICE_STATUS.LISTENING
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500'
                        : voiceStatus === VOICE_STATUS.EVALUATING
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                        : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:border-brand-300 hover:text-brand-500'
                    }`}
                  >
                    {voiceStatus === VOICE_STATUS.LISTENING ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <span className="text-xs whitespace-nowrap">{t('voice_listen', lang)}</span>
                      </>
                    ) : voiceStatus === VOICE_STATUS.EVALUATING ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        <span className="text-xs whitespace-nowrap">{t('voice_evaluating', lang)}</span>
                      </>
                    ) : (
                      <span className="text-lg leading-none">🎤</span>
                    )}
                  </button>
                )}
              </div>
              {!voiceSupported && (
                <p className="text-xs text-center text-stone-400">{t('voice_no_support', lang)}</p>
              )}
              {voiceResult && (
                <div className={`flex flex-col gap-1 px-3 py-2 rounded-xl text-xs animate-fade-in ${
                  voiceResult.status === 'close'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}>
                  <span className="font-semibold">
                    {voiceResult.status === 'close' ? '⚠️' : '❌'} {voiceResult.feedback}
                  </span>
                  {voiceResult.said && (
                    <span className="opacity-70">Распознано: «{voiceResult.said}»</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Back */}
          <div className="flip-back absolute inset-0 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col p-6 overflow-y-auto transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <ArticleBadge article={currentWord.article} />
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-2xl font-bold text-stone-900 dark:text-white">{currentWord.word}</div>
                  <button onClick={(e) => { e.stopPropagation(); speakGerman(currentWord.word) }}
                    className="p-1.5 text-stone-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors">
                    🔊
                  </button>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium shrink-0 ml-2" style={{ backgroundColor: catColor }}>
                {catNames[currentWord.category]}
              </span>
            </div>

            {/* Translation pill — shown immediately on flip */}
            <div className="mb-4">
              <TranslationPill word={currentWord} lang={lang} />
            </div>

            <div className="flex-1 mb-5">
              {loadingExpl ? (
                <div className="flex items-center gap-2 text-stone-400 py-4">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span className="text-sm">{t('learn_generating', lang)}</span>
                </div>
              ) : (
                <div className="text-stone-700 dark:text-stone-300 leading-relaxed text-sm whitespace-pre-wrap">{explanation}</div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {RATINGS.map(r => (
                <button key={r.value} onClick={() => handleRate(r.value)} disabled={loadingExpl}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 ${r.cls}`}>
                  <span className="font-bold text-sm">{r.label}</span>
                  <span className="text-[10px] opacity-60 mt-0.5">{r.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-stone-400">{t('learn_remaining', lang, { n: remaining - 1 })}</div>
    </div>
  )
}
