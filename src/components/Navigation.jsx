import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useLanguage } from '../hooks/useLanguage'
import { t } from '../i18n/translations'
import AuthModal from './AuthModal'
import { supabase } from '../lib/supabase'

export default function Navigation({ stats, user }) {
  const { theme, toggleTheme } = useTheme()
  const { lang, toggleLang } = useLanguage()
  const [isAuthOpen, setAuthOpen] = useState(false)
  const pct = Math.round((stats.mastered / 1000) * 100)

  const links = [
    { to: '/',       label: t('nav_home', lang),   icon: '⌂' },
    { to: '/learn',  label: t('nav_learn', lang),  icon: '🎴' },
    { to: '/quiz',   label: t('nav_quiz', lang),   icon: '⚡' },
    { to: '/browse', label: t('nav_browse', lang), icon: '📖' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-sm transition-colors">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-1.5 font-bold text-xl tracking-tight">
            <span className="text-stone-900 dark:text-white transition-colors">Deutsch</span>
            <span className="text-brand-500">1000</span>
            {pct > 0 && (
              <span className="ml-2 text-xs font-normal text-stone-400 hidden sm:block">
                {pct}% {lang === 'en' ? 'mastered' : 'opanowano'}
              </span>
            )}
          </NavLink>

          {/* Nav links and tools */}
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {links.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ` +
                    (isActive
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800')
                  }
                >
                  <span className="hidden sm:inline">{l.icon}</span>
                  {l.label}
                </NavLink>
              ))}
            </nav>
            
            <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1"></div>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              title={t('nav_lang_toggle', lang)}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all border border-stone-200 dark:border-stone-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-stone-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1"
              aria-label="Toggle language"
            >
              {lang === 'en' ? (
                <><span>🇬🇧</span><span className="hidden sm:inline">EN</span></>
              ) : (
                <><span>🇵🇱</span><span className="hidden sm:inline">PL</span></>
              )}
            </button>

            {user ? (
              <button
                onClick={handleLogout}
                className="px-2 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors truncate max-w-[120px] sm:max-w-[200px]"
                title={t('nav_logout', lang)}
              >
                {user.email} ({t('nav_logout', lang)})
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
              >
                {t('nav_login', lang)}
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title={t('nav_theme_toggle', lang)}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Thin progress stripe */}
        <div className="h-0.5 bg-stone-100 dark:bg-stone-800 -mx-4 transition-colors">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-gold-400 progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
    </header>
  )
}
