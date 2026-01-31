import { create } from 'zustand'
import { extractTemplateVariables } from '../utils/templateVariables'

export interface Template {
  id: string
  name: string
  content: string
  category: string
  variables: string[] // Extracted {{placeholders}}
  isHidden: boolean
  createdAt: number
  updatedAt: number
}

export interface TemplateCategory {
  name: string
  count: number
}

interface TemplateState {
  templates: Template[]
  collapsedCategories: string[]
  categoryOrder: string[]
  pinnedTemplateIds: string[]
  
  categories: string[]
  selectedCategory: string | null
  sortBy: 'name' | 'date' | 'category'
  sortOrder: 'asc' | 'desc'

  // CRUD operations
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void
  addTemplatesBulk: (templates: Template[]) => void
  updateTemplate: (id: string, updates: Partial<Omit<Template, 'id' | 'createdAt'>>) => void
  renameTemplateId: (oldId: string, newId: string) => boolean
  deleteTemplate: (id: string) => void
  deleteTemplatesBulk: (ids: string[]) => void
  toggleTemplateVisibility: (id: string) => void
  toggleTemplatesVisibilityBulk: (ids: string[], isHidden: boolean) => void

  // UI State Persistence
  toggleCategoryCollapse: (category: string) => void
  moveCategory: (category: string, direction: 'up' | 'down') => void
  toggleTemplatePin: (id: string) => void
  isTemplatePinned: (id: string) => boolean

  // Category management
  getTemplatesByCategory: (category: string) => Template[]
  getAllCategories: () => TemplateCategory[]

  // Filtering and sorting
  setSelectedCategory: (category: string | null) => void
  setSortBy: (sortBy: 'name' | 'date' | 'category') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  getFilteredTemplates: () => Template[]
  getVisibleTemplates: () => Template[]

  // Utility
  extractVariables: (content: string) => string[]
  getTemplateById: (id: string) => Template | undefined

  // Import/Export
  exportTemplates: () => string
  importTemplates: (jsonString: string) => { added: number, skipped: number, duplicates: string[] }
  clearAllTemplates: () => void
}

const STORAGE_KEY_TEMPLATES = 'contextpad-templates'
const STORAGE_KEY_UI = 'contextpad-templates-ui'

interface PersistedUIState {
  collapsedCategories: string[]
  categoryOrder: string[]
  pinnedTemplateIds: string[]
}

// Use the utility function for variable extraction
const extractVariables = extractTemplateVariables

// Load persisted templates
const loadPersistedTemplates = (): Template[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES)
    if (saved) {
      return JSON.parse(saved) as Template[]
    }
  } catch (error) {
    console.error('Failed to load templates:', error)
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
    console.error('Failed to load template UI state:', error)
  }
  return { collapsedCategories: [], categoryOrder: [], pinnedTemplateIds: [] }
}

const persistTemplates = (templates: Template[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates))
  } catch (error) {
    console.error('Failed to persist templates:', error)
  }
}

