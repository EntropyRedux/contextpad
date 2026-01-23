import { useRef, useEffect, useState } from 'react'
import { useTabStore } from '../../store/tabStore'
import { MarkdownOutline } from './MarkdownOutline'
import styles from './LeftSidebar.module.css'

export function LeftSidebar() {
  const { showLeftSidebar, toggleLeftSidebar, tabs, activeTabId } = useTabStore()
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Get active tab to check if it's markdown
  const activeTab = tabs.find(t => t.id === activeTabId)

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

  // Only show sidebar for markdown files
  if (!showLeftSidebar || activeTab?.language !== 'markdown') return null

  return (
    <div
      ref={sidebarRef}
      className={styles.sidebarContainer}
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>OUTLINE</div>
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
        <MarkdownOutline />
      </div>

      {/* Resize Handle */}
      <div
        className={styles.resizeHandle}
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  )
}
