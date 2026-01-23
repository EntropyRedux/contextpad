import { useTabStore } from '../../store/tabStore'
import styles from './Settings.module.css'

interface SettingsProps {
  onClose: () => void
}

export function Settings({ onClose }: SettingsProps) {
  const { viewSettings, setViewSettings } = useTabStore()

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value)
    if (size >= 8 && size <= 32) {
      setViewSettings({ fontSize: size })
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>View</h3>

            <div className={styles.setting}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={viewSettings.showStatusBar}
                  onChange={(e) => setViewSettings({ showStatusBar: e.target.checked })}
                />
                <span>Show Status Bar</span>
              </label>
            </div>

            <div className={styles.setting}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={viewSettings.showLineNumbers}
                  onChange={(e) => setViewSettings({ showLineNumbers: e.target.checked })}
                />
                <span>Show Line Numbers</span>
              </label>
            </div>

            <div className={styles.setting}>
              <label className={styles.rangeLabel}>
                <span>Font Size: {viewSettings.fontSize}px</span>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={viewSettings.fontSize}
                  onChange={handleFontSizeChange}
                  className={styles.range}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
