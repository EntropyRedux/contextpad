import { useEffect } from 'react'
import { useFileOperations } from './useFileOperations'
import { useTabStore } from '../store/tabStore'
import { useTemplateStore } from '../store/templateStore'
import { useNotificationStore } from '../store/notificationStore'

export function useKeyboardShortcuts() {
  const { openFile, saveFile, saveFileAs, newFile } = useFileOperations()
  const { tabs, activeTabId, setActiveTab, removeTab, toggleRightSidebar, toggleLeftSidebar } = useTabStore()
  const { addTemplate } = useTemplateStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd key detection
      const isCtrl = e.ctrlKey || e.metaKey

      if (!isCtrl) return

      // Ctrl+N or Ctrl+T: New tab
      if ((e.key === 'n' || e.key === 't') && !e.shiftKey) {
        e.preventDefault()
        newFile()
        return
      }

      // Ctrl+O: Open file
      if (e.key === 'o' && !e.shiftKey) {
        e.preventDefault()
        openFile()
        return
      }

      // Ctrl+S: Save file
      if (e.key === 's' && !e.shiftKey) {
        e.preventDefault()
        saveFile()
        return
      }

      // Ctrl+Shift+S: Save as
      if (e.key === 's' && e.shiftKey) {
        e.preventDefault()
        saveFileAs()
        return
      }

      // Ctrl+Shift+T: Save selection as template
      if (e.key === 'T' && e.shiftKey) {
        e.preventDefault()
        const selection = window.getSelection()
        const selectedText = selection?.toString() || ''

        if (selectedText) {
          const templateName = prompt('Template name:', '')
          if (templateName) {
            const category = prompt('Category (optional):', 'General')
            addTemplate({
              name: templateName,
              content: selectedText,
              category: category || 'General',
              isHidden: false,
              variables: []
            })
          }
        } else {
          addNotification({
            type: 'warning',
            message: 'No selection',
            details: 'Please select some text first'
          })
        }
        return
      }

      // Ctrl+F: Find
      if (e.key === 'f' && !e.shiftKey) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('open-search', { detail: { mode: 'find' } }))
        return
      }

      // Ctrl+H: Replace
      if (e.key === 'h' && !e.shiftKey) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('open-search', { detail: { mode: 'replace' } }))
        return
      }

      // Ctrl+B: Toggle Left Sidebar (Outline)
      if (e.key === 'b' && !e.shiftKey) {
        e.preventDefault()
        toggleLeftSidebar()
        return
      }

      // Ctrl+,: Toggle Settings Sidebar
      if (e.key === ',') {
        e.preventDefault()
        toggleRightSidebar()
        return
      }

      // Ctrl+W: Close tab
      if (e.key === 'w') {
        e.preventDefault()
        if (activeTabId) {
          const activeTab = tabs.find(t => t.id === activeTabId)
          if (activeTab?.isDirty) {
            if (confirm(`Close "${activeTab.title}" without saving?`)) {
              removeTab(activeTabId)
            }
          } else {
            removeTab(activeTabId)
          }
        }
        return
      }

      // Ctrl+Tab: Next tab
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        const currentIndex = tabs.findIndex(t => t.id === activeTabId)
        if (currentIndex !== -1 && tabs.length > 1) {
          const nextIndex = (currentIndex + 1) % tabs.length
          setActiveTab(tabs[nextIndex].id)
        }
        return
      }

      // Ctrl+Shift+Tab: Previous tab
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        const currentIndex = tabs.findIndex(t => t.id === activeTabId)
        if (currentIndex !== -1 && tabs.length > 1) {
          const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
          setActiveTab(tabs[prevIndex].id)
        }
        return
      }

      // Ctrl+1-8: Jump to tab N
      if (e.key >= '1' && e.key <= '8') {
        e.preventDefault()
        const tabIndex = parseInt(e.key) - 1
        if (tabs[tabIndex]) {
          setActiveTab(tabs[tabIndex].id)
        }
        return
      }

      // Ctrl+9: Jump to last tab
      if (e.key === '9') {
        e.preventDefault()
        if (tabs.length > 0) {
          setActiveTab(tabs[tabs.length - 1].id)
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId, openFile, saveFile, saveFileAs, newFile, setActiveTab, removeTab, toggleRightSidebar, toggleLeftSidebar, addTemplate])
}
