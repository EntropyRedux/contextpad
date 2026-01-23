import React, { useRef, useEffect } from 'react'
import { X, Cpu, FileText, DollarSign, Activity } from 'lucide-react'
import { DocumentStats } from '../../services/statisticsService'
import { TokenConfig } from '../../types/tokenTypes'
import { useSettingsStore } from '../../store/settingsStore'
import { resolveModel, calculateUsageStats } from '../../utils/tokenUtils'
import styles from './TokenStatsModal.module.css'

interface TokenStatsModalProps {
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

export const TokenStatsModal: React.FC<TokenStatsModalProps> = ({ stats, tokenConfig, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null)
  
  const { customModels, tokenSettings } = useSettingsStore(state => ({
    customModels: state.customModels,
    tokenSettings: state.tokenSettings
  }))

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
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
    <div className={styles.overlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <div className={styles.title}>
            <Activity size={18} />
            <span>Document Statistics</span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Token Usage Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Cpu size={16} />
              <span>Token Usage</span>
            </div>

            <div className={styles.usageCard}>
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
                <span>{usage.percentage.toFixed(2)}% used</span>
                <span className={styles.badge}>{stats.tokens.method === 'online' ? 'Exact Count (Online)' : 'Local Estimation'}</span>
              </div>
            </div>
          </div>

          <div className={styles.grid}>
            {/* Document Metrics */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <FileText size={16} />
                <span>Metrics</span>
              </div>
              <div className={styles.metricsList}>
                <div className={styles.metricRow}>
                  <span>Characters</span>
                  <span className={styles.metricValue}>{stats.characters.toLocaleString()}</span>
                </div>
                <div className={styles.metricRow}>
                  <span>Words</span>
                  <span className={styles.metricValue}>{stats.words.toLocaleString()}</span>
                </div>
                <div className={styles.metricRow}>
                  <span>Lines</span>
                  <span className={styles.metricValue}>{stats.lines.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Cost & Model Info */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <DollarSign size={16} />
                <span>Cost & Model</span>
              </div>
              <div className={styles.metricsList}>
                <div className={styles.metricRow}>
                  <span>Est. Cost</span>
                  <span className={styles.metricValue}>${stats.tokens.cost?.toFixed(5) || '0.00000'}</span>
                </div>
                <div className={styles.metricRow}>
                  <span>Model</span>
                  <span className={styles.metricValue}>{model.name}</span>
                </div>
                <div className={styles.metricRow}>
                  <span>Provider</span>
                  <span className={styles.metricValue}>{model.provider}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
