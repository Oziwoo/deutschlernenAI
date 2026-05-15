import { useState, useMemo, useCallback } from 'react'
import { words, displayWord, CATEGORIES, CATEGORY_COLORS } from '../data/words'
import { STATUS } from '../lib/srs'
import { fetchExplanation } from '../lib/gemini'

const STATUS_LABELS = {
  new:      { label:'Новое',       cls:'bg-stone-100 text-stone-500'  },
  learning: { label:'Учится',      cls:'bg-amber-100 text-amber-600'  },
  review:   { label:'Повторение',  cls:'bg-blue-100 text-blue-600'    },
  mastered: { label:'Усвоено',     cls:'bg-green-100 text-green-600'  },
}

function WordModal({ word, progress, onClose }) {
  const [expl, setExpl]       = useState(null)
  const [loading, setLoading] = useState(false)
  const catColor  = CATEGORY_COLORS[word.category]
  const statusKey = progress?.status || 'new'
  const statusInfo = STATUS_LABELS[statusKey]

  const load = useCallback(async () => {
    if (expl || loading) return
    setLoading(true)
    const text = await fetchExplanation(word)
    setExpl(text)
    setLoading(false)
  }, [word, expl, loading])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-stone-200 animate-slide-up overflow-hidden max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {word.article && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${{ der:'badge-der', die:'badge-die', das:'badge-das' }[word.article]}`}>
                  {word.article}
                </span>
              )}
              <span className="text-2xl font-bold text-stone-900">{word.word}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: catColor }}>
                {CATEGORIES[word.category]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.cls}`}>{statusInfo.label}</span>
              <span className="text-xs text-stone-400 font-mono">#{word.rank}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 ml-2 shrink-0">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!expl && !loading && (
            <button onClick={load}
              className="w-full py-3 border border-brand-200 text-brand-600 rounded-xl font-medium hover:bg-brand-50 transition-colors">
              Показать объяснение в контексте
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-stone-400 py-4">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-sm">Генерируем объяснение…</span>
            </div>
          )}
          {expl && <div className="text-stone-700 leading-relaxed text-sm whitespace-pre-wrap">{expl}</div>}
        </div>

        {progress && (
          <div className="px-5 pb-4 pt-2 border-t border-stone-100 text-xs text-stone-400 flex gap-4">
            <span>Повторений: <strong className="text-stone-600">{progress.review_count}</strong></span>
            <span>Интервал: <strong className="text-stone-600">{progress.interval} дн.</strong></span>
            {progress.next_review && (
              <span>Следующее: <strong className="text-stone-600">{new Date(progress.next_review).toLocaleDateString('ru')}</strong></span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BrowseMode({ progressMap }) {
  const [search, setSearch]         = useState('')
  const [catFilter, setCat]         = useState('all')
  const [statusFilter, setStatus]   = useState('all')
  const [selected, setSelected]     = useState(null)

  const filtered = useMemo(() => {
    let list = words
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(w => w.word.toLowerCase().includes(q))
    }
    if (catFilter !== 'all')    list = list.filter(w => w.category === catFilter)
    if (statusFilter !== 'all') list = list.filter(w => (progressMap[w.id]?.status || 'new') === statusFilter)
    return list
  }, [search, catFilter, statusFilter, progressMap])

  return (
    <div className="py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-stone-900">Все слова</h1>
        <span className="text-sm text-stone-400">{filtered.length} из 1000</span>
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по слову…"
        className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 mb-3" />

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        <button onClick={() => setCat('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${catFilter === 'all' ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
          Все
        </button>
        {Object.entries(CATEGORIES).map(([id, name]) => (
          <button key={id} onClick={() => setCat(catFilter === id ? 'all' : id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${catFilter === id ? 'text-white' : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50'}`}
            style={catFilter === id ? { backgroundColor: CATEGORY_COLORS[id] } : {}}>
            {name}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { value:'all',      label:'Все' },
          { value:'new',      label:'Новые' },
          { value:'learning', label:'Учится' },
          { value:'review',   label:'Повторение' },
          { value:'mastered', label:'Усвоено' },
        ].map(s => (
          <button key={s.value} onClick={() => setStatus(s.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s.value ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400"><div className="text-3xl mb-2">🔍</div><div>Ничего не найдено</div></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map(word => {
            const status     = progressMap[word.id]?.status || 'new'
            const statusInfo = STATUS_LABELS[status]
            const catColor   = CATEGORY_COLORS[word.category]
            return (
              <button key={word.id} onClick={() => setSelected(word)}
                className="bg-white border border-stone-200 rounded-xl p-3 text-left hover:border-stone-300 hover:shadow-sm transition-all active:scale-95 group">
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-semibold text-stone-900 text-sm leading-tight group-hover:text-brand-600 transition-colors">
                    {word.article
                      ? <><span className="text-xs font-normal text-stone-400 mr-1">{word.article}</span>{word.word}</>
                      : word.word}
                  </span>
                  <span className="text-[9px] font-mono text-stone-300 shrink-0 mt-0.5">#{word.rank}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusInfo.cls}`}>{statusInfo.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <WordModal word={selected} progress={progressMap[selected.id]} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
