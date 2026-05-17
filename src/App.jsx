import { Routes, Route, Navigate } from 'react-router-dom'
import { useSession }   from './hooks/useSession'
import { useProgress }  from './hooks/useProgress'
import { useWords }     from './hooks/useWords'
import Navigation          from './components/Navigation'
import Dashboard           from './components/Dashboard'
import LearnMode           from './components/LearnMode'
import QuizMode            from './components/QuizMode'
import BrowseMode          from './components/BrowseMode'
import SentenceBuilderMode from './components/SentenceBuilderMode'
import ListeningMode       from './components/ListeningMode'
import ErrorBoundary       from './components/ErrorBoundary'

export default function App() {
  const { sessionId, user, loading: sessionLoading } = useSession()
  const { words, fetchCustomWords } = useWords(sessionId, user)
  const { progressMap, updateProgress, loading: progressLoading, stats } =
    useProgress(sessionId, user, words)

  const isLoading = sessionLoading || progressLoading

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 transition-colors">
        <div className="text-center">
          <div className="text-4xl font-bold tracking-tight text-stone-800 dark:text-white mb-2">
            Deutsch<span className="text-brand-500">1000</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-stone-400 text-sm mt-4">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Загружаем прогресс…
          </div>
        </div>
      </div>
    )
  }

  const shared = { sessionId, user, progressMap, updateProgress, stats, words, fetchCustomWords }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      <Navigation stats={stats} user={user} />
      <main className="max-w-4xl mx-auto px-4 pb-24">
        <ErrorBoundary>
          <Routes>
            <Route path="/"                 element={<Dashboard           {...shared} />} />
            <Route path="/learn"            element={<LearnMode           {...shared} />} />
            <Route path="/listen"           element={<ListeningMode       {...shared} />} />
            <Route path="/sentence-builder" element={<SentenceBuilderMode {...shared} />} />
            <Route path="/quiz"             element={<QuizMode            {...shared} />} />
            <Route path="/browse"           element={<BrowseMode          {...shared} />} />
            <Route path="*"                 element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  )
}
