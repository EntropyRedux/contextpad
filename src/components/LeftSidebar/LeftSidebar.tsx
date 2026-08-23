import { useRef, useEffect, useState } from 'react'
import { useTabStore } from '../../store/tabStore'
import { useShallow } from 'zustand/react/shallow'
import { MarkdownOutline } from './MarkdownOutline'
import { FileExplorer } from './FileExplorer'
import styles from './LeftSidebar.module.css'

export type LeftSidebarTab = 'outline' | 'explorer'

export function LeftSidebar() {
  const { showLeftSidebar, toggleLeftSidebar, tabs, activeTabId } = useTabStore(
    useShallow(state => ({
      showLeftSidebar: state.showLeftSidebar,
      toggleLeftSidebar: state.toggleLeftSidebar,
      tabs: state.tabs,
      activeTabId: state.activeTabId
    }))
  )
  const [activeSidebarTab, setActiveSidebarTab] = useState<LeftSidebarTab>('outline')
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Get active tab to check if it's markdown
  const activeTab = tabs.find(t => t.id === activeTabId)
  const isMarkdown = activeTab?.language === 'markdown'

  // If viewing non-markdown, automatically switch to explorer
  useEffect(() => {
    if (!isMarkdown && activeSidebarTab === 'outline') {
      setActiveSidebarTab('explorer')
    }
  }, [isMarkdown, activeSidebarTab])

  // Handle resize
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return

      const containerRect = sidebarRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left

      // Constrain between 200px and 500px
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  if (!showLeftSidebar) return null

  return (
    <div
      ref={sidebarRef}
      className={styles.sidebarContainer}
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.tabHeader}>
          {isMarkdown && (
            <button
              className={`${styles.tabBtn} ${activeSidebarTab === 'outline' ? styles.activeTab : ''}`}
              onClick={() => setActiveSidebarTab('outline')}
            >
              OUTLINE
            </button>
          )}
          <button
            className={`${styles.tabBtn} ${activeSidebarTab === 'explorer' ? styles.activeTab : ''}`}
            onClick={() => setActiveSidebarTab('explorer')}
          >
            EXPLORER
          </button>
        </div>
        <button
          className={styles.closeBtn}
          onClick={toggleLeftSidebar}
          aria-label="Close sidebar"
          title="Close Sidebar (Ctrl+B)"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeSidebarTab === 'outline' && isMarkdown ? (
          <MarkdownOutline />
        ) : (
          <FileExplorer />
        )}
      </div>

      {/* Resize Handle */}
      <div
        className={styles.resizeHandle}
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  )
}

