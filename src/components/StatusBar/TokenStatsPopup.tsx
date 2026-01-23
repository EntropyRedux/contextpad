import React, { useRef, useEffect } from 'react'
import { Activity } from 'lucide-react'
import { DocumentStats } from '../../services/statisticsService'
import { TokenConfig } from '../../types/tokenTypes'
import { useSettingsStore } from '../../store/settingsStore'
import { resolveModel, calculateUsageStats } from '../../utils/tokenUtils'
import styles from './StatusBar.module.css'

interface TokenStatsPopupProps {
  stats: (DocumentStats & {
    tokens: {
      tokens: number
      method: string
      model: string
      cached: boolean
      cost?: number
    } | null
  }) | null
  tokenConfig: TokenConfig
  onClose: () => void
}

export const TokenStatsPopup: React.FC<TokenStatsPopupProps> = ({ stats, tokenConfig, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null)
  
  // Get full settings for thresholds
  const { customModels, tokenSettings } = useSettingsStore(state => ({
    customModels: state.customModels,
    tokenSettings: state.tokenSettings
  }))

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside the popup
      if (popupRef.current && popupRef.current.contains(event.target as Node)) {
        return
      }
      // Close if clicking outside
      onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  if (!stats || !stats.tokens) return null

  const model = resolveModel(tokenConfig.selectedModel, customModels)
  const usage = calculateUsageStats(stats.tokens.tokens, stats.tokens.cost, tokenSettings, model)

  return (
    <div className={styles.statsPopup} ref={popupRef}>
      <div className={styles.statsHeader}>
        <Activity size={14} />
        <span>Statistics</span>
      </div>

      <div className={styles.popupSection}>
        <div className={styles.sectionLabel}>Usage</div>
        <div className={styles.usageHeader}>
          <span className={styles.usageValue}>{stats.tokens.tokens.toLocaleString()}</span>
          <span className={styles.usageLimit}>/ {usage.limitLabel}</span>
        </div>
        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{
              width: `${Math.min(usage.percentage, 100)}%`,
              backgroundColor: usage.color
            }}
          />
        </div>
        <div className={styles.usageMeta}>
          <span>{usage.percentage.toFixed(1)}%</span>
          <span>{stats.tokens.method === 'online' ? 'Exact' : 'Est.'}</span>
        </div>
      </div>

      <div className={styles.popupGrid}>
        <div className={styles.popupSection}>
          <div className={styles.sectionLabel}>Metrics</div>
          <div className={styles.popupMetricRow}>
            <span className={styles.popupMetricLabel}>Chars</span>
            <span className={styles.popupMetricValue}>{stats.characters.toLocaleString()}</span>
          </div>
          <div className={styles.popupMetricRow}>
            <span className={styles.popupMetricLabel}>Words</span>
            <span className={styles.popupMetricValue}>{stats.words.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.popupSection}>
          <div className={styles.sectionLabel}>Model</div>
          <div className={styles.popupMetricRow}>
            <span className={styles.popupMetricLabel}>Cost</span>
            <span className={styles.popupMetricValue}>${stats.tokens.cost?.toFixed(4) || '0.0000'}</span>
          </div>
          <div className={styles.popupMetricRow}>
            <span className={styles.popupMetricLabel}>Type</span>
            <span className={styles.popupMetricValue} style={{ fontSize: '10px' }}>{model.name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
