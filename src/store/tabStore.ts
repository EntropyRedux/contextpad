import { create } from 'zustand'
import { indexedDBStorage } from '../services/storage/IndexedDBStorage'
import welcomeContent from '../data/WELCOME.md?raw'

export interface Tab {
  id: string
  title: string
  content: string
  filePath: string | null
  folderPath: string | null  // Per-tab folder context
  isDirty: boolean
  language: 'markdown' | string
  lastModifiedTime?: number
  editorView?: unknown // EditorView reference for outline parsing (not persisted)
  pinnedTabId?: string // If set, this tab is from a pinned workflow and should be locked
}

export interface CursorInfo {
  line: number
  column: number
}

export interface PinnedTab {
  id: string
  name: string
  icon: string  // Lucide icon name
  content: string
  category: string
  isHidden?: boolean
  createdAt: number
}

export interface ViewSettings {
  showStatusBar: boolean
  showLineNumbers: boolean
  showBreadcrumb: boolean
  showActivityBar: boolean
  showCodeBlockMarkers: boolean
  fontSize: number
  fontFamily: string
  wordWrap: boolean
  theme: string
  // Performance settings
  enableBracketMatching: boolean
  enableFoldGutter: boolean
  enableAutoIndent: boolean
  enableMarkdownRendering: boolean
  showTokenStats: boolean
  largeFileThreshold: number  // Lines threshold for auto-disabling features
  parserMode: 'auto' | 'ast' | 'stream' | 'plain' // Performance mode for syntax highlighting
  // Editor Features
  enableAutocomplete: boolean
  enableSpellCheck: boolean
  spellCheckMode: 'built-in' | 'browser' // built-in = custom linter, browser = native OS spellcheck
  enableCodeLinting: boolean
  indexingScope: 'performance' | 'thorough'
  autocompleteConfig: {
    activateOnTyping: boolean
    maxRenderedOptions: number
    minCharacters: number
    enableMarkdownSnippets: boolean
    enableCodeBlockSnippets: boolean
    useDocumentWords: boolean
    useDictionary: boolean
  }
  spellCheckConfig: {
    ignoreUppercase: boolean
    ignoreNumbers: boolean
    ignoreTitleCase: boolean
    ignoreSnakeCase: boolean
    customDictionary: string[]
  }
  codeLintConfig: {
    enableJsonLint: boolean
    enableYamlLint: boolean
    enableSqlLint: boolean
    enableHtmlLint: boolean
    enableJavaScriptLint: boolean
  }
}

interface TabState {
  tabs: Tab[]
  activeTabId: string | null
  cursorInfo: CursorInfo | null
  viewSettings: ViewSettings
  recentFiles: string[]
  showRightSidebar: boolean
  showLeftSidebar: boolean
  openFolderPath: string | null
  sidebarView: 'settings' | 'templates' | 'actions' | 'workflows'
  isInitialized: boolean
  pinnedTabs: PinnedTab[]
  pinnedCategoryOrder: string[]
  pinnedCollapsedCategories: string[]

  addTab: (tab?: Partial<Tab>) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<Tab>) => void
  getActiveTab: () => Tab | null
  setCursorInfo: (info: CursorInfo | null) => void
  setViewSettings: (settings: Partial<ViewSettings>) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  addRecentFile: (filePath: string) => void
  clearRecentFiles: () => void
  toggleRightSidebar: () => void
  toggleLeftSidebar: () => void
  setSidebarView: (view: 'settings' | 'templates' | 'actions' | 'workflows') => void
  setOpenFolderPath: (path: string | null) => void
  initializeFromStorage: () => Promise<void>
  // Pinned tabs functions
  addPinnedTab: (pin: Omit<PinnedTab, 'id' | 'createdAt'>) => void
  removePinnedTab: (id: string) => void
  updatePinnedTab: (id: string, updates: Partial<PinnedTab>) => void
  reorderPinnedTabs: (fromIndex: number, toIndex: number) => void
  togglePinnedTabVisibility: (id: string) => void
  togglePinnedTabsVisibilityBulk: (ids: string[], isHidden: boolean) => void
  movePinnedTabCategory: (category: string, direction: 'up' | 'down') => void
  togglePinnedCategoryCollapse: (category: string) => void
}

