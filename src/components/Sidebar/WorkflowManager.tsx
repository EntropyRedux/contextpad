import { useState, useEffect, useMemo, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTabStore, PinnedTab } from '../../store/tabStore'
import { useShallow } from 'zustand/react/shallow'
import { useNotificationStore } from '../../store/notificationStore'
import { PINNED_TAB_ICONS, PinnedTabIcon, DEFAULT_PINNED_TAB_ICON } from '../../constants/pinnedTabIcons'
import * as Icons from 'lucide-react'
import { 
  FileText, Play, Edit2, Eye, EyeOff, Bookmark, Workflow as WorkflowIcon
} from 'lucide-react'
import { ManagerToolbar } from './shared/ManagerToolbar'
import { ManagerList } from './shared/ManagerList'
import { ManagerItem } from './shared/ManagerItem'
import { CategorySelector } from './shared/CategorySelector'
import styles from './shared/SidebarManager.module.css'

// Dynamic icon component
function DynamicIcon({ name, size = 16 }: { name: string; size?: number }) {
  const IconComponent = (Icons as any)[name]
  if (!IconComponent) return <FileText size={size} />
  return <IconComponent size={size} />
}

export function WorkflowManager() {
  const {
    tabs,
    pinnedTabs,
    addPinnedTab,
    removePinnedTab,
    updatePinnedTab,
    addTab,
    setActiveTab,
    togglePinnedTabsVisibilityBulk,
    pinnedCategoryOrder,
    movePinnedTabCategory,
    pinnedCollapsedCategories,
    togglePinnedCategoryCollapse
  } = useTabStore(
    useShallow(state => ({
      tabs: state.tabs,
      pinnedTabs: state.pinnedTabs,
      addPinnedTab: state.addPinnedTab,
      removePinnedTab: state.removePinnedTab,
      updatePinnedTab: state.updatePinnedTab,
      addTab: state.addTab,
      setActiveTab: state.setActiveTab,
      togglePinnedTabsVisibilityBulk: state.togglePinnedTabsVisibilityBulk,
      pinnedCategoryOrder: state.pinnedCategoryOrder,
      movePinnedTabCategory: state.movePinnedTabCategory,
      pinnedCollapsedCategories: state.pinnedCollapsedCategories,
      togglePinnedCategoryCollapse: state.togglePinnedCategoryCollapse
    }))
  )
  const addNotification = useNotificationStore(state => state.addNotification)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(true)
  
  // UI State
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState({
    name: '',
    icon: DEFAULT_PINNED_TAB_ICON as PinnedTabIcon,
    type: 'workflow' as 'workflow' | 'bookmark',
    content: '',
    filePath: '',
    category: 'GENERAL',
    sourceTabId: ''
  })

  useEffect(() => {
    if (!bulkMode) setSelectedItems(new Set())
  }, [bulkMode])

  const groupedWorkflows = useMemo(() => {
    return pinnedTabs.reduce((acc, p) => {
      if (!showHidden && p.isHidden) return acc
      const cat = (p.category || 'GENERAL').toUpperCase()
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(p)
      return acc
    }, {} as Record<string, PinnedTab[]>)
  }, [pinnedTabs, showHidden])

  const categories = useMemo(() => {
    const rawCats = Object.keys(groupedWorkflows)
    if (pinnedCategoryOrder.length === 0) return rawCats.sort()
    
    return [...rawCats].sort((a, b) => {
      const indexA = pinnedCategoryOrder.indexOf(a)
      const indexB = pinnedCategoryOrder.indexOf(b)
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      return a.localeCompare(b)
    })
  }, [groupedWorkflows, pinnedCategoryOrder])

  const resetForm = () => {
    setFormData({
      name: '',
      icon: DEFAULT_PINNED_TAB_ICON,
      type: 'workflow',
      content: '',
      filePath: '',
      category: 'GENERAL',
      sourceTabId: ''
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleAdd = () => {
    if (!formData.name.trim()) {
      addNotification({ type: 'warning', message: 'Name required' })
      return
    }
    
    let content = formData.content
    let filePath = formData.filePath

    if (formData.sourceTabId) {
      const sourceTab = tabs.find(t => t.id === formData.sourceTabId)
      if (sourceTab) {
        content = sourceTab.content
        filePath = sourceTab.filePath || ''
      }
    }

    if (formData.type === 'workflow' && !content.trim()) {
      addNotification({ type: 'warning', message: 'Content required for workflows' })
      return
    }

    if (formData.type === 'bookmark' && !filePath && !formData.sourceTabId) {
      addNotification({ type: 'warning', message: 'File path required for bookmarks' })
      return
    }

    addPinnedTab({
      name: formData.name,
      icon: formData.icon,
      type: formData.type,
      content: content,
      filePath: filePath,
      category: (formData.category || 'GENERAL').toUpperCase(),
      isHidden: false
    })

    addNotification({ type: 'success', message: `${formData.type === 'workflow' ? 'Workflow' : 'Bookmark'} created` })
    resetForm()
  }

  const handleUpdate = () => {
    if (!editingId) return
    updatePinnedTab(editingId, {
      name: formData.name,
      icon: formData.icon,
      type: formData.type,
      content: formData.content,
      filePath: formData.filePath,
      category: formData.category.toUpperCase()
    })
    addNotification({ type: 'success', message: 'Updated' })
    resetForm()
  }

  const handleEdit = (pin: PinnedTab) => {
    setFormData({
      name: pin.name,
      icon: pin.icon as PinnedTabIcon,
      type: pin.type || 'workflow',
      content: pin.content,
      filePath: pin.filePath || '',
      category: pin.category || 'GENERAL',
      sourceTabId: ''
    })
    setEditingId(pin.id)
    setShowAddForm(true)
  }

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleWorkflowClick = async (pin: PinnedTab) => {
    // Clear any pending click
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
      return
    }

    // Delay single-click to allow double-click detection
    clickTimeoutRef.current = setTimeout(async () => {
      clickTimeoutRef.current = null

      if (pin.type === 'bookmark' && pin.filePath) {
        // BOOKMARK LOGIC: Open actual file
        try {
          // Check if already open
          const existingTab = tabs.find(t => t.filePath === pin.filePath)
          if (existingTab) {
            setActiveTab(existingTab.id)
          } else {
            // Read and open
            const content = await invoke<string>('read_file', { path: pin.filePath })
            const title = await invoke<string>('get_file_name', { path: pin.filePath })
            const language = await invoke<string>('detect_language_from_path', { path: pin.filePath })
            
            addTab({
              title,
              content,
              filePath: pin.filePath,
              language,
              isDirty: false
            })
          }
        } catch (error) {
          addNotification({ type: 'error', message: 'Failed to open bookmark', details: String(error) })
        }
      } else {
        // WORKFLOW LOGIC: Open as blueprint
        const existingTab = tabs.find(t => t.pinnedTabId === pin.id)
        if (existingTab) {
          setActiveTab(existingTab.id)
        } else {
          addTab({
            title: pin.name,
            content: pin.content,
            language: 'markdown',
            pinnedTabId: pin.id
          })
        }
      }
    }, 200)
  }

  const handleWorkflowDoubleClick = async (pin: PinnedTab) => {
    // Clear single-click timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
    }

    if (pin.type === 'bookmark' && pin.filePath) {
       // Just call single click logic for bookmarks as it's the same (open the file)
       handleWorkflowClick(pin)
    } else {
      // Force open fresh copy for workflows
      addTab({
        title: pin.name,
        content: pin.content,
        language: 'markdown',
        pinnedTabId: pin.id
      })
    }
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
    if (confirm(`Delete ${selectedItems.size} selected workflows?`)) {
      Array.from(selectedItems).forEach(id => removePinnedTab(id))
      setSelectedItems(new Set())
    }
  }

  const handleBulkToggle = () => {
    const selected = pinnedTabs.filter(p => selectedItems.has(p.id))
    const hasHidden = selected.some(p => p.isHidden)
    togglePinnedTabsVisibilityBulk(Array.from(selectedItems), !hasHidden)
  }

  return (
    <div className={styles.container}>
      <ManagerToolbar
        onAdd={() => setShowAddForm(!showAddForm)}
        addTooltip="Add Workflow"
        bulkMode={bulkMode}
        onToggleBulk={() => setBulkMode(!bulkMode)}
        selectedCount={selectedItems.size}
        onBulkDelete={handleBulkDelete}
        bulkActions={
          <button className={styles.toolbarButton} onClick={handleBulkToggle} title="Toggle Visibility">
            <Eye size={16} />
          </button>
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
           {/* Type Selector */}
           <div className={styles.codeTypeSelector}>
            <button
              className={`${styles.codeTypeBtn} ${formData.type === 'workflow' ? styles.active : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'workflow' }))}
              title="Loads content into a new tab"
            >
              <WorkflowIcon size={14} /> Workflow
            </button>
            <button
              className={`${styles.codeTypeBtn} ${formData.type === 'bookmark' ? styles.active : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, type: 'bookmark' }))}
              title="Opens existing file from disk"
            >
              <Bookmark size={14} /> Bookmark
            </button>
          </div>

          <input 
            className={styles.input} 
            placeholder="Name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          <CategorySelector
            value={formData.category}
            categories={categories}
            onChange={val => setFormData({...formData, category: val})}
            placeholder="Select Category"
          />
          
          <div className={styles.iconSection}>
            <div className={styles.iconGrid}>
              {PINNED_TAB_ICONS.map(iconName => (
                <button
                  key={iconName}
                  className={`${styles.iconOption} ${formData.icon === iconName ? styles.iconSelected : ''}`}
                  onClick={() => setFormData({ ...formData, icon: iconName })}
                >
                  <DynamicIcon name={iconName} size={16} />
                </button>
              ))}
            </div>
          </div>

          {!editingId && (
            <select
              className={styles.select}
              value={formData.sourceTabId}
              onChange={e => setFormData({...formData, sourceTabId: e.target.value})}
            >
              <option value="">-- Manual Content/Path --</option>
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>Use Tab: {tab.title}</option>
              ))}
            </select>
          )}

          {formData.type === 'bookmark' && (!formData.sourceTabId || editingId) && (
            <input
              className={styles.input}
              placeholder="Full file path..."
              value={formData.filePath}
              onChange={e => setFormData({ ...formData, filePath: e.target.value })}
            />
          )}

          {formData.type === 'workflow' && (!formData.sourceTabId || editingId) && (
            <textarea
              className={styles.textarea}
              placeholder="Blueprint content..."
              rows={6}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
            />
          )}

          <div className={styles.formButtons}>
            <button className={styles.primaryButton} onClick={editingId ? handleUpdate : handleAdd}>
              {editingId ? 'Update' : 'Create'}
            </button>
            <button className={styles.secondaryButton} onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      <ManagerList
        groups={groupedWorkflows}
        categories={categories}
        collapsedCategories={pinnedCollapsedCategories}
        onToggleCategory={togglePinnedCategoryCollapse}
        onMoveCategory={movePinnedTabCategory}
        emptyMessage="No workflows or bookmarks"
        renderItem={(pin) => (
          <ManagerItem
            key={pin.id}
            id={pin.id}
            title={pin.name}
            icon={
              <>
                <span className={styles.typeBadge} title={pin.type === 'bookmark' ? 'Bookmark' : 'Workflow'} style={{ marginRight: 0, padding: 1, border: 'none', background: 'transparent' }}>
                  {pin.type === 'bookmark' ? <Bookmark size={10} /> : <WorkflowIcon size={10} />}
                </span>
                <DynamicIcon name={pin.icon} size={16} />
              </>
            }
            bulkMode={bulkMode}
            isSelected={selectedItems.has(pin.id)}
            onToggleSelect={toggleSelection}
            isHidden={pin.isHidden}
            onClick={() => handleWorkflowClick(pin)}
            onDoubleClick={() => handleWorkflowDoubleClick(pin)}
            badges={
              <>
                {pin.isHidden && <span className={styles.hiddenBadge}>Disabled</span>}
              </>
            }
            actions={
              <>
                <button className={styles.playButton} onClick={() => handleWorkflowClick(pin)}>
                  <Play size={12} fill="currentColor" />
                </button>
                <button className={styles.actionButton} onClick={() => handleEdit(pin)}>
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
