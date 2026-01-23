import { useState, useMemo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useActionStore } from '../../store/actionStore'
import { useTabStore } from '../../store/tabStore'
import { useTemplateStore } from '../../store/templateStore'
import { Plus, Download, Upload, Edit2, Trash2, Zap, Power, PowerOff, FileText, Terminal, Play, Eye, EyeOff, Calculator, ChevronDown } from 'lucide-react'
import { executeAction, getEditorHelpers } from '../../utils/actionExecutor'
import { validateActionCode } from '../../utils/codeValidator'
import { validateFormula, getFormulaFunctionsByCategory, previewFormula } from '../../services/formulaParser'
import { useNotificationStore } from '../../store/notificationStore'
import styles from './TemplateManager.module.css' // Reuse styles

export function ActionManager() {
  const { 
    actions,
    addAction,
    updateAction,
    deleteAction,
    toggleActionEnabled,
    exportActions,
    importActions
  } = useActionStore()

  const { getActiveTab } = useTabStore()
  const { templates, getVisibleTemplates } = useTemplateStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const [formData, setFormData] = useState({
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

  // Get formula functions by category
  const formulaFunctions = useMemo(() => getFormulaFunctionsByCategory(), [])
  const formulaCategories = Object.keys(formulaFunctions).sort()

  // Get functions for selected category
  const functionsInCategory = selectedCategory ? formulaFunctions[selectedCategory] || [] : []

  // Get selected function info
  const selectedFunctionInfo = useMemo(() => {
    if (!selectedFunction) return null
    for (const fns of Object.values(formulaFunctions)) {
      const fn = fns.find(f => f.name === selectedFunction)
      if (fn) return fn
    }
    return null
  }, [selectedFunction, formulaFunctions])

  // Build formula from builder state
  const buildFormula = (): string => {
    if (!selectedFunction) return ''

    if (formulaInput === 'selection') {
      // Empty parens means use selection
      return `${selectedFunction}()`
    } else {
      // Custom input
      return `${selectedFunction}(${customInput})`
    }
  }

  // Preview the formula result
  const formulaPreview = useMemo(() => {
    const formula = formData.codeType === 'formula' ? formData.code : ''
    if (!formula) return ''
    return previewFormula(formula, 'sample text')
  }, [formData.code, formData.codeType])

  // Apply formula from builder to form
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

  // Group actions by category
  const groupedActions = actions.reduce((acc, a) => {
    if (!showHidden && !a.enabled) return acc
    
    if (!acc[a.category]) {
      acc[a.category] = []
    }
    acc[a.category].push(a)
    return acc
  }, {} as Record<string, typeof actions>)

  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedActions).sort()

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
    // Double click: Remove from filter
    setSelectedCategories(prev => prev.filter(c => c !== category))
  }

  // Generate code from template selection
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

  // Generate code for common editor commands
  const handleCommandSelect = (commandType: string) => {
    let code = ''
    let name = ''
    let description = ''

    switch (commandType) {
      case 'uppercase':
        code = `// Transform selection to uppercase\nconst text = helpers.getSelection()\nhelpers.replaceSelection(text.toUpperCase())`
        name = 'Uppercase'
        description = 'Transform selected text to uppercase'
        break
      case 'lowercase':
        code = `// Transform selection to lowercase\nconst text = helpers.getSelection()\nhelpers.replaceSelection(text.toLowerCase())`
        name = 'Lowercase'
        description = 'Transform selected text to lowercase'
        break
      case 'reverse':
        code = `// Reverse selection\nconst text = helpers.getSelection()\nhelpers.replaceSelection(text.split('').reverse().join(''))`
        name = 'Reverse Text'
        description = 'Reverse selected text'
        break
      case 'wrap-bold':
        code = `// Wrap selection in bold\nconst text = helpers.getSelection()\nhelpers.replaceSelection('**' + text + '**')`
        name = 'Bold'
        description = 'Wrap selection in markdown bold'
        break
      case 'wrap-italic':
        code = `// Wrap selection in italic\nconst text = helpers.getSelection()\nhelpers.replaceSelection('*' + text + '*')`
        name = 'Italic'
        description = 'Wrap selection in markdown italic'
        break
      case 'wrap-code':
        code = `// Wrap selection in code\nconst text = helpers.getSelection()\nhelpers.replaceSelection('\`' + text + '\`')`
        name = 'Inline Code'
        description = 'Wrap selection in inline code'
        break
      case 'insert-date':
        code = `// Insert current date\nconst date = new Date().toISOString().split('T')[0]\nhelpers.insertAtCursor(date)`
        name = 'Insert Date'
        description = 'Insert current date (YYYY-MM-DD)'
        break
      case 'insert-time':
        code = `// Insert current time\nconst time = new Date().toTimeString().split(' ')[0]\nhelpers.insertAtCursor(time)`
        name = 'Insert Time'
        description = 'Insert current time (HH:MM:SS)'
        break
      case 'duplicate-line':
        code = `// Duplicate current line\nconst line = helpers.getCurrentLine()\nhelpers.insertAtCursor('\n' + line)`
        name = 'Duplicate Line'
        description = 'Duplicate the current line'
        break
    }

    if (code) {
      setFormData({
        ...formData,
        name: formData.name || name,
        description: formData.description || description,
        code: code
      })
    }
  }

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      addNotification({
        type: 'error',
        message: 'Validation failed',
        details: 'Name and code are required'
      })
      return
    }

    // Validate based on code type
    if (formData.codeType === 'formula') {
      const validation = validateFormula(formData.code)
      if (!validation.valid) {
        addNotification({
          type: 'error',
          message: 'Formula validation failed',
          details: validation.error || 'Invalid formula'
        })
        return
      }
    } else {
      const validation = validateActionCode(formData.code)
      if (!validation.valid) {
        addNotification({
          type: 'error',
          message: 'Code validation failed',
          details: validation.errors.join('\n')
        })
        return
      }
    }

    // Store formula with special prefix for identification
    const codeToStore = formData.codeType === 'formula'
      ? `FORMULA:${formData.code}`
      : formData.code

    addAction({
      name: formData.name,
      description: formData.description,
      type: formData.type,
      code: codeToStore,
      category: formData.category,
      enabled: formData.enabled
    })

    resetForm()
    setShowAddForm(false)

    addNotification({
      type: 'success',
      message: 'Action created',
      details: `Created: ${formData.name}`
    })
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', type: 'command', codeType: 'formula', code: '', category: 'General', enabled: true })
    setSelectedCategory('')
    setSelectedFunction('')
    setFormulaInput('selection')
    setCustomInput('')
  }

  const handleEdit = (id: string) => {
    const action = actions.find(a => a.id === id)
    if (action) {
      // Check if it's a formula (has FORMULA: prefix)
      const isFormula = action.code.startsWith('FORMULA:')
      const code = isFormula ? action.code.slice(8) : action.code

      setFormData({
        name: action.name,
        description: action.description,
        type: action.type,
        codeType: isFormula ? 'formula' : 'javascript',
        code: code,
        category: action.category,
        enabled: action.enabled
      })
      setEditingId(id)
      setShowAddForm(true)
    }
  }

  const handleUpdate = () => {
    if (!editingId || !formData.name.trim() || !formData.code.trim()) return

    // Validate based on code type
    if (formData.codeType === 'formula') {
      const validation = validateFormula(formData.code)
      if (!validation.valid) {
        addNotification({
          type: 'error',
          message: 'Formula validation failed',
          details: validation.error || 'Invalid formula'
        })
        return
      }
    } else {
      const validation = validateActionCode(formData.code)
      if (!validation.valid) {
        addNotification({
          type: 'error',
          message: 'Code validation failed',
          details: validation.errors.join('\n')
        })
        return
      }
    }

    // Store formula with special prefix for identification
    const codeToStore = formData.codeType === 'formula'
      ? `FORMULA:${formData.code}`
      : formData.code

    updateAction(editingId, {
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

    addNotification({
      type: 'success',
      message: 'Action updated'
    })
  }

  const handleExecute = (actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    const activeTab = getActiveTab()

    if (!action || !activeTab?.editorView) return

    const result = executeAction(action.code, activeTab.editorView)

    if (result.success) {
      addNotification({
        type: 'success',
        message: action.name,
        details: action.type === 'command' ? 'Command executed' : 'Action completed'
      })
    } else {
      addNotification({
        type: 'error',
        message: 'Action failed',
        details: result.error
      })
    }
  }

  const handleExport = async () => {
    try {
      const json = exportActions()
      const defaultName = `actions-${new Date().toISOString().split('T')[0]}.json`
      const filePath = await invoke<string | null>('save_file_dialog', { defaultName })

      if (!filePath) return // User cancelled

      await invoke('write_file', { path: filePath, content: json })
      addNotification({
        type: 'success',
        message: 'Actions exported',
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
          importActions(text)
          addNotification({
            type: 'success',
            message: 'Actions imported successfully'
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

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.toolbarButton} onClick={() => setShowAddForm(!showAddForm)} title="Add Action">
          <Plus size={16} />
        </button>
        <button className={styles.toolbarButton} onClick={handleImport} title="Import Actions">
          <Upload size={16} />
        </button>
        <button className={styles.toolbarButton} onClick={handleExport} title="Export Actions">
          <Download size={16} />
        </button>
        <div style={{ flex: 1 }} />
        <button 
          className={styles.toolbarButton}
          onClick={() => setShowHidden(!showHidden)}
          title={showHidden ? 'Hide disabled actions' : 'Show disabled actions'}
        >
          {showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className={styles.form}>
          {/* Code Type Selection */}
          <div className={styles.codeTypeSelector}>
            <button
              className={`${styles.codeTypeBtn} ${formData.codeType === 'formula' ? styles.active : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, codeType: 'formula', code: '' }))}
            >
              <Calculator size={14} />
              Formula
            </button>
            <button
              className={`${styles.codeTypeBtn} ${formData.codeType === 'javascript' ? styles.active : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, codeType: 'javascript', code: '' }))}
            >
              <Terminal size={14} />
              JavaScript
            </button>
          </div>

          {/* Formula Builder (when formula type selected) */}
          {formData.codeType === 'formula' && (
            <div className={styles.formulaBuilder}>
              <div className={styles.quickAddLabel}>
                <Calculator size={14} />
                Formula Builder
              </div>

              {/* Category selector */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSelectedFunction('')
                }}
                className={styles.select}
              >
                <option value="">Select category...</option>
                {formulaCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Function selector */}
              {selectedCategory && (
                <select
                  value={selectedFunction}
                  onChange={(e) => setSelectedFunction(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select function...</option>
                  {functionsInCategory.map(fn => (
                    <option key={fn.name} value={fn.name}>
                      {fn.name} - {fn.description}
                    </option>
                  ))}
                </select>
              )}

              {/* Function info and input source */}
              {selectedFunctionInfo && (
                <div className={styles.functionInfo}>
                  <div className={styles.functionExample}>
                    Example: <code>{selectedFunctionInfo.example}</code>
                  </div>

                  <div className={styles.inputSourceSelector}>
                    <label>
                      <input
                        type="radio"
                        name="inputSource"
                        checked={formulaInput === 'selection'}
                        onChange={() => setFormulaInput('selection')}
                      />
                      Use selection
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="inputSource"
                        checked={formulaInput === 'custom'}
                        onChange={() => setFormulaInput('custom')}
                      />
                      Custom input
                    </label>
                  </div>

                  {formulaInput === 'custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom input..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className={styles.input}
                    />
                  )}

                  <button
                    className={styles.applyFormulaBtn}
                    onClick={applyFormulaFromBuilder}
                  >
                    Apply: {buildFormula() || 'Select a function'}
                  </button>
                </div>
              )}

              {/* Formula preview */}
              {formData.code && (
                <div className={styles.formulaPreview}>
                  <div className={styles.previewLabel}>Preview:</div>
                  <code className={styles.previewCode}>{formulaPreview}</code>
                </div>
              )}
            </div>
          )}

          {/* JavaScript Quick Add (when JS type selected) */}
          {formData.codeType === 'javascript' && (
            <>
              {/* Quick Add from Template */}
              <div className={styles.quickAddSection}>
                <label className={styles.quickAddLabel}>
                  <FileText size={14} />
                  Quick Add from Template
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleTemplateSelect(e.target.value)
                    e.target.value = ''
                  }}
                  className={styles.select}
                >
                  <option value="">Select a template...</option>
                  {visibleTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              {/* Quick Add from Commands */}
              <div className={styles.quickAddSection}>
                <label className={styles.quickAddLabel}>
                  <Terminal size={14} />
                  Quick Add Command
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleCommandSelect(e.target.value)
                    e.target.value = ''
                  }}
                  className={styles.select}
                >
                  <option value="">Select a command...</option>
                  <optgroup label="Text Transform">
                    <option value="uppercase">Uppercase</option>
                    <option value="lowercase">Lowercase</option>
                    <option value="reverse">Reverse Text</option>
                  </optgroup>
                  <optgroup label="Markdown">
                    <option value="wrap-bold">Wrap in Bold</option>
                    <option value="wrap-italic">Wrap in Italic</option>
                    <option value="wrap-code">Wrap in Code</option>
                  </optgroup>
                  <optgroup label="Insert">
                    <option value="insert-date">Insert Date</option>
                    <option value="insert-time">Insert Time</option>
                    <option value="duplicate-line">Duplicate Line</option>
                  </optgroup>
                </select>
              </div>
            </>
          )}

          <div className={styles.separator} />

          <input 
            type="text"
            placeholder="Action Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={styles.input}
          />
          <input 
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={styles.input}
          />
          <select 
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'button' | 'command' })}
            className={styles.select}
          >
            <option value="command">Command (one-time)</option>
            <option value="button">Button (persistent)</option>
          </select>
          <input 
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={styles.input}
          />
          <textarea
            placeholder={formData.codeType === 'formula'
              ? "Formula (e.g., UPPER(), BOLD(), TODAY())\n\nEmpty parens () = use selection\nOr provide input: UPPER(hello world)"
              : "JavaScript Code (helpers object available)\n\nAvailable: helpers.getSelection(), helpers.replaceSelection(text),\nhelpers.insertAtCursor(text), helpers.insertTemplate(content),\nhelpers.getAllText(), helpers.replaceAllText(text)"}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className={styles.textarea}
            rows={formData.codeType === 'formula' ? 4 : 8}
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
                resetForm()
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action List */}
      <div className={styles.list}>
        {sortedCategories.length === 0 && (
          <div className={styles.emptyState}>
            <Zap size={48} opacity={0.3} />
            <p>No actions yet</p>
            <p className={styles.emptyHint}>Click "Add" to create your first action</p>
          </div>
        )}

        {sortedCategories.map(category => {
          // If filtering active, skip categories not in selection
          if (visibleCategories.length > 0 && !visibleCategories.includes(category)) return null;

          const items = groupedActions[category];
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
              
              {items.map(action => (
                <div key={action.id} className={action.enabled ? styles.templateItem : styles.templateItemHidden}>
                  <div className={styles.templateInfo}>
                    <div className={styles.templateName}>
                      {action.name}
                      {!action.enabled && <span className={styles.hiddenBadge}>Disabled</span>}
                    </div>
                    {action.description && (
                      <div className={styles.templatePreview}>{action.description}</div>
                    )}
                  </div>
                  <div className={styles.templateActions}>
                    <button 
                      className={styles.playButton}
                      onClick={() => handleExecute(action.id)}
                      disabled={!action.enabled}
                      title="Execute action"
                    >
                      <Play size={12} fill="currentColor" />
                    </button>
                    <button 
                      className={styles.iconButton}
                      onClick={() => handleEdit(action.id)}
                      title="Edit"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      className={styles.iconButton}
                      onClick={() => toggleActionEnabled(action.id)}
                      title={action.enabled ? 'Disable' : 'Enable'}
                    >
                      {action.enabled ? <Power size={12} /> : <PowerOff size={12} />}
                    </button>
                    <button 
                      className={styles.iconButton}
                      onClick={() => {
                        if (confirm(`Delete action "${action.name}"?`)) {
                          deleteAction(action.id)
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
