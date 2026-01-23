import { TabBar } from './TabBar'
import { WindowControls } from './WindowControls'
import styles from './TitleBar.module.css'

export function TitleBar() {
  return (
    <div className={styles.titleBar}>
      {/* App Icon - draggable */}
      <div className={styles.appIcon} data-tauri-drag-region>
        <img src="/icon.png" alt="ContextPad" className={styles.iconImage} />
      </div>

      {/* Tab Bar with integrated drag regions */}
      <TabBar />

      {/* Window Controls */}
      <WindowControls />
    </div>
  )
}
