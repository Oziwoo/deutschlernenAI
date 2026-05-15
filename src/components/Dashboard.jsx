import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { CATEGORIES, CATEGORY_COLORS } from '../data/words'
import { STATUS } from '../lib/srs'
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
  const [showAddWord, setShowAddWord] = useState(false) // later we'll use a modal

  const pct     = Math.round((stats.mastered / stats.total) * 100) || 0
  const learnedTotal = stats.learning + stats.review + stats.mastered
  const dueNow  = stats.dueToday + (stats.total - learnedTotal > 0 ? Math.min(20, stats.total - learnedTotal) : 0)

  // Category breakdown
  const catProgress = Object.values(CATEGORIES).map((name, i) => {
    const catId   = Object.keys(CATEGORIES)[i]
    const color   = CATEGORY_COLORS[catId]
    return { catId, name, color }
  })

  return (
    <div className="py-6 space-y-6 animate-fade-in">

      {/* Hero */}
      <div className="text-center pt-2">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white transition-colors">
          {learnedTotal === 0 ? 'Добро пожаловать!' : 'Продолжай учить!'}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 transition-colors">
          {learnedTotal === 0
            ? `${stats.total} самых важных слов немецкого языка`
            : `Освоено ${learnedTotal} из ${stats.total} слов · ${pct}%`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 transition-colors">
        <div className="flex justify-between text-xs text-stone-400 mb-2">
          <span>Прогресс</span>
          <span>{learnedTotal} / {stats.total}</span>
        </div>
        <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-400 rounded-l-full progress-fill"
            style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
            title="Усвоено"
          />
          <div
            className="h-full bg-blue-400 progress-fill"
            style={{ width: `${(stats.review / stats.total) * 100}%` }}
            title="На повторении"
          />
          <div
            className="h-full bg-amber-400 progress-fill"
            style={{ width: `${(stats.learning / stats.total) * 100}%` }}
            title="Учится"
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs">
          {[
            { color: 'bg-amber-400',  label: 'Изучается',   n: stats.learning },
            { color: 'bg-blue-400',   label: 'Повторение',  n: stats.review   },
            { color: 'bg-green-400',  label: 'Усвоено',     n: stats.mastered },
            { color: 'bg-stone-200 dark:bg-stone-700',  label: 'Новые',       n: stats.new      },
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
        <StatCard value={stats.mastered} label="Усвоено"    color="#22c55e" />
        <StatCard value={dueNow}         label="К изучению" color="#C62828" />
        <StatCard value={`${pct}%`}      label="Готово"     color="#f59e0b" />
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <ActionButton
          onClick={() => navigate('/learn')}
          icon="🎴"
          title="Учить слова"
          subtitle={`Карточки с интервальным повторением · ${Math.min(20, stats.new)} новых`}
          accent
        />
        <ActionButton
          onClick={() => navigate('/sentence-builder')}
          icon="🧩"
          title="Собери предложение"
          subtitle="Тренировка порядка слов и грамматики"
        />
        <ActionButton
          onClick={() => navigate('/quiz')}
          icon="⚡"
          title="Быстрый тест"
          subtitle="Выбери правильное слово из 4 вариантов"
        />
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            onClick={() => navigate('/browse')}
            icon="📖"
            title="Все слова"
            subtitle="Поиск и фильтры"
          />
          <ActionButton
            onClick={() => setShowAddWord(true)}
            icon="➕"
            title="Своё слово"
            subtitle="Добавить в словарь"
          />
        </div>
      </div>

      {/* How it works */}
      {learnedTotal === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 transition-colors">
          <div className="font-semibold text-amber-800 dark:text-amber-500 mb-2">💡 Как это работает</div>
          <ul className="text-sm text-amber-700 dark:text-amber-400/80 space-y-1">
            <li>• <strong>Карточки</strong> — видишь слово с артиклем, думаешь, переворачиваешь → читаешь объяснение в контексте</li>
            <li>• <strong>Оценка</strong> — «Не знаю / Сложно / Знаю / Легко» → система сама решает, когда повторить</li>
            <li>• <strong>Прогресс</strong> — сохраняется автоматически, работает на любом устройстве</li>
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
