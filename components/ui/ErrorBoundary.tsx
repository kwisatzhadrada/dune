'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-[#EDEAF8] mb-2">Something went wrong</h2>
          <p className="text-sm text-[#8A88A8] mb-4">Please refresh the page.</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
            className="bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
