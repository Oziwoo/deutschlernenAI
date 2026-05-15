import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { words, displayWord, CATEGORIES, CATEGORY_COLORS } from '../data/words'
import { buildStudyQueue, RATING, STATUS } from '../lib/srs'
import { fetchExplanation } from '../lib/gemini'

const RATINGS = [
  { value: RATING.AGAIN, label: 'Не знаю',  sub: 'Снова',    cls: 'border-rose-300 text-rose-600 hover:bg-rose-50' },
  { value: RATING.HARD,  label: 'Сложно',   sub: '+1 день',  cls: 'border-amber-300 text-amber-600 hover:bg-amber-50' },
  { value: RATING.GOOD,  label: 'Знаю',     sub: 'Хорошо',   cls: 'border-blue-300 text-blue-600 hover:bg-blue-50' },
  { value: RATING.EASY,  label: 'Легко',    sub: 'Отлично',  cls: 'border-green-300 text-green-600 hover:bg-green-50' },
]

function ArticleBadge({ article }) {
  if (!article) return null
  const cls = { der:'badge-der', die:'badge-die', das:'badge-das' }[article] || ''
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${cls}`}>
      {article}
    </span>
  )
}

export default function LearnMode({ progressMap, updateProgress }) {
  const navigate = useNavigate()
  const [queue, setQueue]           = useState([])
  const [index, setIndex]           = useState(0)
  const [flipped, setFlipped]       = useState(false)
  const [explanation, setExpl]      = useState(null)
  const [loadingExpl, setLoadExpl]  = useState(false)
  const [sessionDone, setDone]      = useState(false)
  const [score, setScore]           = useState({ good:0, hard:0, again:0 })
  const cache                       = useRef({})

  useEffect(() => {
    const q = buildStudyQueue(words, progressMap, 20)
    if (q.length === 0) setDone(true)
    else setQueue(q)
  }, [])

  const currentWord = queue[index]

  const loadExpl = useCallback(async (word) => {
    if (cache.current[word.id]) { setExpl(cache.current[word.id]); return }
    setLoadExpl(true)
    setExpl(null)
    const text = await fetchExplanation(word)
    cache.current[word.id] = text
    setExpl(text)
    setLoadExpl(false)
  }, [])

  const handleFlip = () => {
    if (flipped) return
    setFlipped(true)
    loadExpl(currentWord)
  }

  const handleRate = async (rating) => {
    if (!currentWord) return
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

  if (sessionDone) {
    const total = score.good + score.hard + score.again
    return (
      <div className="py-12 flex flex-col items-center gap-6 animate-fade-in text-center">
        <div className="text-5xl">🎉</div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Сессия завершена!</h2>
          <p className="text-stone-500 mt-1">{total > 0 ? `Карточек пройдено: ${total}` : 'На сегодня всё повторено!'}</p>
        </div>
        {total > 0 && (
          <div className="flex gap-6 text-sm">
            <div className="text-center"><div className="text-2xl font-bold text-green-500">{score.good}</div><div className="text-stone-400">Знаю</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-amber-500">{score.hard}</div><div className="text-stone-400">Сложно</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-rose-500">{score.again}</div><div className="text-stone-400">Не знаю</div></div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => { setDone(false); setQueue(buildStudyQueue(words, progressMap, 20)); setIndex(0); setFlipped(false); setExpl(null) }}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
            Ещё раунд
          </button>
          <button onClick={() => navigate('/')}
            className="px-5 py-2.5 border border-stone-200 text-stone-600 rounded-lg font-medium hover:bg-stone-50 transition-colors">
            На главную
          </button>
        </div>
      </div>
    )
  }

  if (!currentWord) return null

  const catColor  = CATEGORY_COLORS[currentWord.category] || '#6b7280'
  const progress  = progressMap[currentWord.id]
  const remaining = queue.length - index

  return (
    <div className="py-6 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')} className="text-stone-400 hover:text-stone-600 text-sm">← Назад</button>
        <span className="text-sm text-stone-400 font-mono">{index + 1} / {queue.length}</span>
        <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: catColor }}>
          {CATEGORIES[currentWord.category]}
        </span>
      </div>

      <div className="h-1.5 bg-stone-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full progress-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      <div className="flip-container" style={{ minHeight: '340px' }}>
        <div className={`flip-inner relative ${flipped ? 'flipped' : ''}`} style={{ minHeight: '340px' }}>

          {/* Front */}
          <div className="flip-front absolute inset-0 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center p-8 gap-4">
            <ArticleBadge article={currentWord.article} />
            <div className="text-5xl font-bold text-stone-900 text-center leading-tight">{currentWord.word}</div>
            <div className="text-sm text-stone-400 font-mono">#{currentWord.rank}</div>
            <div className="mt-2">
              {progress ? (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  progress.status === 'mastered'  ? 'bg-green-100 text-green-600' :
                  progress.status === 'review'    ? 'bg-blue-100 text-blue-600'   :
                  progress.status === 'learning'  ? 'bg-amber-100 text-amber-600' :
                  'bg-stone-100 text-stone-400'}`}>
                  { progress.status === 'mastered' ? '✓ Усвоено' :
                    progress.status === 'review'   ? '↻ Повторение' :
                    progress.status === 'learning' ? '~ Учится' : '✦ Новое' }
                </span>
              ) : <span className="text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-400 font-medium">✦ Новое</span>}
            </div>
            <button onClick={handleFlip}
              className="mt-4 w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 active:scale-95 transition-all">
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

            <div className="flex-1 mb-5">
              {loadingExpl ? (
                <div className="flex items-center gap-2 text-stone-400 py-4">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span className="text-sm">Генерируем объяснение…</span>
                </div>
              ) : (
                <div className="text-stone-700 leading-relaxed text-sm whitespace-pre-wrap">{explanation}</div>
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

      <div className="mt-4 text-center text-xs text-stone-400">Осталось: {remaining - 1} слов</div>
    </div>
  )
}
