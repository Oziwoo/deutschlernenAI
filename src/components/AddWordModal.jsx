import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIES } from '../data/words'
import { useLanguage } from '../hooks/useLanguage'
import { t } from '../i18n/translations'

export default function AddWordModal({ onClose, user, sessionId, onAdd }) {
  const { lang } = useLanguage()
  const [wordInput, setWordInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!wordInput.trim() || loading) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/parse-word?word=${encodeURIComponent(wordInput.trim())}&lang=${lang}`)
      if (!res.ok) throw new Error(t('add_err_fetch', lang))

      const parsed = await res.json()

      if (!parsed.word || !parsed.category || !CATEGORIES[parsed.category]) {
        throw new Error(t('add_err_ai', lang))
      }

      const insertData = {
        word: parsed.word,
        article: parsed.article,
        category: parsed.category,
        translation: parsed.translation,
      }

      if (user) {
        insertData.user_id = user.id
      } else {
        insertData.session_id = sessionId
      }

      const { error: dbError } = await supabase.from('custom_words').insert([insertData])
      if (dbError) throw dbError

      if (onAdd) await onAdd()

      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || t('add_err_generic', lang))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 animate-slide-up overflow-hidden p-6 transition-colors"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">{t('add_title', lang)}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">✕</button>
        </div>

        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          {t('add_desc', lang)}
        </p>

        <form onSubmit={handleAdd}>
          <input
            type="text"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            placeholder={t('add_placeholder', lang)}
            className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors mb-4"
            autoFocus
            disabled={loading}
          />

          {error && <div className="text-rose-500 text-sm mb-4">{error}</div>}

          <button
            type="submit"
            disabled={!wordInput.trim() || loading}
            className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {t('add_recognizing', lang)}
              </>
            ) : t('add_btn', lang)}
          </button>
        </form>
      </div>
    </div>
  )
}