// Default view settings
const defaultViewSettings: ViewSettings = {
  showStatusBar: true,
  showLineNumbers: true,
  showBreadcrumb: true,
  showActivityBar: true,
  showCodeBlockMarkers: true,
  fontSize: 14,
  fontFamily: 'Consolas',
  wordWrap: true,
  theme: 'one-dark',
  enableBracketMatching: true,
  enableMarkdownRendering: true,
  showTokenStats: true,
  enableFoldGutter: true,
  enableAutoIndent: true,
  largeFileThreshold: 5000,
  parserMode: 'auto',
  enableAutocomplete: false,
  enableSpellCheck: false,
  spellCheckMode: 'built-in',
  enableCodeLinting: false,
  indexingScope: 'performance',
  autocompleteConfig: {
    activateOnTyping: true,
    maxRenderedOptions: 10,
    minCharacters: 2,
    enableMarkdownSnippets: true,
    enableCodeBlockSnippets: false,
    useDocumentWords: true,
    useDictionary: false
  },
  spellCheckConfig: {
    ignoreUppercase: true,
    ignoreNumbers: true,
    ignoreTitleCase: false,
    ignoreSnakeCase: false,
    customDictionary: []
  },
  codeLintConfig: {
    enableJsonLint: true,
    enableYamlLint: true,
    enableSqlLint: true,
    enableHtmlLint: true,
    enableJavaScriptLint: false
  }
}

// Content save timers for debouncing
const contentSaveTimers = new Map<string, number>()

// Debounced save for tab content (2 seconds)
const saveTabContentDebounced = (tabId: string, content: string) => {
  const existingTimer = contentSaveTimers.get(tabId)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  const timer = window.setTimeout(async () => {
    try {
      await indexedDBStorage.saveTabContent(tabId, content)
      contentSaveTimers.delete(tabId)
    } catch (error) {
      console.error(`Failed to save content for tab ${tabId}:`, error)
    }
  }, 2000) // 2 second debounce

  contentSaveTimers.set(tabId, timer)
}

// Save metadata immediately (small data, goes to localStorage)
const saveMetadataToLocalStorage = (state: TabState) => {
  try {
    const metadataToSave = {
      tabs: state.tabs.map(({ editorView, content, ...tab }) => ({
        ...tab,
        // Don't save content to localStorage anymore - it's in IndexedDB
        content: ''
      })),
      activeTabId: state.activeTabId,
      viewSettings: state.viewSettings,
      recentFiles: state.recentFiles,
      openFolderPath: state.openFolderPath,
      pinnedTabs: state.pinnedTabs,
      pinnedCategoryOrder: state.pinnedCategoryOrder,
      pinnedCollapsedCategories: state.pinnedCollapsedCategories
    }
    localStorage.setItem('contextpad-tabs-v2', JSON.stringify(metadataToSave))
  } catch (error) {
    console.error('Failed to save metadata:', error)
  }
}

// Load metadata from localStorage
const loadMetadataFromLocalStorage = () => {
  try {
    // Try new format first
    let savedState = localStorage.getItem('contextpad-tabs-v2')

    // Migrate from old format if needed
    if (!savedState) {
      savedState = localStorage.getItem('contextpad-tabs')
      if (savedState) {
        // Migrate: copy to new key
        localStorage.setItem('contextpad-tabs-v2', savedState)
        // Keep old key for rollback capability
      }
    }

    if (savedState) {
      const parsed = JSON.parse(savedState)

      // SAFETY RESET: Force disable spell checker and reset indexing scope
      // to prevent app hang from problematic settings combination
      const safeViewSettings = {
        ...defaultViewSettings,
        ...parsed.viewSettings,
        // Force these settings to safe defaults on every load
        enableSpellCheck: false,
        indexingScope: 'performance' as const
      }

      // Ensure pinned tabs have categories
      const pinnedTabs = (parsed.pinnedTabs || []).map((p: any) => ({
        ...p,
        category: p.category || 'General'
      }))

      return {
        tabs: parsed.tabs || [],
        activeTabId: parsed.activeTabId || null,
        viewSettings: safeViewSettings,
        recentFiles: parsed.recentFiles || [],
        openFolderPath: parsed.openFolderPath || null,
        pinnedTabs
      }
    }
  } catch (error) {
    console.error('Failed to load metadata:', error)
  }
  return null
}

// Default Pinned Tabs (Workflows)
const defaultPinnedTabs: PinnedTab[] = [
  {
    id: 'welcome-workflow',
    name: 'Welcome Guide',
    icon: 'BookOpen',
    content: welcomeContent,
    category: 'Help',
    createdAt: Date.now()
  }
]

const persistedMetadata = loadMetadataFromLocalStorage()

