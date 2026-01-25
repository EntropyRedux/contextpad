import { useState, useMemo, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useActionStore } from '../../store/actionStore'
import { useTabStore } from '../../store/tabStore'
import { useTemplateStore } from '../../store/templateStore'
import { 
  FileText, Terminal, Play, Eye, EyeOff, Calculator, 
  ChevronDown, ChevronRight, CheckSquare, Square, Star,
  ArrowUp, ArrowDown, X, Zap, Power, Edit2, MousePointerClick
} from 'lucide-react'
import { executeAction } from '../../utils/actionExecutor'
import { getFormulaFunctionsByCategory, previewFormula } from '../../services/formulaParser'
import { useNotificationStore } from '../../store/notificationStore'
import { ManagerToolbar } from './shared/ManagerToolbar'
import { ManagerList } from './shared/ManagerList'
import { ManagerItem } from './shared/ManagerItem'
import styles from './shared/SidebarManager.module.css'

export function ActionManager() {
  const { 
    actions,
    addAction,
    updateAction,
    renameActionId,
    deleteActionsBulk,
    toggleActionsEnabledBulk,
    exportActions,
    importActions,
    collapsedCategories,
    toggleCategoryCollapse,
    moveCategory,
    toggleActionPin,
    isActionPinned
  } = useActionStore()

  const { getActiveTab } = useTabStore()
  const { templates, getVisibleTemplates } = useTemplateStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(true)
  
  // Bulk Mode State
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    type: 'command' as 'button' | 'command',
    codeType: 'formula' as 'formula' | 'javascript',
    code: '',
    category: 'General',
    enabled: true
  })

  // Formula builder state
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedFunction, setSelectedFunction] = useState<string>('')
  const [formulaInput, setFormulaInput] = useState<'selection' | 'custom'>('selection')
  const [customInput, setCustomInput] = useState('')

  useEffect(() => {
    if (!bulkMode) setSelectedItems(new Set())
  }, [bulkMode])

  // Get formula functions by category
  const formulaFunctions = useMemo(() => getFormulaFunctionsByCategory(), [])
  const formulaCategories = Object.keys(formulaFunctions).sort()
  const functionsInCategory = selectedCategory ? formulaFunctions[selectedCategory] || [] : []

  const selectedFunctionInfo = useMemo(() => {
    if (!selectedFunction) return null
    for (const fns of Object.values(formulaFunctions)) {
      const fn = fns.find(f => f.name === selectedFunction)
      if (fn) return fn
    }
    return null
  }, [selectedFunction, formulaFunctions])

  const buildFormula = (): string => {
    if (!selectedFunction) return ''
    return formulaInput === 'selection' ? `${selectedFunction}()` : `${selectedFunction}(${customInput})`
  }

  const formulaPreview = useMemo(() => {
    const formula = formData.codeType === 'formula' ? formData.code : ''
    if (!formula) return ''
    return previewFormula(formula, 'sample text')
  }, [formData.code, formData.codeType])

  const applyFormulaFromBuilder = () => {
    const formula = buildFormula()
    if (formula) {
      setFormData(prev => ({
        ...prev,
        code: formula,
        name: prev.name || selectedFunctionInfo?.description || selectedFunction,
        description: prev.description || `Executes ${selectedFunction} formula`
      }))
    }
  }

  const visibleTemplates = getVisibleTemplates()

  const groupedActions = actions.reduce((acc, a) => {
    if (!showHidden && !a.enabled) return acc
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {} as Record<string, typeof actions>)

  const categories = useActionStore(state => state.getAllCategories())
  const sortedCategoryNames = categories
    .map(c => c.name)
    .filter(name => groupedActions[name]?.length > 0)

  // Handlers (Simplified for brevity as logic is same)
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      const escapedContent = template.content.replace(/`/g, '\`').replace(/\$/g, '\\$')
      const code = `// Insert template: ${template.name}\nhelpers.insertTemplate(\`${escapedContent}\`)
`
      setFormData({
        ...formData,
        name: formData.name || `Insert ${template.name}`,
        description: `Inserts the "${template.name}" template`,
        code: code,
        category: template.category
      })
    }
  }

  const handleCommandSelect = (commandType: string) => {
    let code = ''
    // ... command logic (simplified)
    if (commandType === 'uppercase') code = `helpers.replaceSelection(helpers.getSelection().toUpperCase())`
    if (commandType === 'lowercase') code = `helpers.replaceSelection(helpers.getSelection().toLowerCase())`
    if (commandType === 'insert-date') code = `helpers.insertAtCursor(new Date().toISOString().split('T')[0])`
    
    if (code) {
      setFormData({ ...formData, code })
    }
  }

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.code.trim()) return
    const codeToStore = formData.codeType === 'formula' ? `FORMULA:${formData.code}` : formData.code
    addAction({ ...formData, code: codeToStore })
    resetForm()
    setShowAddForm(false)
  }

  const resetForm = () => {
    setFormData({ id: '', name: '', description: '', type: 'command', codeType: 'formula', code: '', category: 'General', enabled: true })
    setSelectedCategory('')
    setSelectedFunction('')
  }

  const handleEdit = (id: string) => {
    const action = actions.find(a => a.id === id)
    if (action) {
      const isFormula = action.code.startsWith('FORMULA:')
      const code = isFormula ? action.code.slice(8) : action.code
      setFormData({ ...action, codeType: isFormula ? 'formula' : 'javascript', code })
      setEditingId(id)
      setShowAddForm(true)
    }
  }

  const handleUpdate = () => {
    if (!editingId) return
    
    // Rename if ID changed
    if (formData.id !== editingId) {
      const success = renameActionId(editingId, formData.id)
      if (!success) {
        addNotification({ type: 'error', message: 'ID already exists' })
        return
      }
      setEditingId(formData.id) // Update editing ref
    }

    const codeToStore = formData.codeType === 'formula' ? `FORMULA:${formData.code}` : formData.code
    // Use formData.id instead of editingId if it changed (though we updated ref above)
    // Actually updateAction uses original ID if we didn't rename, or new ID if we did?
    // renameActionId updates the ID in the store. So we should pass the NEW id to updateAction.
    updateAction(formData.id, {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      code: codeToStore,
      category: formData.category,
      enabled: formData.enabled
    })
    resetForm()
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleExecute = (actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    const activeTab = getActiveTab()
    if (!action || !activeTab?.editorView) return
    executeAction(action.code, activeTab.editorView, action.id)
  }

  const handleExport = async () => {
    const json = exportActions()
    const defaultName = `actions-${new Date().toISOString().split('T')[0]}.json`
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
        importActions(text)
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
    if (confirm(`Delete ${selectedItems.size} selected actions?`)) {
      deleteActionsBulk(Array.from(selectedItems))
      setSelectedItems(new Set())
    }
  }

  const handleBulkToggle = () => {
    const selectedActions = actions.filter(a => selectedItems.has(a.id))
    const hasDisabled = selectedActions.some(a => !a.enabled)
    toggleActionsEnabledBulk(Array.from(selectedItems), hasDisabled)
  }

  const handleBulkPin = () => {
    const ids = Array.from(selectedItems)
    ids.forEach(id => toggleActionPin(id))
  }

  return (
    <div className={styles.container}>
      <ManagerToolbar
        onAdd={() => setShowAddForm(!showAddForm)}
        addTooltip="Add Action"
        onImport={handleImport}
        onExport={handleExport}
        bulkMode={bulkMode}
        onToggleBulk={() => setBulkMode(!bulkMode)}
        selectedCount={selectedItems.size}
        onBulkDelete={handleBulkDelete}
        bulkActions={
          <>
            <button className={styles.toolbarButton} onClick={handleBulkToggle} title="Toggle Enable/Disable">
              <Power size={16} />
            </button>
            <button className={styles.toolbarButton} onClick={handleBulkPin} title="Toggle Pin">
              <Star size={16} fill="currentColor" />
            </button>
          </>
        }
        viewControls={
          <button
            className={styles.toolbarButton}
            onClick={() => setShowHidden(!showHidden)}
            title={showHidden ? 'Hide disabled' : 'Show disabled'}
          >
            {showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        }
      />

      {showAddForm && (
        <div className={styles.form}> 
           {/* Action Type Selector */}
           <div className={styles.codeTypeSelector}>
            <button
              className={`${styles.codeTypeBtn} ${formData.type === 'command' ? styles.active : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'command' }))}
              title="Execute immediately"
            >
              <Terminal size={14} /> Command
            </button>
            <button
              className={`${styles.codeTypeBtn} ${formData.type === 'button' ? styles.active : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'button' }))}
              title="Insert button into editor"
            >
              <MousePointerClick size={14} /> Button
            </button>
          </div>

           {/* Code Type Selector */}
           <div className={styles.codeTypeSelector}>
            <button
              className={`${styles.codeTypeBtn} ${formData.codeType === 'formula' ? styles.active : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, codeType: 'formula', code: '' }))}
            >
              <Calculator size={14} /> Formula
            </button>
            <button
              className={`${styles.codeTypeBtn} ${formData.codeType === 'javascript' ? styles.active : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, codeType: 'javascript', code: '' }))}
            >
              <Terminal size={14} /> JS
            </button>
          </div>

          {/* Formula Builder */}
          {formData.codeType === 'formula' && (
            <div className={styles.formulaBuilder}>
              <select className={styles.select} onChange={e => setSelectedCategory(e.target.value)}>
                <option value="">Category...</option>
                {formulaCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {selectedCategory && (
                <select className={styles.select} onChange={e => setSelectedFunction(e.target.value)}>
                  {functionsInCategory.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                </select>
              )}
              {selectedFunction && (
                <button className={styles.applyFormulaBtn} onClick={applyFormulaFromBuilder}>Apply {selectedFunction}</button>
              )}
            </div>
          )}

          {formData.codeType === 'javascript' && (
             <div className={styles.quickAddSection}>
                <label className={styles.quickAddLabel}>Quick Add Template</label>
                <select className={styles.select} onChange={e => { if(e.target.value) handleTemplateSelect(e.target.value) }}>
                  <option value="">Select template...</option>
                  {visibleTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
             </div>
          )}

          <input 
            className={styles.input} 
            placeholder="Name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          {editingId && (
            <div style={{display: 'flex', gap: 4}}>
              <input 
                className={styles.input} 
                placeholder="ID (Click copy to use in exclude)" 
                value={formData.id} 
                onChange={e => setFormData({...formData, id: e.target.value})}
              />
              <button 
                className={styles.secondaryButton} 
                onClick={() => { navigator.clipboard.writeText(`action:${formData.id}`); addNotification({ type: 'success', message: 'Copied ID' }) }}
                title="Copy Action ID"
              >
                Copy
              </button>
            </div>
          )}
           <input 
            className={styles.input} 
            placeholder="Category" 
            value={formData.category} 
            onChange={e => setFormData({...formData, category: e.target.value})} 
          />
           <textarea 
            className={styles.textarea} 
            placeholder="Code" 
            value={formData.code} 
            onChange={e => setFormData({...formData, code: e.target.value})} 
            rows={5}
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
        groups={groupedActions}
        categories={sortedCategoryNames}
        collapsedCategories={collapsedCategories}
        onToggleCategory={toggleCategoryCollapse}
        onMoveCategory={moveCategory}
        emptyMessage="No actions"
        emptyIcon={<Zap size={48} opacity={0.3} />}
        renderItem={(action) => (
          <ManagerItem
            key={action.id}
            id={action.id}
            title={action.name}
            bulkMode={bulkMode}
            isSelected={selectedItems.has(action.id)}
            onToggleSelect={toggleSelection}
            isHidden={!action.enabled}
            badges={
              <>
                {isActionPinned(action.id) && <Star size={10} fill="orange" stroke="none" style={{marginLeft: 4}} />}
                {!action.enabled && <span className={styles.hiddenBadge}>Disabled</span>}
              </>
            }
            actions={
              <>
                <button 
                  className={styles.playButton}
                  onClick={() => handleExecute(action.id)}
                  disabled={!action.enabled}
                >
                  <Play size={12} fill="currentColor" />
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={() => handleEdit(action.id)}
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