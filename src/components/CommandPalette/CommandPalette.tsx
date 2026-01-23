import { useState, useEffect, useRef, useMemo } from 'react'
import { useActionStore } from '../../store/actionStore'
import { useTemplateStore } from '../../store/templateStore'
import { useTabStore } from '../../store/tabStore'
import { useNotificationStore } from '../../store/notificationStore'
import { executeAction } from '../../utils/actionExecutor'
import { processTemplateVariables } from '../../utils/templateVariables'
import { Zap, FileText, Search } from 'lucide-react'
import styles from './CommandPalette.module.css'

interface CommandItem {
  id: string
  name: string
  description: string
  category: string
  type: 'action' | 'template'
  data: any
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { getEnabledActions } = useActionStore()
  const { getVisibleTemplates } = useTemplateStore()
  const { getActiveTab, updateTab } = useTabStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  // Build command list from actions and templates
  const commands = useMemo((): CommandItem[] => {
    const items: CommandItem[] = []

    // Add enabled actions
    getEnabledActions().forEach(action => {
      items.push({
        id: `action-${action.id}`,
        name: action.name,
        description: action.description || 'Action',
        category: action.category,
        type: 'action',
        data: action
      })
    })

    // Add visible templates
    getVisibleTemplates().forEach(template => {
      items.push({
        id: `template-${template.id}`,
        name: template.name,
        description: template.variables.length > 0
          ? `Variables: ${template.variables.join(', ')}`
          : 'Template',
        category: template.category,
        type: 'template',
        data: template
      })
    })

    return items
  }, [getEnabledActions, getVisibleTemplates])

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return commands

    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery) ||
      cmd.category.toLowerCase().includes(lowerQuery)
    )
  }, [commands, query])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredCommands.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, filteredCommands.length])

  const executeCommand = (cmd: CommandItem) => {
    const activeTab = getActiveTab()

    if (cmd.type === 'action') {
      if (!activeTab?.editorView) {
        addNotification({
          type: 'error',
          message: 'No active editor',
          details: 'Open a file first'
        })
        onClose()
        return
      }

      const result = executeAction(cmd.data.code, activeTab.editorView)
      if (result.success) {
        addNotification({
          type: 'success',
          message: cmd.name,
          details: 'Action executed'
        })
      } else {
        addNotification({
          type: 'error',
          message: 'Action failed',
          details: result.error
        })
      }
    } else if (cmd.type === 'template') {
      if (!activeTab?.editorView) {
        addNotification({
          type: 'error',
          message: 'No active editor',
          details: 'Open a file first'
        })
        onClose()
        return
      }

      const view = activeTab.editorView
      const pos = view.state.selection.main.head
      const selection = view.state.selection.main
      const selectedText = view.state.doc.sliceString(selection.from, selection.to)

      const processed = processTemplateVariables(cmd.data.content, selectedText)

      view.dispatch({
        changes: { from: pos, insert: processed.content },
        selection: {
          anchor: processed.cursorOffset !== null
            ? pos + processed.cursorOffset
            : pos + processed.content.length
        }
      })

      updateTab(activeTab.id, { isDirty: true })
      view.focus()

      addNotification({
        type: 'success',
        message: cmd.name,
        details: 'Template inserted'
      })
    }

    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.palette} onClick={e => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actions and templates..."
            className={styles.input}
          />
        </div>

        <div className={styles.list} ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className={styles.empty}>
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={styles.itemIcon}>
                  {cmd.type === 'action' ? <Zap size={16} /> : <FileText size={16} />}
                </div>
                <div className={styles.itemContent}>
                  <div className={styles.itemName}>{cmd.name}</div>
                  <div className={styles.itemDescription}>{cmd.description}</div>
                </div>
                <div className={styles.itemCategory}>
                  {cmd.category}
                </div>
                <div className={styles.itemType}>
                  {cmd.type}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Execute</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}
