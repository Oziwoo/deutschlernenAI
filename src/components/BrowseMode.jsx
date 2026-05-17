import { useState, useMemo, useCallback } from 'react'
import { displayWord, CATEGORIES, CATEGORY_COLORS } from '../data/words'
import { STATUS } from '../lib/srs'
import { fetchExplanation, fetchConjugation } from '../lib/gemini'
import { speakGerman } from '../lib/tts'
import { useLanguage } from '../hooks/useLanguage'
import { t, getCategoryNames } from '../i18n/translations'

function ConjugationTable({ data, lang }) {
  const rows = [
    ['ich',       data.praesens?.ich  || ''],
    ['du',        data.praesens?.du   || ''],
    ['er/sie/es', data.praesens?.er   || ''],
    ['wir',       data.praesens?.wir  || ''],
    ['ihr',       data.praesens?.ihr  || ''],
    ['sie/Sie',   data.praesens?.sie  || ''],
  ]
  return (
    <div className="mt-4 border-t border-stone-100 dark:border-stone-800 pt-4 space-y-3">
      <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t('browse_praesens', lang)}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {rows.map(([pronoun, form]) => (
          <div key={pronoun} className="flex items-center gap-2 text-sm">
            <span className="text-stone-400 w-16 shrink-0">{pronoun}</span>
            <span className="font-medium text-stone-800 dark:text-stone-200">{form}</span>
          </div>
        ))}
      </div>
      {data.perfekt && (
        <div className="text-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">{t('browse_perfekt', lang)}</span>
          <span className="font-medium text-stone-800 dark:text-stone-200">{data.perfekt}</span>
        </div>
      )}
      {data.praeteritum && (
        <div className="text-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">{t('browse_praeteritum', lang)}</span>
          <span className="font-medium text-stone-800 dark:text-stone-200">
            ich {data.praeteritum.ich} · er {data.praeteritum.er}
          </span>
        </div>
      )}
      {data.imperativ && (
        <div className="text-sm">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">{t('browse_imperativ', lang)}</span>
          <span className="font-medium text-stone-800 dark:text-stone-200">
            {[data.imperativ.du, data.imperativ.ihr, data.imperativ.Sie].filter(Boolean).join(' · ')}
          </span>
        </div>
      )}
    </div>
  )
}

