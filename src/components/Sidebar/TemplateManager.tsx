import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTemplateStore } from '../../store/templateStore'
import { useTabStore } from '../../store/tabStore'
import { useNotificationStore } from '../../store/notificationStore'
import { Plus, Download, Upload, Eye, EyeOff, Edit2, Trash2, FileText, MousePointerClick, Play } from 'lucide-react'
import { processTemplateVariables } from '../../utils/templateVariables'
import styles from './TemplateManager.module.css'

export function TemplateManager() {
  const {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateVisibility,
    exportTemplates,
    importTemplates
  } = useTemplateStore()

  const { getActiveTab, updateTab } = useTabStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'General'
  })

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, t) => {
    if (!showHidden && t.isHidden) return acc
    
    if (!acc[t.category]) {
      acc[t.category] = []
    }
    acc[t.category].push(t)
    return acc
  }, {} as Record<string, typeof templates>)

  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedTemplates).sort()

  // Filter categories based on selection
  const visibleCategories = selectedCategories.length > 0 
    ? sortedCategories.filter(c => selectedCategories.includes(c))
    : sortedCategories

  const handleCategoryClick = (category: string, e: React.MouseEvent) => {
    e.preventDefault()
    
    // Ctrl/Cmd + Click: Toggle selection (Multi-select)
    if (e.ctrlKey || e.metaKey) {
      setSelectedCategories(prev => 
        prev.includes(category) 
          ? prev.filter(c => c !== category)
          : [...prev, category]
      )
    } else {
      // Single Click: Exclusive select
      setSelectedCategories([category])
    }
  }

  const handleCategoryDoubleClick = (category: string) => {
    // Double click: Remove from filter (if it's the only one, show all)
    setSelectedCategories(prev => prev.filter(c => c !== category))
  }

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.content.trim()) return

    addTemplate({
      name: formData.name,
      content: formData.content,
      category: formData.category,
      isHidden: false,
      variables: []
    })

    setFormData({ name: '', content: '', category: 'General' })
    setShowAddForm(false)
  }

  const handleEdit = (id: string) => {
    const template = templates.find(t => t.id === id)
    if (template) {
      setFormData({
        name: template.name,
        content: template.content,
        category: template.category
      })
      setEditingId(id)
      setShowAddForm(true)
    }
  }

  const handleUpdate = () => {
    if (!editingId || !formData.name.trim() || !formData.content.trim()) return

    updateTemplate(editingId, {
      name: formData.name,
      content: formData.content,
      category: formData.category
    })

    setFormData({ name: '', content: '', category: 'General' })
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleExport = async () => {
    try {
      const json = exportTemplates()
      const defaultName = `templates-${new Date().toISOString().split('T')[0]}.json`
      const filePath = await invoke<string | null>('save_file_dialog', { defaultName })

      if (!filePath) return // User cancelled

      await invoke('write_file', { path: filePath, content: json })
      addNotification({
        type: 'success',
        message: 'Templates exported',
        details: `Saved to: ${filePath}`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Export failed',
        details: String(error)
      })
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        try {
          importTemplates(text)
          addNotification({
            type: 'success',
            message: 'Templates imported',
            details: 'Successfully imported templates from JSON'
          })
        } catch (error) {
          addNotification({
            type: 'error',
            message: 'Import failed',
            details: String(error)
          })
        }
      }
    }
    input.click()
  }

  const handleUseTemplate = (templateContent: string) => {
    const activeTab = getActiveTab()
    if (activeTab?.editorView) {
      const view = activeTab.editorView
      const pos = view.state.selection.main.head

      // Get selected text for {{SELECTION}} variable
      const selection = view.state.selection.main
      const selectedText = view.state.doc.sliceString(selection.from, selection.to)

      // Process template variables
      const processed = processTemplateVariables(templateContent, selectedText)

      // Insert processed template
      view.dispatch({
        changes: { from: pos, insert: processed.content },
        selection: {
          anchor: processed.cursorOffset !== null
            ? pos + processed.cursorOffset
            : pos + processed.content.length
        }
      })

      // Mark as dirty
      updateTab(activeTab.id, { isDirty: true })

      // Focus editor
      view.focus()

      addNotification({
        type: 'success',
        message: 'Template inserted',
        details: 'Successfully inserted template into editor'
      })
    }
  }

  const handleAddSelection = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    
    // Try to get selection from active editor first (preserves source code like [[action:id]])
    const activeTab = getActiveTab()
    let selectedText = ''
    
    if (activeTab?.editorView) {
      const view = activeTab.editorView
      const selection = view.state.selection.main
      if (!selection.empty) {
        selectedText = view.state.doc.sliceString(selection.from, selection.to)
      }
    } else {
      console.warn('TemplateManager: No active editor view found.')
    }

    if (!selectedText) {
      addNotification({
        type: 'warning',
        message: 'No selection',
        details: 'Please select some text in the editor first'
      })
      return
    }

    // Pre-fill form with selected text
    setFormData({
      name: '',
      content: selectedText,
      category: 'General'
    })
    setShowAddForm(true)
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.toolbarButton} onClick={() => setShowAddForm(!showAddForm)} title="Add Template">
          <Plus size={16} />
        </button>
        <button className={styles.toolbarButton} onClick={(e) => handleAddSelection(e)} title="Add Selection (Ctrl+Shift+T)">
          <MousePointerClick size={16} />
        </button>
        <button className={styles.toolbarButton} onClick={handleImport} title="Import Templates">
          <Upload size={16} />
        </button>
        <button className={styles.toolbarButton} onClick={handleExport} title="Export Templates">
          <Download size={16} />
        </button>
        <div style={{ flex: 1 }} />
        <button
          className={styles.toolbarButton}
          onClick={() => setShowHidden(!showHidden)}
          title={showHidden ? 'Hide hidden items' : 'Show hidden items'}
        >
          {showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className={styles.form}>
          <input
            type="text"
            placeholder="Template Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={styles.input}
          />
          <textarea
            placeholder="Template Content (use {{variable}} for placeholders)"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className={styles.textarea}
            rows={6}
          />
          <div className={styles.formButtons}>
            <button className={styles.primaryButton} onClick={editingId ? handleUpdate : handleAdd}>
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => {
                setShowAddForm(false)
                setEditingId(null)
                setFormData({ name: '', content: '', category: 'General' })
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Template List */}
      <div className={styles.list}>
        {sortedCategories.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={48} opacity={0.3} />
            <p>No templates yet</p>
            <p className={styles.emptyHint}>Click "Add" to create your first template</p>
          </div>
        )}

        {sortedCategories.map(category => {
          // If filtering active, skip categories not in selection
          if (visibleCategories.length > 0 && !visibleCategories.includes(category)) return null;

          const items = groupedTemplates[category];
          const isFiltered = selectedCategories.includes(category);

          return (
            <div key={category} className={styles.categoryGroup}>
              <div 
                className={`${styles.categoryHeader} ${isFiltered ? styles.activeFilter : ''}`}
                onClick={(e) => handleCategoryClick(category, e)}
                onDoubleClick={() => handleCategoryDoubleClick(category)}
                title="Click to filter, Ctrl+Click to multi-select, Double-click to remove filter"
              >
                <span>{category}</span>
                <span className={styles.categoryCount}>{items.length}</span>
              </div>
              
              {items.map(template => (
                <div key={template.id} className={template.isHidden ? styles.templateItemHidden : styles.templateItem}>
                  <div className={styles.templateInfo}>
                    <div className={styles.templateName}>
                      {template.name}
                      {template.isHidden && <span className={styles.hiddenBadge}>Hidden</span>}
                    </div>
                    {template.variables.length > 0 && (
                      <div className={styles.templatePreview}>
                        {template.variables.map(v => `{{${v}}}`).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className={styles.templateActions}>
                    <button
                      className={styles.playButton}
                      onClick={() => handleUseTemplate(template.content)}
                      title="Insert template"
                    >
                      <Play size={12} fill="currentColor" />
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => handleEdit(template.id)}
                      title="Edit"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => toggleTemplateVisibility(template.id)}
                      title={template.isHidden ? 'Show' : 'Hide'}
                    >
                      {template.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => {
                        if (confirm(`Delete template "${template.name}"?`)) {
                          deleteTemplate(template.id)
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
