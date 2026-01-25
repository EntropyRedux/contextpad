import { create } from 'zustand'

export type ActionType = 'button' | 'command'

export interface Action {
  id: string
  name: string
  description: string
  type: ActionType
  code: string // JavaScript code to execute
  category: string
  enabled: boolean
  isDefault: boolean
  createdAt: number
  updatedAt: number
}

export interface ActionCategory {
  name: string
  count: number
}

interface ActionState {
  actions: Action[]
  collapsedCategories: string[]
  categoryOrder: string[]
  pinnedActionIds: string[]
  
  selectedCategory: string | null
  sortBy: 'name' | 'date' | 'category'

  // CRUD operations
  addAction: (action: Omit<Action, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => void
  addActionsBulk: (actions: Action[]) => void
  updateAction: (id: string, updates: Partial<Omit<Action, 'id' | 'createdAt' | 'isDefault'>>) => void
  renameActionId: (oldId: string, newId: string) => boolean
  deleteAction: (id: string) => void
  deleteActionsBulk: (ids: string[]) => void
  toggleActionEnabled: (id: string) => void
  toggleActionsEnabledBulk: (ids: string[], enabled: boolean) => void

  // UI State Persistence
  toggleCategoryCollapse: (category: string) => void
  moveCategory: (category: string, direction: 'up' | 'down') => void
  toggleActionPin: (id: string) => void
  isActionPinned: (id: string) => boolean

  // Category management
  getAllCategories: () => ActionCategory[]
  setSelectedCategory: (category: string | null) => void
  setSortBy: (sortBy: 'name' | 'date' | 'category') => void

  // Filtering
  getFilteredActions: () => Action[]
  getEnabledActions: () => Action[]

  // Utility
  getActionById: (id: string) => Action | undefined

  // Import/Export
  exportActions: () => string
  importActions: (jsonString: string, behavior?: 'skip' | 'overwrite') => { added: number, updated: number, skipped: number, duplicates: string[] }
  clearAllActions: () => void
}

// Persistence Keys
const STORAGE_KEY_ACTIONS = 'contextpad-actions'
const STORAGE_KEY_UI = 'contextpad-actions-ui'

interface PersistedUIState {
  collapsedCategories: string[]
  categoryOrder: string[]
  pinnedActionIds: string[]
}

// Load persisted actions
const loadPersistedActions = (): Action[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIONS)
    if (saved) {
      const actions = JSON.parse(saved) as Action[]
      // Normalize categories
      let needsNormalization = false
      const normalized = actions.map(action => {
        const upperCategory = action.category.toUpperCase()
        if (action.category !== upperCategory) {
          needsNormalization = true
          return { ...action, category: upperCategory }
        }
        return action
      })
      if (needsNormalization) {
        localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(normalized))
      }
      return normalized
    }
  } catch (error) {
    console.error('Failed to load actions:', error)
  }
  return []
}

// Load persisted UI state
const loadPersistedUI = (): PersistedUIState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_UI)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load action UI state:', error)
  }
  return { collapsedCategories: [], categoryOrder: [], pinnedActionIds: [] }
}

const persistActions = (actions: Action[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(actions))
  } catch (error) {
    console.error('Failed to persist actions:', error)
  }
}