function WordModal({ word, progress, onClose, lang }) {
  const [expl, setExpl]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [conj, setConj]         = useState(null)
  const [loadingConj, setLoadingConj] = useState(false)
  const [conjError, setConjError] = useState(false)
  const isVerb = ['vb1', 'vb2'].includes(word.category)
  const catColor  = CATEGORY_COLORS[word.category]
  const catNames  = getCategoryNames(lang)
  const statusKey = progress?.status || 'new'
  const statusLabels = {
    new:      { label: t('status_new_lbl', lang),      cls:'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'  },
    learning: { label: t('status_learning_lbl', lang), cls:'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'  },
    review:   { label: t('status_review_lbl', lang),   cls:'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'    },
    mastered: { label: t('status_mastered_lbl', lang), cls:'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'  },
  }
  const statusInfo = statusLabels[statusKey]

  const load = useCallback(async () => {
    if (expl || loading) return
    setLoading(true)
    const text = await fetchExplanation(word)
    setExpl(text)
    setLoading(false)
  }, [word, expl, loading])

  const loadConj = useCallback(async () => {
    if (conj || loadingConj) return
    setLoadingConj(true)
    setConjError(false)
    try {
      const data = await fetchConjugation(word)
      setConj(data)
    } catch {
      setConjError(true)
    } finally {
      setLoadingConj(false)
    }
  }, [word, conj, loadingConj])

  // Word translation
  const translation = lang === 'pl' ? word.pl : word.en

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 animate-slide-up overflow-hidden max-h-[85vh] flex flex-col transition-colors"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {word.article && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${{ der:'badge-der', die:'badge-die', das:'badge-das' }[word.article]}`}>
                  {word.article}
                </span>
              )}
              <span className="text-2xl font-bold text-stone-900 dark:text-white">{word.word}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); speakGerman(word.word) }}
                className="p-1.5 text-stone-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
              >
                🔊
              </button>
            </div>
            {/* Translation */}
            {translation && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300 text-sm font-semibold">
                  <span>{lang === 'en' ? '🇬🇧' : '🇵🇱'}</span>
                  <span>{translation}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: catColor }}>
                {catNames[word.category]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.cls}`}>{statusInfo.label}</span>
              <span className="text-xs text-stone-400 font-mono">#{word.rank}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 ml-2 shrink-0 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!expl && !loading && (
            <button onClick={load}
              className="w-full py-3 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 rounded-xl font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
              {t('browse_show_expl', lang)}
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-stone-400 py-4">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-sm">{t('browse_generating', lang)}</span>
            </div>
          )}
          {expl && <div className="text-stone-700 dark:text-stone-300 leading-relaxed text-sm whitespace-pre-wrap">{expl}</div>}

          {/* Conjugation section for verbs */}
          {isVerb && !conj && !loadingConj && (
            <button onClick={loadConj}
              className="mt-4 w-full py-2.5 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 rounded-xl text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
              {t('browse_conj_show', lang)}
            </button>
          )}
          {isVerb && loadingConj && (
            <div className="flex items-center gap-2 text-stone-400 py-3 text-sm">
              <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {t('browse_conj_loading', lang)}
            </div>
          )}
          {isVerb && conjError && (
            <div className="mt-3 text-sm text-rose-500">{t('browse_conj_error', lang)}</div>
          )}
          {isVerb && conj && <ConjugationTable data={conj} lang={lang} />}
        </div>

        {progress && (
          <div className="px-5 pb-4 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-400 flex gap-4">
            <span>{t('browse_reviews', lang)} <strong className="text-stone-600 dark:text-stone-300">{progress.review_count}</strong></span>
            <span>{t('browse_interval', lang)} <strong className="text-stone-600 dark:text-stone-300">{progress.interval} {t('browse_days', lang)}</strong></span>
            {progress.next_review && (
              <span>{t('browse_next', lang)} <strong className="text-stone-600 dark:text-stone-300">{new Date(progress.next_review).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl')}</strong></span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BrowseMode({ progressMap, words }) {
  const { lang } = useLanguage()
  const catNames = getCategoryNames(lang)
  const [search, setSearch]       = useState('')
  const [catFilter, setCat]       = useState('all')
  const [statusFilter, setStatus] = useState('all')
  const [selected, setSelected]   = useState(null)

  const statusLabels = {
    new:      { label: t('status_new_lbl', lang),      cls:'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'  },
    learning: { label: t('status_learning_lbl', lang), cls:'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'  },
    review:   { label: t('status_review_lbl', lang),   cls:'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'    },
    mastered: { label: t('status_mastered_lbl', lang), cls:'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'  },
  }

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

  const statusFilters = [
    { value:'all',      label: t('browse_all', lang)           },
    { value:'new',      label: t('status_new_lbl', lang)      },
    { value:'learning', label: t('status_learning_lbl', lang) },
    { value:'review',   label: t('status_review_lbl', lang)   },
    { value:'mastered', label: t('status_mastered_lbl', lang) },
  ]

  return (
    <div className="py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-stone-900 dark:text-white transition-colors">{t('browse_title', lang)}</h1>
        <span className="text-sm text-stone-400">{filtered.length} {t('browse_of', lang)} 1000</span>
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder={t('browse_search', lang)}
        className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-brand-400 dark:focus:border-brand-500 mb-3 transition-colors" />

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        <button onClick={() => setCat('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${catFilter === 'all' ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900' : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
          {t('browse_all', lang)}
        </button>
        {Object.keys(catNames).map(id => (
          <button key={id} onClick={() => setCat(catFilter === id ? 'all' : id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${catFilter === id ? 'text-white' : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
            style={catFilter === id ? { backgroundColor: CATEGORY_COLORS[id] } : {}}>
            {catNames[id]}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {statusFilters.map(s => (
          <button key={s.value} onClick={() => setStatus(s.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s.value ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900' : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400"><div className="text-3xl mb-2">🔍</div><div>{t('browse_nothing', lang)}</div></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map(word => {
            const status     = progressMap[word.id]?.status || 'new'
            const statusInfo = statusLabels[status]
            const catColor   = CATEGORY_COLORS[word.category]
            const translation = lang === 'pl' ? word.pl : word.en
            return (
              <button key={word.id} onClick={() => setSelected(word)}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-left hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm transition-all active:scale-95 group">
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-semibold text-stone-900 dark:text-white text-sm leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {word.article
                      ? <><span className="text-xs font-normal text-stone-400 mr-1">{word.article}</span>{word.word}</>
                      : word.word}
                  </span>
                  <span className="text-[9px] font-mono text-stone-300 shrink-0 mt-0.5">#{word.rank}</span>
                </div>
                {translation && (
                  <div className="text-[10px] text-brand-500 dark:text-brand-400 font-medium mb-1 truncate">{translation}</div>
                )}
                <div className="flex items-center justify-between mt-1">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusInfo.cls}`}>{statusInfo.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <WordModal word={selected} progress={progressMap[selected.id]} onClose={() => setSelected(null)} lang={lang} />
      )}
    </div>
  )
}
