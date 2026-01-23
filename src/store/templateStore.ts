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
  categories: string[]
  selectedCategory: string | null
  sortBy: 'name' | 'date' | 'category'
  sortOrder: 'asc' | 'desc'

  // CRUD operations
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTemplate: (id: string, updates: Partial<Omit<Template, 'id' | 'createdAt'>>) => void
  deleteTemplate: (id: string) => void
  toggleTemplateVisibility: (id: string) => void

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
  importTemplates: (jsonString: string) => void
  clearAllTemplates: () => void
}

// Use the utility function for variable extraction
const extractVariables = extractTemplateVariables

// Load persisted templates from localStorage
const loadPersistedTemplates = (): Template[] => {
  try {
    const saved = localStorage.getItem('contextpad-templates')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load templates:', error)
  }
  return []
}

// Save templates to localStorage
const persistTemplates = (templates: Template[]) => {
  try {
    localStorage.setItem('contextpad-templates', JSON.stringify(templates))
  } catch (error) {
    console.error('Failed to persist templates:', error)
  }
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: loadPersistedTemplates(),
  categories: [],
  selectedCategory: null,
  sortBy: 'name',
  sortOrder: 'asc',

  addTemplate: (template) => {
    const newTemplate: Template = {
      ...template,
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

  updateTemplate: (id, updates) => {
    set((state) => {
      const templates = state.templates.map(t => {
        if (t.id === id) {
          const updated = { ...t, ...updates, updatedAt: Date.now() }
          // Re-extract variables if content changed
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

  deleteTemplate: (id) => {
    set((state) => {
      const templates = state.templates.filter(t => t.id !== id)
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

  getTemplatesByCategory: (category) => {
    return get().templates.filter(t => t.category === category && !t.isHidden)
  },

  getAllCategories: () => {
    const templates = get().templates
    const categoryMap = new Map<string, number>()

    // Count ALL templates including hidden
    templates.forEach(t => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1)
    })

    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => a.name.localeCompare(b.name))
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

    // Filter by category only (NOT by hidden - let UI handle that)
    let filtered = selectedCategory
      ? templates.filter(t => t.category === selectedCategory)
      : templates

    // Sort
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

  // Get only visible templates (for menus, quick access)
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

      // Validate and import templates
      const importedTemplates: Template[] = data.templates.map((t: any) => ({
        id: crypto.randomUUID(), // Generate new IDs to avoid conflicts
        name: t.name || 'Unnamed Template',
        content: t.content || '',
        category: t.category || 'Uncategorized',
        variables: Array.isArray(t.variables) ? t.variables : extractVariables(t.content),
        isHidden: t.isHidden || false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }))

      set((state) => {
        const templates = [...state.templates, ...importedTemplates]
        persistTemplates(templates)
        return { templates }
      })
    } catch (error) {
      console.error('Failed to import templates:', error)
      throw error
    }
  },

  clearAllTemplates: () => {
    set({ templates: [] })
    persistTemplates([])
  }
}))
