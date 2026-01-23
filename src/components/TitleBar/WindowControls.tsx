import { invoke } from '@tauri-apps/api/core'
import { useState, useEffect } from 'react'
import styles from './WindowControls.module.css'

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false)

  const minimize = () => invoke('minimize_window')
  const toggleMaximize = async () => {
    if (isMaximized) {
      await invoke('unmaximize_window')
    } else {
      await invoke('maximize_window')
    }
    setIsMaximized(!isMaximized)
  }
  const close = () => invoke('close_window')

  useEffect(() => {
    invoke<boolean>('is_maximized').then(setIsMaximized)
  }, [])

  return (
    <div className={styles.windowControls}>
      <button className={styles.btn} onClick={minimize}>
        <span>−</span>
      </button>
      <button className={styles.btn} onClick={toggleMaximize}>
        <span>{isMaximized ? '❐' : '□'}</span>
      </button>
      <button className={`${styles.btn} ${styles.close}`} onClick={close}>
        <span>×</span>
      </button>
    </div>
  )
}