const persistUI = (state: PersistedUIState) => {
  try {
    localStorage.setItem(STORAGE_KEY_UI, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to persist action UI state:', error)
  }
}

export const useActionStore = create<ActionState>((set, get) => {
  // Initial load
  const initialActions = loadPersistedActions()
  const initialUI = loadPersistedUI()

  return {
    actions: initialActions,
    collapsedCategories: initialUI.collapsedCategories,
    categoryOrder: initialUI.categoryOrder,
    pinnedActionIds: initialUI.pinnedActionIds,
    
    selectedCategory: null,
    sortBy: 'name',

    addAction: (action) => {
      const newAction: Action = {
        ...action,
        category: action.category.toUpperCase(),
        id: crypto.randomUUID(),
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      set((state) => {
        const actions = [...state.actions, newAction]
        persistActions(actions)
        return { actions }
      })
    },

    addActionsBulk: (newActions) => {
      set((state) => {
        // Ensure IDs and normalized categories
        const processed = newActions.map(a => ({
          ...a,
          id: a.id || crypto.randomUUID(),
          category: a.category.toUpperCase(),
          updatedAt: Date.now()
        }))
        
        const actions = [...state.actions, ...processed]
        persistActions(actions)
        return { actions }
      })
    },

    updateAction: (id, updates) => {
      set((state) => {
        const normalizedUpdates = updates.category
          ? { ...updates, category: updates.category.toUpperCase() }
          : updates
        const actions = state.actions.map(a =>
          a.id === id ? { ...a, ...normalizedUpdates, updatedAt: Date.now() } : a
        )
        persistActions(actions)
        return { actions }
      })
    },

    renameActionId: (oldId, newId) => {
      const state = get()
      if (state.actions.some(a => a.id === newId)) {
        return false // ID already exists
      }
      
      set((state) => {
        const actions = state.actions.map(a =>
          a.id === oldId ? { ...a, id: newId, updatedAt: Date.now() } : a
        )
        // Also update pinned IDs
        const pinnedActionIds = state.pinnedActionIds.map(id => id === oldId ? newId : id)
        
        persistActions(actions)
        persistUI({
          collapsedCategories: state.collapsedCategories,
          categoryOrder: state.categoryOrder,
          pinnedActionIds
        })
        
        return { actions, pinnedActionIds }
      })
      return true
    },

    deleteAction: (id) => {
      set((state) => {
        const actions = state.actions.filter(a => a.id !== id)
        persistActions(actions)
        return { actions }
      })
    },

    deleteActionsBulk: (ids) => {
      set((state) => {
        const idSet = new Set(ids)
        const actions = state.actions.filter(a => !idSet.has(a.id))
        persistActions(actions)
        return { actions }
      })
    },

    toggleActionEnabled: (id) => {
      set((state) => {
        const actions = state.actions.map(a =>
          a.id === id ? { ...a, enabled: !a.enabled, updatedAt: Date.now() } : a
        )
        persistActions(actions)
        return { actions }
      })
    },

    toggleActionsEnabledBulk: (ids, enabled) => {
      set((state) => {
        const idSet = new Set(ids)
        const actions = state.actions.map(a =>
          idSet.has(a.id) ? { ...a, enabled, updatedAt: Date.now() } : a
        )
        persistActions(actions)
        return { actions }
      })
    },

    toggleCategoryCollapse: (category) => {
      set((state) => {
        const current = new Set(state.collapsedCategories)
        if (current.has(category)) {
          current.delete(category)
        } else {
          current.add(category)
        }
        const collapsedCategories = Array.from(current)
        persistUI({
          collapsedCategories,
          categoryOrder: state.categoryOrder,
          pinnedActionIds: state.pinnedActionIds
        })
        return { collapsedCategories }
      })
    },

    moveCategory: (category, direction) => {
      set((state) => {
        const categories = get().getAllCategories().map(c => c.name)
        // If category order is empty, initialize it
        let order = state.categoryOrder.length > 0 ? [...state.categoryOrder] : [...categories]
        
        // Ensure all current categories are in the order list
        categories.forEach(c => {
          if (!order.includes(c)) order.push(c)
        })
        
        const index = order.indexOf(category)
        if (index === -1) return {}

        if (direction === 'up' && index > 0) {
          [order[index], order[index - 1]] = [order[index - 1], order[index]]
        } else if (direction === 'down' && index < order.length - 1) {
          [order[index], order[index + 1]] = [order[index + 1], order[index]]
        }

        persistUI({
          collapsedCategories: state.collapsedCategories,
          categoryOrder: order,
          pinnedActionIds: state.pinnedActionIds
        })
        return { categoryOrder: order }
      })
    },

    toggleActionPin: (id) => {
      set((state) => {
        const current = new Set(state.pinnedActionIds)
        if (current.has(id)) {
          current.delete(id)
        } else {
          current.add(id)
        }
        const pinnedActionIds = Array.from(current)
        persistUI({
          collapsedCategories: state.collapsedCategories,
          categoryOrder: state.categoryOrder,
          pinnedActionIds
        })
        return { pinnedActionIds }
      })
    },

    isActionPinned: (id) => {
      return get().pinnedActionIds.includes(id)
    },

    getAllCategories: () => {
      const { actions, categoryOrder } = get()
      const categoryMap = new Map<string, number>()

      actions.forEach(action => {
        const count = categoryMap.get(action.category) || 0
        categoryMap.set(action.category, count + 1)
      })

      // Convert to array
      const categories = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
      
      // Sort based on custom order
      if (categoryOrder.length > 0) {
        categories.sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.name)
          const indexB = categoryOrder.indexOf(b.name)
          
          // If both are in order list, sort by index
          if (indexA !== -1 && indexB !== -1) return indexA - indexB
          // If only A is in list, it comes first
          if (indexA !== -1) return -1
          // If only B is in list, it comes first
          if (indexB !== -1) return 1
          // Otherwise alphabetical
          return a.name.localeCompare(b.name)
        })
      } else {
        categories.sort((a, b) => a.name.localeCompare(b.name))
      }

      return categories
    },

    setSelectedCategory: (category) => set({ selectedCategory: category }),
    setSortBy: (sortBy) => set({ sortBy }),

    getFilteredActions: () => {
      const { actions, selectedCategory, sortBy } = get()

      let filtered = selectedCategory
        ? actions.filter(a => a.category === selectedCategory)
        : actions

      // Sort
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'date':
            return b.createdAt - a.createdAt
          case 'category':
            return a.category.localeCompare(b.category)
          default:
            return 0
        }
      })

      // Sort disabled to bottom
      return filtered.sort((a, b) => {
        if (a.enabled !== b.enabled) {
          return a.enabled ? -1 : 1
        }
        return 0
      })
    },

    getEnabledActions: () => {
      return get().actions.filter(a => a.enabled)
    },

    getActionById: (id) => {
      return get().actions.find(a => a.id === id)
    },

    exportActions: () => {
      const { actions } = get()
      return JSON.stringify({
        version: '1.0',
        exportDate: new Date().toISOString(),
        actions: actions.filter(a => !a.isDefault)
      }, null, 2)
    },

    importActions: (jsonString, behavior = 'skip') => {
      try {
        const data = JSON.parse(jsonString)
        const importedActions = data.actions || []
        
        // Calculate effects BEFORE state update
        const state = get()
        const currentActions = [...state.actions]
        const added: Action[] = []
        const duplicates: string[] = []
        let updatedCount = 0
        
        const actionsToSave = [...currentActions]

        importedActions.forEach((importAction: any) => {
          const existingIndex = actionsToSave.findIndex(a => 
            a.name.toLowerCase() === importAction.name.toLowerCase()
          )

          if (existingIndex !== -1) {
            duplicates.push(importAction.name)
            if (behavior === 'overwrite') {
              // Update existing
              actionsToSave[existingIndex] = {
                ...actionsToSave[existingIndex],
                ...importAction,
                id: actionsToSave[existingIndex].id, // Keep ID
                updatedAt: Date.now()
              }
              updatedCount++
            }
          } else {
            // Add new
            added.push({
              ...importAction,
              id: crypto.randomUUID(),
              isDefault: false,
              createdAt: Date.now(),
              updatedAt: Date.now()
            })
          }
        })

        if (added.length > 0 || updatedCount > 0) {
          const finalActions = [...actionsToSave, ...added]
          set({ actions: finalActions })
          persistActions(finalActions)
        }

        return { 
          added: added.length, 
          updated: updatedCount, 
          skipped: behavior === 'skip' ? duplicates.length : 0, 
          duplicates 
        }

      } catch (error) {
        throw new Error('Invalid JSON format')
      }
    },

    clearAllActions: () => {
      set({ actions: [] })
      persistActions([])
    }
  }
})
