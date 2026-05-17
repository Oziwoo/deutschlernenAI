import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-16 flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="text-5xl">💥</div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
