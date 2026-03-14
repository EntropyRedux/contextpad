import { useState, useEffect, useRef } from 'react'
import { useTemplateStore } from '../../store/templateStore'
import { useNotificationStore } from '../../store/notificationStore'
import styles from './EditorContextMenu.module.css'

interface EditorContextMenuProps {
  x: number
  y: number
  selectedText: string
  onClose: () => void
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
}

export function EditorContextMenu({
  x,
  y,
  selectedText,
  onClose,
  onCut,
  onCopy,
  onPaste
}: EditorContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const { addTemplate } = useTemplateStore()
  const addNotification = useNotificationStore(state => state.addNotification)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateCategory, setTemplateCategory] = useState('General')

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleSaveAsTemplate = () => {
    if (!selectedText) return
    setShowTemplateForm(true)
  }

  const handleCreateTemplate = () => {
    if (!templateName.trim()) {
      addNotification({
        type: 'warning',
        message: 'Validation failed',
        details: 'Please enter a template name'
      })
      return
    }

    addTemplate({
      name: templateName,
      content: selectedText,
      category: templateCategory,
      isHidden: false,
      variables: []
    })

    addNotification({
      type: 'success',
      message: 'Template created',
      details: `Created template: ${templateName}`
    })

    setTemplateName('')
    setTemplateCategory('General')
    setShowTemplateForm(false)
    onClose()
  }

  if (showTemplateForm) {
    return (
      <div
        ref={menuRef}
        className={styles.contextMenu}
        style={{ left: x, top: y }}
      >
        <div className={styles.formHeader}>Save as Template</div>
        <input
          type="text"
          placeholder="Template name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className={styles.input}
          autoFocus
        />
        <input
          type="text"
          placeholder="Category"
          value={templateCategory}
          onChange={(e) => setTemplateCategory(e.target.value)}
          className={styles.input}
        />
        <div className={styles.formButtons}>
          <button className={styles.primaryButton} onClick={handleCreateTemplate}>
            Save
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => {
              setShowTemplateForm(false)
              setTemplateName('')
              setTemplateCategory('General')
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: x, top: y }}
    >
      <button onClick={() => { onCut(); onClose(); }}>Cut</button>
      <button onClick={() => { onCopy(); onClose(); }}>Copy</button>
      <button onClick={() => { onPaste(); onClose(); }}>Paste</button>
      {selectedText && (
        <>
          <div className={styles.separator} />
          <button onClick={handleSaveAsTemplate}>Save as Template</button>
        </>
      )}
    </div>
  )
}