const persistUI = (state: PersistedUIState) => {
  try {
    localStorage.setItem(STORAGE_KEY_UI, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to persist template UI state:', error)
  }
}

export const useTemplateStore = create<TemplateState>((set, get) => {
  const initialTemplates = loadPersistedTemplates()
  const initialUI = loadPersistedUI()

  return {
    templates: initialTemplates,
    collapsedCategories: initialUI.collapsedCategories,
    categoryOrder: initialUI.categoryOrder,
    pinnedTemplateIds: initialUI.pinnedTemplateIds,
    
    categories: [],
    selectedCategory: null,
    sortBy: 'name',
    sortOrder: 'asc',

    addTemplate: (template) => {
      const newTemplate: Template = {
        ...template,
        category: template.category,
        id: crypto.randomUUID(),
        variables: extractVariables(template.content),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      set((state) => {
        const templates = [...state.templates, newTemplate]
        persistTemplates(templates)
        return { templates }
      })
    },

    addTemplatesBulk: (newTemplates) => {
      set((state) => {
        const processed = newTemplates.map(t => ({
          ...t,
          id: t.id || crypto.randomUUID(),
          category: t.category,
          variables: extractVariables(t.content),
          updatedAt: Date.now()
        }))
        
        const templates = [...state.templates, ...processed]
        persistTemplates(templates)
        return { templates }
      })
    },

    updateTemplate: (id, updates) => {
      set((state) => {
        const templates = state.templates.map(t => {
          if (t.id === id) {
            const updated = { ...t, ...updates, updatedAt: Date.now() }
            if (updates.content !== undefined) {
              updated.variables = extractVariables(updates.content)
            }
            return updated
          }
          return t
        })
        persistTemplates(templates)
        return { templates }
      })
    },

    renameTemplateId: (oldId, newId) => {
      const state = get()
      if (state.templates.some(t => t.id === newId)) {
        return false
      }

      set((state) => {
        const templates = state.templates.map(t =>
          t.id === oldId ? { ...t, id: newId, updatedAt: Date.now() } : t
        )
        const pinnedTemplateIds = state.pinnedTemplateIds.map(id => id === oldId ? newId : id)

        persistTemplates(templates)
        persistUI({
          collapsedCategories: state.collapsedCategories,
          categoryOrder: state.categoryOrder,
          pinnedTemplateIds
        })
        return { templates, pinnedTemplateIds }
      })
      return true
    },

    deleteTemplate: (id) => {
      set((state) => {
        const templates = state.templates.filter(t => t.id !== id)
        persistTemplates(templates)
        return { templates }
      })
    },

    deleteTemplatesBulk: (ids) => {
      set((state) => {
        const idSet = new Set(ids)
        const templates = state.templates.filter(t => !idSet.has(t.id))
        persistTemplates(templates)
        return { templates }
      })
    },

    toggleTemplateVisibility: (id) => {
      set((state) => {
        const templates = state.templates.map(t =>
          t.id === id ? { ...t, isHidden: !t.isHidden } : t
        )
        persistTemplates(templates)
        return { templates }
      })
    },

    toggleTemplatesVisibilityBulk: (ids, isHidden) => {
      set((state) => {
        const idSet = new Set(ids)
        const templates = state.templates.map(t =>
          idSet.has(t.id) ? { ...t, isHidden } : t
        )
        persistTemplates(templates)
        return { templates }
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
          pinnedTemplateIds: state.pinnedTemplateIds
        })
        return { collapsedCategories }
      })
    },

    moveCategory: (category, direction) => {
      set((state) => {
        const categories = get().getAllCategories().map(c => c.name)
        let order = state.categoryOrder.length > 0 ? [...state.categoryOrder] : [...categories]
        
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
          pinnedTemplateIds: state.pinnedTemplateIds
        })
        return { categoryOrder: order }
      })
    },

    toggleTemplatePin: (id) => {
      set((state) => {
        const current = new Set(state.pinnedTemplateIds)
        if (current.has(id)) {
          current.delete(id)
        } else {
          current.add(id)
        }
        const pinnedTemplateIds = Array.from(current)
        persistUI({
          collapsedCategories: state.collapsedCategories,
          categoryOrder: state.categoryOrder,
          pinnedTemplateIds
        })
        return { pinnedTemplateIds }
      })
    },

    isTemplatePinned: (id) => {
      return get().pinnedTemplateIds.includes(id)
    },

    getTemplatesByCategory: (category) => {
      return get().templates.filter(t => t.category === category && !t.isHidden)
    },

    getAllCategories: () => {
      const { templates, categoryOrder } = get()
      const categoryMap = new Map<string, number>()

      templates.forEach(t => {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1)
      })

      const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count
      }))

      if (categoryOrder.length > 0) {
        categories.sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.name)
          const indexB = categoryOrder.indexOf(b.name)
          
          if (indexA !== -1 && indexB !== -1) return indexA - indexB
          if (indexA !== -1) return -1
          if (indexB !== -1) return 1
          return a.name.localeCompare(b.name)
        })
      } else {
        categories.sort((a, b) => a.name.localeCompare(b.name))
      }

      return categories
    },

    setSelectedCategory: (category) => {
      set({ selectedCategory: category })
    },

    setSortBy: (sortBy) => {
      set({ sortBy })
    },

    setSortOrder: (order) => {
      set({ sortOrder: order })
    },

    getFilteredTemplates: () => {
      const { templates, selectedCategory, sortBy, sortOrder } = get()

      let filtered = selectedCategory
        ? templates.filter(t => t.category === selectedCategory)
        : templates

      filtered = [...filtered].sort((a, b) => {
        let comparison = 0
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'date':
            comparison = a.updatedAt - b.updatedAt
            break
          case 'category':
            comparison = a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
            break
        }
        return sortOrder === 'asc' ? comparison : -comparison
      })

      return filtered
    },

    getVisibleTemplates: () => {
      return get().templates.filter(t => !t.isHidden)
    },

    extractVariables,

    getTemplateById: (id) => {
      return get().templates.find(t => t.id === id)
    },

    exportTemplates: () => {
      const { templates } = get()
      return JSON.stringify({
        version: '1.0',
        exportDate: new Date().toISOString(),
        templates
      }, null, 2)
    },

    importTemplates: (jsonString) => {
      try {
        const data = JSON.parse(jsonString)

        if (!data.templates || !Array.isArray(data.templates)) {
          throw new Error('Invalid template format')
        }

        const currentTemplates = get().templates
        const added: Template[] = []
        const duplicates: string[] = []

        data.templates.forEach((t: any) => {
          // Check for duplicate name
          const exists = currentTemplates.some(curr => 
            curr.name.toLowerCase() === (t.name || 'Unnamed Template').toLowerCase()
          )

          if (exists) {
            duplicates.push(t.name)
          } else {
            added.push({
              id: crypto.randomUUID(),
              name: t.name || 'Unnamed Template',
              content: t.content || '',
              category: t.category || 'Uncategorized',
              variables: Array.isArray(t.variables) ? t.variables : extractVariables(t.content || ''),
              isHidden: t.isHidden || false,
              createdAt: Date.now(),
              updatedAt: Date.now()
            })
          }
        })

        if (added.length > 0) {
          set((state) => {
            const templates = [...state.templates, ...added]
            persistTemplates(templates)
            return { templates }
          })
        }

        return { 
          added: added.length, 
          skipped: duplicates.length, 
          duplicates 
        }

      } catch (error) {
        console.error('Failed to import templates:', error)
        throw error
      }
    },

    clearAllTemplates: () => {
      set({ templates: [] })
      persistTemplates([])
    }
  }
})