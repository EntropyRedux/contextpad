import { useState, useEffect, useRef } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { useTabStore } from '../../store/tabStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useSettingsStore } from '../../store/settingsStore'
import { statistics, DocumentStats } from '../../services/statisticsService'
import {
  tokenEstimator,
  TokenEstimatorState,
  MODEL_REGISTRY,
  getModelById
} from '../../services/tokenEstimator'
import { resolveModel, calculateUsageStats } from '../../utils/tokenUtils'
import { TokenStatsPopup } from './TokenStatsPopup'
import styles from './StatusBar.module.css'

export function StatusBar() {
  const activeTab = useTabStore(state => {
    const tab = state.tabs.find(t => t.id === state.activeTabId)
    return tab
  })

  const cursorInfo = useTabStore(state => state.cursorInfo)
  const viewSettings = useTabStore(state => state.viewSettings)
  const showTokenStats = viewSettings.showTokenStats
  const indexingScope = viewSettings.indexingScope
  const { tokenSettings, customModels } = useSettingsStore(state => ({
    tokenSettings: state.tokenSettings,
    customModels: state.customModels
  }))

  // Basic document stats (sync, fast)
  const [basicStats, setBasicStats] = useState<DocumentStats | null>(null)

  // Token estimator state (event-based)
  const [tokenState, setTokenState] = useState<TokenEstimatorState>(tokenEstimator.getState())

  const [showStatsModal, setShowStatsModal] = useState(false)

  const currentNotification = useNotificationStore(state => state.currentNotification)
  const [showNotificationDetails, setShowNotificationDetails] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)

  // Track previous model to detect model changes
  const prevModelRef = useRef(tokenSettings.selectedModel)

  // Subscribe to token estimator state changes
  useEffect(() => {
    const unsubscribe = tokenEstimator.subscribe(setTokenState)
    return unsubscribe
  }, [])

  // Transient pulsing animation when typing
  useEffect(() => {
    if (activeTab?.lastModifiedTime) {
      setIsPulsing(true)
      const timer = setTimeout(() => setIsPulsing(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [activeTab?.lastModifiedTime])

  // Calculate basic stats and trigger token calculation on content change
  useEffect(() => {
    if (activeTab?.content !== undefined) {
      // Basic stats (sync, fast)
      setBasicStats(statistics.calculateStats(activeTab.content))

      // Token calculation (async, debounced internally by tokenEstimator)
      tokenEstimator.calculate(
        activeTab.content,
        tokenSettings.selectedModel,
        indexingScope
      )
    } else {
      setBasicStats(null)
      tokenEstimator.reset()
    }
  }, [activeTab?.content, indexingScope])

  // Force immediate recalculation when model changes
  useEffect(() => {
    if (prevModelRef.current !== tokenSettings.selectedModel) {
      prevModelRef.current = tokenSettings.selectedModel

      if (activeTab?.content) {
        tokenEstimator.calculateImmediate(
          activeTab.content,
          tokenSettings.selectedModel,
          indexingScope
        )
      }
    }
  }, [tokenSettings.selectedModel, activeTab?.content, indexingScope])

  const formatNumber = (num: number) => num.toLocaleString()

  const getTokenColorClass = () => {
    if (tokenState.tokens === null) return ''

    const model = resolveModel(tokenSettings.selectedModel, customModels)
    const usage = calculateUsageStats(
      tokenState.tokens, 
      tokenState.cost ?? undefined, 
      tokenSettings, 
      model
    )

    // Map percentage to CSS classes based on thresholds
    const ratio = usage.percentage / 100
    
    if (ratio >= tokenSettings.colorThresholds.danger) return styles.tokenDanger
    if (ratio >= tokenSettings.colorThresholds.warning) return styles.tokenWarning
    return styles.tokenSafe
  }

  // Determine status color/state
  const getStatusState = () => {
    if (currentNotification) {
      // Map type to display label
      let label = 'Notification'
      if (currentNotification.type === 'success') label = 'Success'
      if (currentNotification.type === 'error') label = 'Error'
      if (currentNotification.type === 'info') label = 'Info'
      if (currentNotification.type === 'warning') label = 'Warning'

      return {
        type: currentNotification.type,
        colorClass: styles[`status${currentNotification.type.charAt(0).toUpperCase() + currentNotification.type.slice(1)}`],
        textClass: styles[`text${currentNotification.type.charAt(0).toUpperCase() + currentNotification.type.slice(1)}`],
        label: label,
        message: currentNotification.message,
        isExpanded: true
      }
    }
    if (activeTab?.isDirty) {
      return {
        type: 'dirty',
        colorClass: styles.statusDirty,
        textClass: '',
        label: '',
        message: '',
        isExpanded: false
      }
    }
    return {
      type: 'clean',
      colorClass: styles.statusClean,
      textClass: '',
      label: '',
      message: '',
      isExpanded: false
    }
  }

  const status = getStatusState()

  // Build stats object for TokenStatsPopup compatibility
  const statsForPopup = basicStats ? {
    ...basicStats,
    tokens: tokenState.tokens !== null ? {
      tokens: tokenState.tokens,
      method: tokenState.method || 'local',
      model: tokenState.model || tokenSettings.selectedModel,
      cached: tokenState.cached,
      cost: tokenState.cost ?? undefined
    } : null
  } : null

  return (
    <div className={styles.statusBar}>
      <div className={styles.left}>
        {/* Status Line Indicator */}
        <div
          className={`${styles.statusLineContainer} ${status.isExpanded ? styles.expanded : ''} ${status.type === 'dirty' && isPulsing ? styles.containerDirty : ''}`}
          title={status.message || (activeTab?.isDirty ? 'Unsaved Changes' : 'Ready')}
          onClick={() => currentNotification && setShowNotificationDetails(!showNotificationDetails)}
        >
          <div className={`${styles.statusIndicator} ${status.colorClass}`} />

          <span className={styles.statusText}>
            {status.label}
          </span>
        </div>

        {/* Notification Popup Details */}
        {showNotificationDetails && currentNotification && (
          <div className={styles.notificationPopup}>
            <div className={styles.notificationHeader}>
              <div className={`${styles.typeIndicator} ${status.colorClass}`} />
              <span>{status.label} Details</span>
            </div>
            <div className={styles.notificationMessage}>
              {currentNotification.message}
            </div>
            {currentNotification.details && (
              <div className={styles.notificationDetails}>
                {currentNotification.details}
              </div>
            )}
            <div className={styles.notificationTime}>
              {new Date(currentNotification.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      <div className={styles.right}>
        {cursorInfo && (
          <span className={styles.item}>
            Ln {cursorInfo.line}, Col {cursorInfo.column}
          </span>
        )}
        {basicStats && (
          <span className={styles.item}>
            {formatNumber(basicStats.characters)} chars
          </span>
        )}

        {/* Token Statistics */}
        <div className={styles.statsSection}>
          {tokenState.status === 'calculating' ? (
            <div className={styles.calculating}>
              <Loader2 size={12} className={styles.spin} />
              <span>Calculating...</span>
            </div>
          ) : tokenState.status === 'ready' && tokenState.tokens !== null && showTokenStats ? (
            <>
              <div
                className={`${styles.tokenStats} ${getTokenColorClass()}`}
                onClick={() => setShowStatsModal(!showStatsModal)}
                style={{ cursor: 'pointer' }}
                title="Click for detailed statistics"
              >
                <span>
                  {tokenState.isApproximate && '~'}
                  {tokenState.tokens.toLocaleString()} tokens
                </span>

                {tokenState.method === 'online' && (
                  <span className={styles.badge} style={{ background: '#3b82f6' }}>Live</span>
                )}

                {tokenState.cached && (
                  <span className={styles.badge} style={{ background: '#10b981' }}>Cached</span>
                )}

                {tokenState.isApproximate && (
                  <span
                    className={styles.badge}
                    style={{ background: '#f59e0b' }}
                    title="Estimated using local approximation (document exceeds indexing scope)"
                  >
                    Est
                  </span>
                )}

                {tokenState.cost !== null && (
                  <span className={styles.cost}>
                    ${tokenState.cost.toFixed(4)}
                  </span>
                )}
              </div>

              {showStatsModal && statsForPopup && (
                <TokenStatsPopup
                  stats={statsForPopup}
                  tokenConfig={tokenSettings}
                  onClose={() => setShowStatsModal(false)}
                />
              )}
            </>
          ) : tokenState.status === 'error' ? (
            <div className={styles.error} title={tokenState.error || 'Unknown error'}>
              <AlertCircle size={12} />
              <span>{tokenState.error || 'Token error'}</span>
            </div>
          ) : null}
        </div>

        {activeTab && (
          <>
            <span className={styles.item}>
              {activeTab.language === 'markdown' ? 'Markdown' : activeTab.language.toUpperCase()}
            </span>
            <span className={styles.item}>UTF-8</span>
          </>
        )}
      </div>
    </div>
  )
}
