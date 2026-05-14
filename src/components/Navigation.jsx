import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',       label: 'Главная',  icon: '⌂' },
  { to: '/learn',  label: 'Учить',    icon: '🎴' },
  { to: '/quiz',   label: 'Тест',     icon: '⚡' },
  { to: '/browse', label: 'Словарь',  icon: '📖' },
]

export default function Navigation({ stats }) {
  const pct = Math.round((stats.mastered / 1000) * 100)

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-1.5 font-bold text-xl tracking-tight">
            <span className="text-stone-900">Deutsch</span>
            <span className="text-brand-500">1000</span>
            {pct > 0 && (
              <span className="ml-2 text-xs font-normal text-stone-400 hidden sm:block">
                {pct}% освоено
              </span>
            )}
          </NavLink>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ` +
                  (isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100')
                }
              >
                <span className="hidden sm:inline">{l.icon}</span>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Thin progress stripe */}
        <div className="h-0.5 bg-stone-100 -mx-4">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-gold-400 progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </header>
  )
}
