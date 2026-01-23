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
  selectedCategory: string | null
  sortBy: 'name' | 'date' | 'category'

  // CRUD operations
  addAction: (action: Omit<Action, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>) => void
  updateAction: (id: string, updates: Partial<Omit<Action, 'id' | 'createdAt' | 'isDefault'>>) => void
  deleteAction: (id: string) => void
  toggleActionEnabled: (id: string) => void

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
  importActions: (jsonString: string) => void
  clearAllActions: () => void
}

// Load persisted actions from localStorage
const loadPersistedActions = (): Action[] => {
  try {
    const saved = localStorage.getItem('contextpad-actions')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load actions:', error)
  }
  return []
}

// Save actions to localStorage
const persistActions = (actions: Action[]) => {
  try {
    localStorage.setItem('contextpad-actions', JSON.stringify(actions))
  } catch (error) {
    console.error('Failed to persist actions:', error)
  }
}

export const useActionStore = create<ActionState>((set, get) => ({
  actions: loadPersistedActions(),
  selectedCategory: null,
  sortBy: 'name',

  addAction: (action) => {
    const newAction: Action = {
      ...action,
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

  updateAction: (id, updates) => {
    set((state) => {
      const actions = state.actions.map(a =>
        a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a
      )
      persistActions(actions)
      return { actions }
    })
  },

  deleteAction: (id) => {
    set((state) => {
      const actions = state.actions.filter(a => a.id !== id)
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

  getAllCategories: () => {
    const { actions } = get()
    const categoryMap = new Map<string, number>()

    actions.forEach(action => {
      const count = categoryMap.get(action.category) || 0
      categoryMap.set(action.category, count + 1)
    })

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
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
      actions: actions.filter(a => !a.isDefault) // Only export custom actions
    }, null, 2)
  },

  importActions: (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      const importedActions = data.actions || []

      set((state) => {
        // Add imported actions with new IDs to avoid conflicts
        const newActions = importedActions.map((action: any) => ({
          ...action,
          id: crypto.randomUUID(),
          isDefault: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }))

        const actions = [...state.actions, ...newActions]
        persistActions(actions)
        return { actions }
      })
    } catch (error) {
      throw new Error('Invalid JSON format')
    }
  },

  clearAllActions: () => {
    set({ actions: [] })
    persistActions([])
  }
}))
