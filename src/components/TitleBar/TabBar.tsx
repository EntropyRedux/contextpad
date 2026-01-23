import { useRef, useState, useEffect } from 'react'
import { useTabStore, Tab } from '../../store/tabStore'
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './TabBar.module.css'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab, reorderTabs } = useTabStore()
  const tabContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  
  // Drag and Drop state
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null)
  const dragStartX = useRef(0)
  const isDraggingRef = useRef(false)

  const checkOverflow = () => {
    if (tabContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1)
    }
  }

  useEffect(() => {
    const timer = setTimeout(checkOverflow, 10)
    const container = tabContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkOverflow)
      window.addEventListener('resize', checkOverflow)
      return () => {
        clearTimeout(timer)
        container.removeEventListener('scroll', checkOverflow)
        window.removeEventListener('resize', checkOverflow)
      }
    }
    return () => clearTimeout(timer)
  }, [tabs])

  const scrollLeft = () => {
    tabContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    tabContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  // --- MANUAL DRAG LOGIC ---

  const handleMouseDown = (e: React.MouseEvent, tabId: string) => {
    // Don't drag if clicking close button
    if ((e.target as HTMLElement).closest(`.${styles.closeBtn}`)) {
      return
    }

    setDraggedTabId(tabId)
    dragStartX.current = e.clientX
    isDraggingRef.current = false // Haven't moved yet
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedTabId) return

    // Minimal movement threshold to start drag
    if (!isDraggingRef.current && Math.abs(e.clientX - dragStartX.current) > 5) {
      isDraggingRef.current = true
      document.body.style.cursor = 'grabbing'
    }

    if (isDraggingRef.current) {
      // Find which tab we're hovering over
      const elements = document.querySelectorAll(`.${styles.tab}`)
      const mouseX = e.clientX

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (mouseX >= rect.left && mouseX <= rect.right) {
          const id = el.getAttribute('data-tab-id')
          if (id) setDragOverTabId(id)
        }
      })
    }
  }

  const handleMouseUp = () => {
    if (isDraggingRef.current && draggedTabId && dragOverTabId && draggedTabId !== dragOverTabId) {
      const fromIndex = tabs.findIndex(t => t.id === draggedTabId)
      const toIndex = tabs.findIndex(t => t.id === dragOverTabId)
      
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderTabs(fromIndex, toIndex)
      }
    }

    setDraggedTabId(null)
    setDragOverTabId(null)
    isDraggingRef.current = false
    document.body.style.cursor = ''
  }

  useEffect(() => {
    if (draggedTabId) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggedTabId, dragOverTabId])

  const handleClose = (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation()
    if (tab.isDirty) {
      const confirmClose = window.confirm(
        `Save changes to "${tab.title}" before closing? \n\nClick OK to close without saving.\nClick Cancel to keep editing.`
      )
      if (!confirmClose) return
    }
    removeTab(tab.id)
  }

  return (
    <div className={styles.tabBarWrapper}>
      {showLeftArrow && (
        <button className={styles.scrollBtn} onClick={scrollLeft}>
          <ChevronLeft size={14} />
        </button>
      )}

      <div className={styles.tabBar} ref={tabContainerRef}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const isDragging = tab.id === draggedTabId
          const isDragOver = tab.id === dragOverTabId

          return (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              className={`${styles.tab} ${isActive ? styles.active : ''} ${isDragging ? styles.dragging : ''} ${isDragOver && !isDragging ? styles.dragOver : ''}`}
              onClick={() => !isDraggingRef.current && setActiveTab(tab.id)}
              onMouseDown={(e) => handleMouseDown(e, tab.id)}
            >
              <span className={styles.tabTitle}>{tab.title}</span>

              {tab.isDirty && <div className={styles.dirtyIndicator}>●</div>}

              <button
                className={`${styles.closeBtn} ${tab.isDirty ? styles.closeBtnDirty : ''}`}
                onClick={(e) => handleClose(e, tab)}
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking close
                title={tab.isDirty ? "Unsaved changes" : "Close tab"}
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {showRightArrow && (
        <button className={styles.scrollBtn} onClick={scrollRight}>
          <ChevronRight size={14} />
        </button>
      )}

      <button
        className={styles.addTabBtn}
        onClick={() => addTab()}
        title="New tab"
      >
        <Plus size={16} />
      </button>

      {/* Draggable empty space - fills remaining area */}
      <div className={styles.dragSpacer} data-tauri-drag-region />
    </div>
  )
}
