import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { words, displayWord, CATEGORIES, CATEGORY_COLORS } from '../data/words'
import { buildStudyQueue, RATING, STATUS } from '../lib/srs'

const RATINGS = [
  { value: RATING.AGAIN, label: 'Не знаю',  sub: 'Снова',   cls: 'border-rose-300 text-rose-600 hover:bg-rose-50' },
  { value: RATING.HARD,  label: 'Сложно',   sub: '+1 день', cls: 'border-amber-300 text-amber-600 hover:bg-amber-50' },
  { value: RATING.GOOD,  label: 'Знаю',     sub: 'Норм',    cls: 'border-blue-300 text-blue-600 hover:bg-blue-50' },
  { value: RATING.EASY,  label: 'Легко',    sub: 'Отлично', cls: 'border-green-300 text-green-600 hover:bg-green-50' },
]

function ArticleBadge({ article }) {
  if (!article) return null
  const cls = { der: 'badge-der', die: 'badge-die', das: 'badge-das' }[article] || ''
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${cls}`}>
      {article}
    </span>
  )
}

export default function LearnMode({ progressMap, updateProgress, stats }) {
  const navigate     = useNavigate()
  const [queue, setQueue]           = useState([])
  const [index, setIndex]           = useState(0)
  const [flipped, setFlipped]       = useState(false)
  const [explanation, setExpl]      = useState(null)
  const [loadingExpl, setLoadExpl]  = useState(false)
  const [sessionDone, setDone]      = useState(false)
  const [sessionScore, setScore]    = useState({ good: 0, hard: 0, again: 0 })
  const explFetchedRef              = useRef({})

  // Build queue once on mount
  useEffect(() => {
    const q = buildStudyQueue(words, progressMap, 20)
    if (q.length === 0) {
      setDone(true)
    } else {
      setQueue(q)
    }
  }, []) // intentionally only on mount

  const currentWord = queue[index]

  // Fetch explanation (cached per session in-memory + Supabase)
  const fetchExplanation = useCallback(async (word) => {
    if (explFetchedRef.current[word.id]) {
      setExpl(explFetchedRef.current[word.id])
      return
    }
    setLoadExpl(true)
    setExpl(null)
    try {
      const res  = await fetch(`/api/explain?id=${word.id}&word=${encodeURIComponent(word.word)}&article=${word.article || ''}&category=${word.category}`)
      const data = await res.json()
      const text = data.explanation || 'Объяснение недоступно.'
      explFetchedRef.current[word.id] = text
      setExpl(text)
    } catch {
      setExpl('Не удалось загрузить объяснение. Проверьте подключение.')
    } finally {
      setLoadExpl(false)
    }
  }, [])

  const handleFlip = () => {
    if (flipped) return
    setFlipped(true)
    fetchExplanation(currentWord)
  }

  const handleRate = async (rating) => {
    if (!currentWord) return

    // Update score counters
    setScore(s => ({
      good:  s.good  + (rating >= RATING.GOOD ? 1 : 0),
      hard:  s.hard  + (rating === RATING.HARD ? 1 : 0),
      again: s.again + (rating === RATING.AGAIN ? 1 : 0),
    }))

    await updateProgress(currentWord.id, rating)

    const nextIndex = index + 1
    if (nextIndex >= queue.length) {
      setDone(true)
    } else {
      setIndex(nextIndex)
      setFlipped(false)
      setExpl(null)
    }
  }

  // Session complete screen
  if (sessionDone) {
    const total = sessionScore.good + sessionScore.hard + sessionScore.again
    return (
      <div className="py-12 flex flex-col items-center gap-6 animate-fade-in text-center">
        <div className="text-5xl">🎉</div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Сессия завершена!</h2>
          <p className="text-stone-500 mt-1">
            {total > 0 ? `Изучено карточек: ${total}` : 'На сегодня всё повторено!'}
          </p>
        </div>
        {total > 0 && (
          <div className="flex gap-6 text-sm">
            <div className="text-center"><div className="text-2xl font-bold text-green-500">{sessionScore.good}</div><div className="text-stone-400">Знаю</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-amber-500">{sessionScore.hard}</div><div className="text-stone-400">Сложно</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-rose-500">{sessionScore.again}</div><div className="text-stone-400">Не знаю</div></div>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => { setDone(false); const q = buildStudyQueue(words, progressMap, 20); setQueue(q); setIndex(0); setFlipped(false); setExpl(null) }}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
          >
            Ещё раунд
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 border border-stone-200 text-stone-600 rounded-lg font-medium hover:bg-stone-50 transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    )
  }

  if (!currentWord) return null

  const catColor = CATEGORY_COLORS[currentWord.category] || '#6b7280'
  const progress = progressMap[currentWord.id]
  const remaining = queue.length - index

  return (
    <div className="py-6 max-w-lg mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')} className="text-stone-400 hover:text-stone-600 text-sm flex items-center gap-1">
          ← Назад
        </button>
        <span className="text-sm text-stone-400 font-mono">{index + 1} / {queue.length}</span>
        <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: catColor }}>
          {CATEGORIES[currentWord.category]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-stone-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full progress-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      {/* Flashcard */}
      <div className="flip-container" style={{ minHeight: '320px' }}>
        <div className={`flip-inner relative ${flipped ? 'flipped' : ''}`} style={{ minHeight: '320px' }}>

          {/* Front */}
          <div className="flip-front absolute inset-0 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center p-8 gap-4">
            <ArticleBadge article={currentWord.article} />
            <div className="text-5xl font-bold text-stone-900 text-center leading-tight">
              {currentWord.word}
            </div>
            <div className="text-sm text-stone-400 font-mono">#{currentWord.rank}</div>
            <div className="mt-4">
              {progress ? (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  progress.status === STATUS.MASTERED  ? 'bg-green-100 text-green-600' :
                  progress.status === STATUS.REVIEW    ? 'bg-blue-100 text-blue-600' :
                  progress.status === STATUS.LEARNING  ? 'bg-amber-100 text-amber-600' :
                  'bg-stone-100 text-stone-400'
                }`}>
                  { progress.status === STATUS.MASTERED ? '✓ Усвоено' :
                    progress.status === STATUS.REVIEW   ? '↻ Повторение' :
                    progress.status === STATUS.LEARNING ? '~ Учится' : '✦ Новое' }
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-400 font-medium">✦ Новое</span>
              )}
            </div>
            <button
              onClick={handleFlip}
              className="mt-6 w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 active:scale-95 transition-all"
            >
              Показать объяснение
            </button>
          </div>

          {/* Back */}
          <div className="flip-back absolute inset-0 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col p-6 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <ArticleBadge article={currentWord.article} />
                <div className="text-2xl font-bold text-stone-900 mt-1">{currentWord.word}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium shrink-0 ml-2" style={{ backgroundColor: catColor }}>
                {CATEGORIES[currentWord.category]}
              </span>
            </div>

            {/* Explanation */}
            <div className="flex-1 mb-5">
              {loadingExpl ? (
                <div className="flex items-center gap-2 text-stone-400 py-4">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span className="text-sm">Загружаем объяснение…</span>
                </div>
              ) : (
                <p className="text-stone-700 leading-relaxed text-sm">{explanation}</p>
              )}
            </div>

            {/* Rating buttons */}
            <div className="grid grid-cols-4 gap-2">
              {RATINGS.map(r => (
                <button
                  key={r.value}
                  onClick={() => handleRate(r.value)}
                  disabled={loadingExpl}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 ${r.cls}`}
                >
                  <span className="font-bold text-sm">{r.label}</span>
                  <span className="text-[10px] opacity-60 mt-0.5">{r.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Queue preview */}
      <div className="mt-4 text-center text-xs text-stone-400">
        Осталось в очереди: {remaining - 1} слов
      </div>
    </div>
  )
}
