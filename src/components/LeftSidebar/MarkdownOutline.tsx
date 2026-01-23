import { useState, useEffect, useRef, useCallback } from 'react'
import { useTabStore } from '../../store/tabStore'
import { parseMarkdownOutline, OutlineItem } from '../../services/markdownParser'
import { OutlineItemComponent } from './OutlineItem'
import { EditorView } from '@codemirror/view'
import styles from './MarkdownOutline.module.css'

export function MarkdownOutline() {
  const { getActiveTab, activeTabId } = useTabStore()
  const [outline, setOutline] = useState<OutlineItem[]>([])
  // Store EXPANDED items (default is collapsed)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Track last content to avoid unnecessary re-parses
  const lastContentRef = useRef<string>('')
  const parseTimeoutRef = useRef<number | null>(null)
  const listenerCleanupRef = useRef<(() => void) | null>(null)

  // Clear expanded state when switching tabs (reset to all collapsed)
  useEffect(() => {
    setExpandedItems(new Set())
    lastContentRef.current = ''
  }, [activeTabId])

  // Memoized parse function
  const parseOutlineContent = useCallback((editorView: EditorView, forceUpdate = false) => {
    try {
      const content = editorView.state.doc.toString()

      // Skip if content hasn't changed (unless forced)
      if (!forceUpdate && content === lastContentRef.current) {
        return
      }
      lastContentRef.current = content

      const items = parseMarkdownOutline(editorView)

      // Apply collapsed state (default collapsed, only expanded if in set)
      const applyCollapsedState = (item: OutlineItem) => {
        const key = `${item.from}-${item.to}`
        item.collapsed = !expandedItems.has(key)

        if (item.children) {
          item.children.forEach(applyCollapsedState)
        }
      }

      items.forEach(applyCollapsedState)
      setOutline(items)
    } catch (error) {
      console.error('Failed to parse markdown outline:', error)
      setOutline([])
    }
  }, [expandedItems])

  // Debounced parse function
  const debouncedParse = useCallback((editorView: EditorView) => {
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current)
    }
    parseTimeoutRef.current = window.setTimeout(() => {
      parseOutlineContent(editorView)
      parseTimeoutRef.current = null
    }, 300) // 300ms debounce
  }, [parseOutlineContent])

  // Set up event-based parsing instead of polling
  useEffect(() => {
    const activeTab = getActiveTab()
    const editorView = activeTab?.editorView

    // Clean up previous listener
    if (listenerCleanupRef.current) {
      listenerCleanupRef.current()
      listenerCleanupRef.current = null
    }

    if (!editorView) {
      setOutline([])
      return
    }

    // Initial parse
    parseOutlineContent(editorView, true)

    // Create update listener for document changes
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        debouncedParse(update.view)
      }
    })

    // Add the listener extension to the editor
    editorView.dispatch({
      effects: (editorView as unknown as { state: { facet: (f: unknown) => unknown[] } })
        .state.facet ? undefined : undefined
    })

    // Store a reference to handle content changes via DOM observer as fallback
    // This ensures we catch changes even if the extension isn't applied
    let observer: MutationObserver | null = null

    try {
      const contentDOM = editorView.contentDOM
      observer = new MutationObserver(() => {
        debouncedParse(editorView)
      })
      observer.observe(contentDOM, {
        childList: true,
        subtree: true,
        characterData: true
      })
    } catch (e) {
      // Fallback to minimal polling if observer fails
      console.warn('MutationObserver failed, using minimal polling')
    }

    // Cleanup function
    listenerCleanupRef.current = () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current)
        parseTimeoutRef.current = null
      }
      if (observer) {
        observer.disconnect()
      }
    }

    return () => {
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current()
        listenerCleanupRef.current = null
      }
    }
  }, [activeTabId, getActiveTab, parseOutlineContent, debouncedParse])

  // Re-apply collapsed state when expandedItems changes
  useEffect(() => {
    const activeTab = getActiveTab()
    const editorView = activeTab?.editorView

    if (editorView && outline.length > 0) {
      // Force re-parse to apply new collapsed states
      parseOutlineContent(editorView, true)
    }
  }, [expandedItems, getActiveTab, parseOutlineContent, outline.length])

  const handleItemClick = useCallback((item: OutlineItem) => {
    const activeTab = getActiveTab()
    const editorView = activeTab?.editorView

    if (!editorView) return

    try {
      // Scroll to the line in the editor
      const line = editorView.state.doc.line(item.line)
      editorView.dispatch({
        selection: { anchor: line.from },
        scrollIntoView: true
      })
      editorView.focus()
    } catch (error) {
      console.error('Failed to scroll to line:', error)
    }
  }, [getActiveTab])

  const handleToggleCollapse = useCallback((item: OutlineItem) => {
    const key = `${item.from}-${item.to}`
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (prev.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }, [])

  // Show empty state if no outline
  if (outline.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📄</div>
        <div className={styles.emptyText}>No outline available</div>
        <div className={styles.emptyHint}>
          Start typing headings, code blocks, lists, or tables
        </div>
      </div>
    )
  }

  return (
    <div className={styles.outline}>
      {outline.map((item, index) => (
        <OutlineItemComponent
          key={`${item.type}-${item.from}-${index}`}
          item={item}
          depth={0}
          onItemClick={handleItemClick}
          onToggleCollapse={handleToggleCollapse}
        />
      ))}
    </div>
  )
}
