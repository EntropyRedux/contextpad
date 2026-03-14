import { TabBar } from './TabBar'
import { WindowControls } from './WindowControls'
import { useWindowDrag } from '../../hooks/useWindowDrag'
import styles from './TitleBar.module.css'

export function TitleBar() {
  const { handleMouseDown } = useWindowDrag()

  return (
    <div className={styles.titleBar}>
      {/* App Icon - draggable via programmatic API */}
      <div className={styles.appIcon} onMouseDown={handleMouseDown}>
        <img src="/icon.png" alt="ContextPad" className={styles.iconImage} />
      </div>

      {/* Tab Bar with integrated drag regions */}
      <TabBar />

      {/* Window Controls */}
      <WindowControls />
    </div>
  )
}
