import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useNotificationStore } from '../store/notificationStore'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Logical name shown in the fallback UI and error notifications. */
  name?: string
  /** Optional custom fallback node. */
  fallback?: ReactNode
  /** Called on every caught error (telemetry hook). */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  /** Bumped on "Try Again" so React remounts the failing subtree. */
  remountKey: number
}

/**
 * Class-based React error boundary. Uses the notification store's
 * `getState()` accessor from componentDidCatch (hooks are not allowed in
 * class components). Errors are isolated per region so a crash in the editor
 * does not take down the whole shell.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, remountKey: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const label = this.props.name || 'component'
    console.error(`[ErrorBoundary:${label}]`, error, errorInfo.componentStack)

    try {
      useNotificationStore.getState().addNotification({
        type: 'error',
        message: `A ${label} error occurred`,
        details: error.message,
        duration: 8000
      })
    } catch (notifyError) {
      // Never let notification failures mask the original error
      console.error('[ErrorBoundary] failed to notify:', notifyError)
    }

    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      remountKey: prev.remountKey + 1
    }))
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <h2 className={styles.title}>Something went wrong</h2>
            {this.props.name && (
              <p className={styles.region}>
                in <code>{this.props.name}</code>
              </p>
            )}
            <p className={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className={styles.actions}>
              <button className={styles.primary} onClick={this.handleReset}>
                Try Again
              </button>
              <button className={styles.secondary} onClick={() => window.location.reload()}>
                Reload App
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Keyed wrapper: bumping remountKey forces a fresh mount of the subtree,
    // so "Try Again" cannot get stuck on the same broken render output.
    return <React.Fragment key={this.state.remountKey}>{this.props.children}</React.Fragment>
  }
}