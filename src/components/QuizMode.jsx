import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { displayWord, CATEGORY_COLORS } from '../data/words'
import { RATING, shuffle } from '../lib/srs'
import { fetchExplanation } from '../lib/gemini'
import { useLanguage } from '../hooks/useLanguage'
import { t, getCategoryNames } from '../i18n/translations'

const QUIZ_SIZE = 20

function buildQuiz(wordsList) {
  return shuffle([...wordsList]).slice(0, QUIZ_SIZE)
}

function buildOptions(correct, wordsList) {
  const sameCat = wordsList.filter(w => w.category === correct.category && w.id !== correct.id)
  const others  = wordsList.filter(w => w.category !== correct.category)
  const pool    = shuffle([...sameCat, ...others])
  return shuffle([correct, ...pool.slice(0, 3)])
}

export default function QuizMode({ progressMap, updateProgress, words }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const catNames = getCategoryNames(lang)
  const [quiz, setQuiz]         = useState(() => buildQuiz(words))
  const [index, setIndex]       = useState(0)
  const [explanations, setExpls]= useState({})
  const [selected, setSelected] = useState(null)
  const [score, setScore]       = useState({ correct:0, wrong:0 })
  const [done, setDone]         = useState(false)
  const current = quiz[index]

  useEffect(() => {
    if (!current || explanations[current.id]) return
    let cancelled = false
    fetchExplanation(current).then(text => {
      if (!cancelled) setExpls(p => ({ ...p, [current.id]: text }))
    })
    return () => { cancelled = true }
  }, [current?.id])

  const options = current ? buildOptions(current, words) : []

  const handleSelect = async (option) => {
    if (selected !== null) return
    setSelected(option.id)
    const isCorrect = option.id === current.id
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), wrong: s.wrong + (isCorrect ? 0 : 1) }))
    await updateProgress(current.id, isCorrect ? RATING.GOOD : RATING.AGAIN)
    setTimeout(() => {
      const next = index + 1
      if (next >= quiz.length) setDone(true)
      else { setIndex(next); setSelected(null) }
    }, 1400)
  }

  const restart = () => {
    setQuiz(buildQuiz(words)); setIndex(0); setSelected(null)
    setScore({ correct:0, wrong:0 }); setDone(false)
  }

  if (done) {
    const pct = Math.round((score.correct / QUIZ_SIZE) * 100)
    return (
      <div className="py-12 flex flex-col items-center gap-6 animate-fade-in text-center">
        <div className="text-5xl">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'}</div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">{t('quiz_done_title', lang)}</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            {t('quiz_done_sub', lang, { c: score.correct, t: QUIZ_SIZE, p: pct })}
          </p>
        </div>
        <div className="w-36 h-36 rounded-full border-8 border-stone-100 dark:border-stone-800 flex items-center justify-center"
          style={{ borderTopColor: pct >= 60 ? '#22c55e' : '#C62828', borderRightColor: pct >= 60 ? '#22c55e' : '#C62828' }}>
          <span className="text-3xl font-bold text-stone-800 dark:text-stone-200">{pct}%</span>
        </div>
        <div className="flex gap-3">
          <button onClick={restart} className="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">{t('quiz_another', lang)}</button>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">{t('quiz_home', lang)}</button>
        </div>
      </div>
    )
  }

  if (!current) return <div className="py-12 text-center text-stone-400">{t('quiz_loading', lang)}</div>

  const catColor = CATEGORY_COLORS[current.category]
  let expl = explanations[current.id]
  if (expl && selected === null) {
    const esc = current.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    expl = expl.replace(new RegExp(esc, 'gi'), '______')
  }

  return (
    <div className="py-6 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')} className="text-stone-400 hover:text-stone-600 text-sm">{t('quiz_back', lang)}</button>
        <span className="text-sm text-stone-400 font-mono">{index + 1} / {QUIZ_SIZE}</span>
        <div className="flex gap-3 text-xs font-medium">
          <span className="text-green-600">{score.correct} ✓</span>
          <span className="text-rose-500">{score.wrong} ✗</span>
        </div>
      </div>
      <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full progress-fill" style={{ width: `${(index / QUIZ_SIZE) * 100}%` }} />
      </div>
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 mb-4 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">{t('quiz_header', lang)}</span>
          <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: catColor }}>
            {catNames[current.category]}
          </span>
        </div>
        <div className="min-h-[80px]">
          {!expl ? (
            <div className="flex items-center gap-2 text-stone-400">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-sm">{t('quiz_loading', lang)}</span>
            </div>
          ) : <div className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap text-sm">{expl}</div>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map(opt => {
          const isCorrect = opt.id === current.id
          const isChosen  = selected === opt.id
          let cls = 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
          if (selected !== null) {
            if (isCorrect)      cls = 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400'
            else if (isChosen)  cls = 'border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400'
            else                cls = 'border-stone-100 bg-stone-50 dark:bg-stone-900 text-stone-400'
          }
          return (
            <button key={opt.id} onClick={() => handleSelect(opt)} disabled={selected !== null}
              className={`p-4 rounded-xl border text-left font-medium transition-all active:scale-95 disabled:cursor-default ${cls}`}>
              <div className="text-lg font-bold leading-tight">{displayWord(opt)}</div>
              <div className="text-xs mt-1 opacity-60">{catNames[opt.category]}</div>
              {selected !== null && isCorrect && <div className="text-xs mt-1 text-green-600 font-semibold">✓ {t('quiz_correct_lbl', lang)}</div>}
              {selected !== null && isChosen && !isCorrect && <div className="text-xs mt-1 text-rose-600 font-semibold">✗ {t('quiz_wrong_lbl', lang)}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
