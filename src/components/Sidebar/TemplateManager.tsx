import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTemplateStore } from '../../store/templateStore'
import { useTabStore } from '../../store/tabStore'
import { useNotificationStore } from '../../store/notificationStore'
import { 
  Eye, EyeOff, Edit2, FileText, MousePointerClick, Play, Star
} from 'lucide-react'
import { processTemplateVariables } from '../../utils/templateVariables'
import { ManagerToolbar } from './shared/ManagerToolbar'
import { ManagerList } from './shared/ManagerList'
import { ManagerItem } from './shared/ManagerItem'
import styles from './shared/SidebarManager.module.css'

export function TemplateManager() {
  const { 
    templates,
    addTemplate,
    updateTemplate,
    renameTemplateId,
    deleteTemplate,
    deleteTemplatesBulk,
    toggleTemplatesVisibilityBulk,
    exportTemplates,
    importTemplates,
    collapsedCategories,
    toggleCategoryCollapse,
    moveCategory,
    toggleTemplatePin,
    isTemplatePinned
  } = useTemplateStore()

  const { getActiveTab, updateTab } = useTabStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(true)

  // Bulk Mode
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    content: '',
    category: 'General'
  })

  useEffect(() => {
    if (!bulkMode) setSelectedItems(new Set())
  }, [bulkMode])

  // Group templates
  const groupedTemplates = templates.reduce((acc, t) => {
    if (!showHidden && t.isHidden) return acc
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {} as Record<string, typeof templates>)

  const categories = useTemplateStore(state => state.getAllCategories())
  const sortedCategoryNames = categories
    .map(c => c.name)
    .filter(name => groupedTemplates[name]?.length > 0)

  // Handlers
  const handleAdd = () => {
    if (!formData.name.trim() || !formData.content.trim()) return
    addTemplate({
      name: formData.name,
      content: formData.content,
      category: formData.category,
      isHidden: false,
      variables: []
    })
    setFormData({ id: '', name: '', content: '', category: 'General' })
    setShowAddForm(false)
  }

  const handleUpdate = () => {
    if (!editingId) return

    if (formData.id !== editingId) {
      const success = renameTemplateId(editingId, formData.id)
      if (!success) {
        addNotification({ type: 'error', message: 'ID already exists' })
        return
      }
      setEditingId(formData.id)
    }

    updateTemplate(formData.id, {
      name: formData.name,
      content: formData.content,
      category: formData.category
    })
    setFormData({ id: '', name: '', content: '', category: 'General' })
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleEdit = (id: string) => {
    const template = templates.find(t => t.id === id)
    if (template) {
      setFormData({
        id: template.id,
        name: template.name,
        content: template.content,
        category: template.category
      })
      setEditingId(id)
      setShowAddForm(true)
    }
  }

  const handleUseTemplate = (templateContent: string) => {
    const activeTab = getActiveTab()
    if (activeTab?.editorView) {
      const view = activeTab.editorView
      const pos = view.state.selection.main.head
      const selection = view.state.selection.main
      const selectedText = view.state.doc.sliceString(selection.from, selection.to)
      const processed = processTemplateVariables(templateContent, selectedText)

      view.dispatch({
        changes: { from: pos, insert: processed.content },
        selection: {
          anchor: processed.cursorOffset !== null ? pos + processed.cursorOffset : pos + processed.content.length
        }
      })
      updateTab(activeTab.id, { isDirty: true })
      view.focus()
      addNotification({ type: 'success', message: 'Inserted' })
    }
  }

  const handleAddSelection = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const activeTab = getActiveTab()
    let selectedText = ''
    if (activeTab?.editorView) {
      const view = activeTab.editorView
      const selection = view.state.selection.main
      if (!selection.empty) {
        selectedText = view.state.doc.sliceString(selection.from, selection.to)
      }
    }
    if (!selectedText) {
      addNotification({ type: 'warning', message: 'No selection' })
      return
    }
    setFormData({ name: '', content: selectedText, category: 'General' })
    setShowAddForm(true)
  }

  const handleExport = async () => {
    const json = exportTemplates()
    const defaultName = `templates-${new Date().toISOString().split('T')[0]}.json`
    const filePath = await invoke<string | null>('save_file_dialog', { defaultName })
    if (filePath) await invoke('write_file', { path: filePath, content: json })
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
          // Pre-check duplicates
          const data = JSON.parse(text)
          const imports = data.templates || []
          const duplicates = imports.filter((imp: any) => 
            templates.some(t => t.name.toLowerCase() === (imp.name || '').toLowerCase())
          ).map((imp: any) => imp.name)

          if (duplicates.length > 0) {
            if (!confirm(`Duplicate templates found:\n${duplicates.join(', ')}\n\nAdd anyway? (Duplicates will be created with new IDs)`)) {
              return
            }
          }
          
          importTemplates(text)
          addNotification({ type: 'success', message: 'Templates imported' })
        } catch (error) {
          addNotification({ type: 'error', message: 'Import failed' })
        }
      }
    }
    input.click()
  }

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedItems.size} selected templates?`)) {
      deleteTemplatesBulk(Array.from(selectedItems))
      setSelectedItems(new Set())
    }
  }

  const handleBulkToggle = () => {
    const selectedTemplates = templates.filter(t => selectedItems.has(t.id))
    const hasHidden = selectedTemplates.some(t => t.isHidden)
    toggleTemplatesVisibilityBulk(Array.from(selectedItems), !hasHidden)
  }

  const handleBulkPin = () => {
    const ids = Array.from(selectedItems)
    ids.forEach(id => toggleTemplatePin(id))
  }

  return (
    <div className={styles.container}>
      <ManagerToolbar
        onAdd={() => setShowAddForm(!showAddForm)}
        addTooltip="Add Template"
        onImport={handleImport}
        onExport={handleExport}
        bulkMode={bulkMode}
        onToggleBulk={() => setBulkMode(!bulkMode)}
        selectedCount={selectedItems.size}
        onBulkDelete={handleBulkDelete}
        standardActions={
          <button className={styles.toolbarButton} onClick={(e) => handleAddSelection(e)} title="Add Selection">
            <MousePointerClick size={16} />
          </button>
        }
        bulkActions={
          <>
            <button className={styles.toolbarButton} onClick={handleBulkToggle} title="Toggle Visibility">
              <Eye size={16} />
            </button>
            <button className={styles.toolbarButton} onClick={handleBulkPin} title="Toggle Pin (Show in Menu)">
              <Star size={16} fill="currentColor" />
            </button>
          </>
        }
        viewControls={
          <button
            className={styles.toolbarButton}
            onClick={() => setShowHidden(!showHidden)}
            title={showHidden ? 'Hide hidden' : 'Show hidden'}
          >
            {showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        }
      />

      {showAddForm && (
        <div className={styles.form}>
          <input 
            className={styles.input} 
            placeholder="Name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          {editingId && (
            <input 
              className={styles.input} 
              placeholder="ID" 
              value={formData.id} 
              onChange={e => setFormData({...formData, id: e.target.value})}
            />
          )}
           <input 
            className={styles.input} 
            placeholder="Category" 
            value={formData.category} 
            onChange={e => setFormData({...formData, category: e.target.value})} 
          />
          <textarea 
            className={styles.textarea} 
            placeholder="Content" 
            rows={6} 
            value={formData.content} 
            onChange={e => setFormData({...formData, content: e.target.value})} 
          />
          <div className={styles.formButtons}>
            <button className={styles.primaryButton} onClick={editingId ? handleUpdate : handleAdd}>
              {editingId ? 'Update' : 'Add'}
            </button>
            <button className={styles.secondaryButton} onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <ManagerList
        groups={groupedTemplates}
        categories={sortedCategoryNames}
        collapsedCategories={collapsedCategories}
        onToggleCategory={toggleCategoryCollapse}
        onMoveCategory={moveCategory}
        emptyMessage="No templates"
        emptyIcon={<FileText size={48} opacity={0.3} />}
        renderItem={(template) => (
          <ManagerItem
            key={template.id}
            id={template.id}
            title={template.name}
            bulkMode={bulkMode}
            isSelected={selectedItems.has(template.id)}
            onToggleSelect={toggleSelection}
            isHidden={template.isHidden}
            badges={
              <>
                {isTemplatePinned(template.id) && <Star size={10} fill="orange" stroke="none" style={{marginLeft: 4}} />}
                {template.isHidden && <span className={styles.hiddenBadge}>Hidden</span>}
              </>
            }
            actions={
              <>
                <button
                  className={styles.playButton}
                  onClick={() => handleUseTemplate(template.content)}
                >
                  <Play size={12} fill="currentColor" />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => handleEdit(template.id)}
                >
                  <Edit2 size={12} />
                </button>
              </>
            }
          />
        )}
      />
    </div>
  )
}