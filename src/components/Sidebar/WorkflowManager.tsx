import { useState, useEffect, useMemo, useRef } from 'react'
import { useTabStore, PinnedTab } from '../../store/tabStore'
import { useNotificationStore } from '../../store/notificationStore'
import { PINNED_TAB_ICONS, PinnedTabIcon, DEFAULT_PINNED_TAB_ICON } from '../../constants/pinnedTabIcons'
import * as Icons from 'lucide-react'
import { 
  FileText, Play, Edit2, Plus, Eye, EyeOff
} from 'lucide-react'
import { ManagerToolbar } from './shared/ManagerToolbar'
import { ManagerList } from './shared/ManagerList'
import { ManagerItem } from './shared/ManagerItem'
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
  } = useTabStore()
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
    content: '',
    category: 'General',
    sourceTabId: ''
  })

  useEffect(() => {
    if (!bulkMode) setSelectedItems(new Set())
  }, [bulkMode])

  const groupedWorkflows = useMemo(() => {
    return pinnedTabs.reduce((acc, p) => {
      if (!showHidden && p.isHidden) return acc
      const cat = p.category || 'General'
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
      content: '',
      category: 'General',
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
    if (formData.sourceTabId) {
      const sourceTab = tabs.find(t => t.id === formData.sourceTabId)
      if (sourceTab) content = sourceTab.content
    }

    if (!content.trim()) {
      addNotification({ type: 'warning', message: 'Content required' })
      return
    }

    addPinnedTab({
      name: formData.name,
      icon: formData.icon,
      content: content,
      category: formData.category || 'General',
      isHidden: false
    })

    addNotification({ type: 'success', message: 'Workflow created' })
    resetForm()
  }

  const handleUpdate = () => {
    if (!editingId) return
    updatePinnedTab(editingId, {
      name: formData.name,
      icon: formData.icon,
      content: formData.content,
      category: formData.category
    })
    addNotification({ type: 'success', message: 'Workflow updated' })
    resetForm()
  }

  const handleEdit = (pin: PinnedTab) => {
    setFormData({
      name: pin.name,
      icon: pin.icon as PinnedTabIcon,
      content: pin.content,
      category: pin.category || 'General',
      sourceTabId: ''
    })
    setEditingId(pin.id)
    setShowAddForm(true)
  }

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleWorkflowClick = (pin: PinnedTab) => {
    // Clear any pending click
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
      return
    }

    // Delay single-click to allow double-click detection
    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null

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
    }, 200) // 200ms delay for double-click window
  }

  const handleWorkflowDoubleClick = (pin: PinnedTab) => {
    // Clear single-click timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
    }

    // Force open fresh copy
    addTab({
      title: pin.name,
      content: pin.content,
      language: 'markdown',
      pinnedTabId: pin.id
    })
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
          <input 
            className={styles.input} 
            placeholder="Workflow name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          <input 
            className={styles.input} 
            placeholder="Category" 
            value={formData.category} 
            onChange={e => setFormData({...formData, category: e.target.value})} 
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
              <option value="">-- Enter content manually --</option>
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.title}</option>
              ))}
            </select>
          )}

          {(!formData.sourceTabId || editingId) && (
            <textarea
              className={styles.textarea}
              placeholder="Content..."
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
        emptyMessage="No workflows"
        renderItem={(pin) => (
          <ManagerItem
            key={pin.id}
            id={pin.id}
            title={pin.name}
            icon={<DynamicIcon name={pin.icon} size={16} />}
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