export const useTabStore = create<TabState>((set, get) => ({
  tabs: persistedMetadata?.tabs || [],
  activeTabId: persistedMetadata?.activeTabId || null,
  cursorInfo: null,
  viewSettings: persistedMetadata?.viewSettings || defaultViewSettings,
  recentFiles: persistedMetadata?.recentFiles || [],
  showRightSidebar: false,
  showLeftSidebar: false,
  openFolderPath: persistedMetadata?.openFolderPath || null,
  sidebarView: 'settings',
  isInitialized: false,
  pinnedTabs: persistedMetadata?.pinnedTabs || defaultPinnedTabs,
  pinnedCategoryOrder: (persistedMetadata as any)?.pinnedCategoryOrder || [],
  pinnedCollapsedCategories: (persistedMetadata as any)?.pinnedCollapsedCategories || [],

  // Initialize and load content from IndexedDB
  initializeFromStorage: async () => {
    const state = get()
    if (state.isInitialized) return

    try {
      // Load content for each tab from IndexedDB
      const tabsWithContent = await Promise.all(
        state.tabs.map(async (tab) => {
          const content = await indexedDBStorage.getTabContent(tab.id)
          return {
            ...tab,
            content: content || tab.content || ''
          }
        })
      )

      let finalTabs = tabsWithContent
      let finalActiveId = state.activeTabId

      // First Run Logic: If no tabs exist, open the Welcome Workflow
      if (finalTabs.length === 0) {
        // Find the welcome workflow in pinned tabs
        const welcomeWorkflow = state.pinnedTabs.find(p => p.id === 'welcome-workflow')
        
        if (welcomeWorkflow) {
          const welcomeTab: Tab = {
            id: crypto.randomUUID(),
            title: welcomeWorkflow.name,
            content: welcomeWorkflow.content,
            filePath: null,
            folderPath: null,
            isDirty: false,
            language: 'markdown',
            pinnedTabId: welcomeWorkflow.id
          }
          finalTabs = [welcomeTab]
          finalActiveId = welcomeTab.id
          
          // Persist immediately
          saveMetadataToLocalStorage({ ...state, tabs: finalTabs, activeTabId: finalActiveId })
          saveTabContentDebounced(welcomeTab.id, welcomeTab.content)
        }
      }

      set({
        tabs: finalTabs,
        activeTabId: finalActiveId,
        isInitialized: true
      })
    } catch (error) {
      console.error('Failed to initialize from IndexedDB:', error)
      set({ isInitialized: true })
    }
  },

  addTab: (tab) => {
    const newTab: Tab = {
      id: crypto.randomUUID(),
      title: tab?.title || 'Untitled',
      content: tab?.content || '',
      filePath: tab?.filePath || null,
      folderPath: tab?.folderPath || null,
      isDirty: false,
      language: tab?.language || 'markdown',
      ...tab
    }

    set((state) => {
      const newState = {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id
      }
      saveMetadataToLocalStorage(newState)

      // Save content to IndexedDB
      if (newTab.content) {
        saveTabContentDebounced(newTab.id, newTab.content)
      }

      return { tabs: newState.tabs, activeTabId: newState.activeTabId }
    })
  },

  removeTab: (id) => {
    // Cancel any pending save for this tab
    const timer = contentSaveTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      contentSaveTimers.delete(id)
    }

    // Delete from IndexedDB
    indexedDBStorage.deleteTab(id).catch(err => {
      console.error('Failed to delete tab from IndexedDB:', err)
    })

    set((state) => {
      const tabs = state.tabs.filter(t => t.id !== id)
      const activeTabId = state.activeTabId === id
        ? (tabs[0]?.id || null)
        : state.activeTabId
      const newState = { ...state, tabs, activeTabId }
      saveMetadataToLocalStorage(newState)
      return { tabs, activeTabId }
    })
  },

  setActiveTab: (id) => {
    set((state) => {
      const newState = { ...state, activeTabId: id }
      saveMetadataToLocalStorage(newState)
      return { activeTabId: id }
    })
  },

  updateTab: (id, updates) => {
    set((state) => {
      const tabs = state.tabs.map(t =>
        t.id === id ? { ...t, ...updates } : t
      )
      const newState = { ...state, tabs }
      saveMetadataToLocalStorage(newState)

      // If content is being updated, save to IndexedDB with debounce
      if (updates.content !== undefined) {
        saveTabContentDebounced(id, updates.content)
      }

      return { tabs }
    })
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find(t => t.id === activeTabId) || null
  },

  setCursorInfo: (info) => set({ cursorInfo: info }),

  setViewSettings: (settings) => {
    set((state) => {
      const viewSettings = { ...state.viewSettings, ...settings }
      const newState = { ...state, viewSettings }
      saveMetadataToLocalStorage(newState)
      return { viewSettings }
    })
  },

  reorderTabs: (fromIndex, toIndex) => {
    set((state) => {
      const newTabs = [...state.tabs]
      const [movedTab] = newTabs.splice(fromIndex, 1)
      newTabs.splice(toIndex, 0, movedTab)
      const newState = { ...state, tabs: newTabs }
      saveMetadataToLocalStorage(newState)
      return { tabs: newTabs }
    })
  },

  addRecentFile: (filePath) => {
    set((state) => {
      // Remove if already exists, then add to front
      const filtered = state.recentFiles.filter(f => f !== filePath)
      const recentFiles = [filePath, ...filtered].slice(0, 10) // Keep max 10
      const newState = { ...state, recentFiles }
      saveMetadataToLocalStorage(newState)
      return { recentFiles }
    })
  },

  clearRecentFiles: () => {
    set((state) => {
      const newState = { ...state, recentFiles: [] }
      saveMetadataToLocalStorage(newState)
      return { recentFiles: [] }
    })
  },

  toggleRightSidebar: () => {
    set((state) => ({
      showRightSidebar: !state.showRightSidebar
    }))
  },

  toggleLeftSidebar: () => {
    set((state) => ({
      showLeftSidebar: !state.showLeftSidebar
    }))
  },

  setSidebarView: (view) => {
    set({ sidebarView: view, showRightSidebar: true })
  },

  setOpenFolderPath: (path) => {
    set((state) => {
      const newState = { ...state, openFolderPath: path }
      saveMetadataToLocalStorage(newState)
      return { openFolderPath: path }
    })
  },

  // Pinned tabs functions
  addPinnedTab: (pin) => {
    const newPin: PinnedTab = {
      id: crypto.randomUUID(),
      name: pin.name,
      icon: pin.icon,
      content: pin.content,
      category: pin.category || 'General',
      createdAt: Date.now()
    }

    set((state) => {
      const pinnedTabs = [...state.pinnedTabs, newPin]
      const newState = { ...state, pinnedTabs }
      saveMetadataToLocalStorage(newState)
      return { pinnedTabs }
    })
  },

  removePinnedTab: (id) => {
    set((state) => {
      const pinnedTabs = state.pinnedTabs.filter(p => p.id !== id)
      const newState = { ...state, pinnedTabs }
      saveMetadataToLocalStorage(newState)
      return { pinnedTabs }
    })
  },

  updatePinnedTab: (id, updates) => {
    set((state) => {
      const pinnedTabs = state.pinnedTabs.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
      const newState = { ...state, pinnedTabs }
      saveMetadataToLocalStorage(newState)
      return { pinnedTabs }
    })
  },

  reorderPinnedTabs: (fromIndex, toIndex) => {
    set((state) => {
      const newPins = [...state.pinnedTabs]
      const [movedPin] = newPins.splice(fromIndex, 1)
      newPins.splice(toIndex, 0, movedPin)
      const newState = { ...state, pinnedTabs: newPins }
      saveMetadataToLocalStorage(newState)
      return { pinnedTabs: newPins }
    })
  },

  togglePinnedTabVisibility: (id) => {
    set((state) => {
      const pinnedTabs = state.pinnedTabs.map(p =>
        p.id === id ? { ...p, isHidden: !p.isHidden } : p
      )
      const newState = { ...state, pinnedTabs }
      saveMetadataToLocalStorage(newState)
      return { pinnedTabs }
    })
  },

  togglePinnedTabsVisibilityBulk: (ids, isHidden) => {
    set((state) => {
      const idSet = new Set(ids)
      const pinnedTabs = state.pinnedTabs.map(p =>
        idSet.has(p.id) ? { ...p, isHidden } : p
      )
      const newState = { ...state, pinnedTabs }
      saveMetadataToLocalStorage(newState)
      return { pinnedTabs }
    })
  },

  movePinnedTabCategory: (category, direction) => {
    set((state) => {
      const categories = Array.from(new Set(state.pinnedTabs.map(p => p.category || 'General'))).sort()
      let order = state.pinnedCategoryOrder.length > 0 ? [...state.pinnedCategoryOrder] : [...categories]
      
      categories.forEach(c => {
        if (!order.includes(c)) order.push(c)
      })
      
      const index = order.indexOf(category)
      if (index === -1) return {}

      const newOrder = [...order]
      if (direction === 'up' && index > 0) {
        [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
      } else if (direction === 'down' && index < newOrder.length - 1) {
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
      }

      const newState = { ...state, pinnedCategoryOrder: newOrder }
      saveMetadataToLocalStorage(newState)
      return { pinnedCategoryOrder: newOrder }
    })
  },

  togglePinnedCategoryCollapse: (category) => {
    set((state) => {
      const current = new Set(state.pinnedCollapsedCategories)
      if (current.has(category)) {
        current.delete(category)
      } else {
        current.add(category)
      }
      const newCollapsed = Array.from(current)
      const newState = { ...state, pinnedCollapsedCategories: newCollapsed }
      saveMetadataToLocalStorage(newState)
      return { pinnedCollapsedCategories: newCollapsed }
    })
  }
}))