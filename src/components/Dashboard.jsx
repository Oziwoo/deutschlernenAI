import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { CATEGORIES, CATEGORY_COLORS } from '../data/words'
import { useLanguage } from '../hooks/useLanguage'
import { t, getCategoryNames } from '../i18n/translations'
import AddWordModal from './AddWordModal'

function StatCard({ value, label, color }) {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 text-center transition-colors">
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium uppercase tracking-wide">{label}</div>
    </div>
  )
}

function ActionButton({ onClick, icon, title, subtitle, accent }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 hover:shadow-md active:scale-[.98]
        ${accent
          ? 'bg-brand-500 border-brand-600 text-white hover:bg-brand-600'
          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'
        }`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <div className={`font-semibold ${accent ? 'text-white' : 'text-stone-900 dark:text-white'}`}>{title}</div>
        <div className={`text-sm mt-0.5 ${accent ? 'text-red-100' : 'text-stone-400 dark:text-stone-500'}`}>{subtitle}</div>
      </div>
      <span className={`ml-auto text-lg ${accent ? 'text-red-200' : 'text-stone-300 dark:text-stone-600'}`}>→</span>
    </button>
  )
}

export default function Dashboard({ stats, progressMap, words, user, sessionId, fetchCustomWords }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const [showAddWord, setShowAddWord] = useState(false)

  const pct     = Math.round((stats.mastered / stats.total) * 100) || 0
  const learnedTotal = stats.learning + stats.review + stats.mastered
  const dueNow  = stats.dueToday + (stats.total - learnedTotal > 0 ? Math.min(20, stats.total - learnedTotal) : 0)

  return (
    <div className="py-6 space-y-6 animate-fade-in">

      {/* Hero */}
      <div className="text-center pt-2">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white transition-colors">
          {learnedTotal === 0 ? t('dash_welcome', lang) : t('dash_keep_going', lang)}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 transition-colors">
          {learnedTotal === 0
            ? `${stats.total} ${t('dash_subtitle_new', lang)}`
            : `${t('dash_stat_mastered', lang)}: ${learnedTotal} ${t('dash_progress_of', lang)} ${stats.total} · ${pct}%`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 transition-colors">
        <div className="flex justify-between text-xs text-stone-400 mb-2">
          <span>{t('dash_progress_lbl', lang)}</span>
          <span>{learnedTotal} / {stats.total}</span>
        </div>
        <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-400 rounded-l-full progress-fill"
            style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
            title={t('dash_legend_mastered', lang)}
          />
          <div
            className="h-full bg-blue-400 progress-fill"
            style={{ width: `${(stats.review / stats.total) * 100}%` }}
            title={t('dash_legend_review', lang)}
          />
          <div
            className="h-full bg-amber-400 progress-fill"
            style={{ width: `${(stats.learning / stats.total) * 100}%` }}
            title={t('dash_legend_learning', lang)}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs">
          {[
            { color: 'bg-amber-400', label: t('dash_legend_learning', lang), n: stats.learning },
            { color: 'bg-blue-400',  label: t('dash_legend_review', lang),   n: stats.review   },
            { color: 'bg-green-400', label: t('dash_legend_mastered', lang), n: stats.mastered },
            { color: 'bg-stone-200 dark:bg-stone-700', label: t('dash_legend_new', lang), n: stats.new },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              <span className="text-stone-500 dark:text-stone-400">{s.label}: <strong className="text-stone-700 dark:text-stone-300">{s.n}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.mastered} label={t('dash_stat_mastered', lang)} color="#22c55e" />
        <StatCard value={dueNow}         label={t('dash_stat_to_learn', lang)} color="#C62828" />
        <StatCard value={`${pct}%`}      label={t('dash_stat_done', lang)}     color="#f59e0b" />
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <ActionButton
          onClick={() => navigate('/learn')}
          icon="🎴"
          title={t('dash_action_learn', lang)}
          subtitle={t('dash_action_learn_sub', lang, { n: Math.min(20, stats.new) })}
          accent
        />
        <ActionButton
          onClick={() => navigate('/sentence-builder')}
          icon="🧩"
          title={t('dash_action_sentence', lang)}
          subtitle={t('dash_action_sentence_sub', lang)}
        />
        <ActionButton
          onClick={() => navigate('/quiz')}
          icon="⚡"
          title={t('dash_action_quiz', lang)}
          subtitle={t('dash_action_quiz_sub', lang)}
        />
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            onClick={() => navigate('/browse')}
            icon="📖"
            title={t('dash_action_browse', lang)}
            subtitle={t('dash_action_browse_sub', lang)}
          />
          <ActionButton
            onClick={() => setShowAddWord(true)}
            icon="➕"
            title={t('dash_action_add', lang)}
            subtitle={t('dash_action_add_sub', lang)}
          />
        </div>
      </div>

      {/* How it works */}
      {learnedTotal === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 transition-colors">
          <div className="font-semibold text-amber-800 dark:text-amber-500 mb-2">{t('dash_how_title', lang)}</div>
          <ul className="text-sm text-amber-700 dark:text-amber-400/80 space-y-1">
            <li dangerouslySetInnerHTML={{ __html: t('dash_how_1', lang) }} />
            <li dangerouslySetInnerHTML={{ __html: t('dash_how_2', lang) }} />
            <li dangerouslySetInnerHTML={{ __html: t('dash_how_3', lang) }} />
          </ul>
        </div>
      )}

      {showAddWord && (
        <AddWordModal 
          onClose={() => setShowAddWord(false)} 
          onAdd={fetchCustomWords} 
          user={user} 
          sessionId={sessionId} 
        />
      )}
    </div>
  )
}
