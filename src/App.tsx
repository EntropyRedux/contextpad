import { useEffect, useState, useCallback } from 'react'
import { Layout } from './components/Layout/Layout'
import { TitleBar } from './components/TitleBar/TitleBar'
import { EditorContainer } from './components/Editor/EditorContainer'
import { MenuBar } from './components/MenuBar/MenuBar'
import { Breadcrumb } from './components/Breadcrumb/Breadcrumb'
import { StatusBar } from './components/StatusBar/StatusBar'
import { Sidebar } from './components/Sidebar/Sidebar'
import { LeftSidebar } from './components/LeftSidebar/LeftSidebar'
import { useTabStore } from './store/tabStore'
import { useSettingsStore } from './store/settingsStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCodeBlockDetection } from './hooks/useCodeBlockDetection'
import { useFileWatcher } from './hooks/useFileWatcher'
import { useFileDrop } from './hooks/useFileDrop'
import { useStartupFiles } from './hooks/useStartupFiles'
import { usePreviewSync } from './hooks/usePreviewSync'
import { GlobalErrorHandler } from './components/GlobalErrorHandler'
import styles from './App.module.css'

function getFontStack(fontFamily: string): string {
  switch (fontFamily) {
    case 'Inter':
      return "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif"
    case 'Roboto':
      return "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif"
    case 'Serif':
      return "Georgia, 'Times New Roman', Times, serif"
    default:
      return `'${fontFamily}', 'Courier New', monospace`
  }
}

export default function App() {
  const [isReady, setIsReady] = useState(false)
  const initializeFromStorage = useTabStore(state => state.initializeFromStorage)
  const isInitialized = useTabStore(state => state.isInitialized)
  const addTab = useTabStore(state => state.addTab)
  const tabs = useTabStore(state => state.tabs)
  const editorFontFamily = useTabStore(state => state.viewSettings.fontFamily)
  const showStatusBar = useTabStore(state => state.viewSettings.showStatusBar)
  const { appTheme, accentColor, applyEditorFontAppWide } = useSettingsStore(state => state.appearance)

  // Apply theme and accent to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme)
    document.documentElement.setAttribute('data-accent', accentColor)
  }, [appTheme, accentColor])

  // Optionally apply selected editor font app-wide
  useEffect(() => {
    if (applyEditorFontAppWide) {
      document.documentElement.style.setProperty('--app-font-family', getFontStack(editorFontFamily))
    } else {
      document.documentElement.style.removeProperty('--app-font-family')
    }
  }, [applyEditorFontAppWide, editorFontFamily])

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  // Enable code block parameter detection (detection only, no action)
  useCodeBlockDetection()

  // Enable file watchers for external changes
  useFileWatcher()

  // Enable drag-and-drop
  useFileDrop()

  // Initialize startup files handler (Open With...)
  useStartupFiles()

  // Enable HTML Live Preview sync
  usePreviewSync()

  // Initialize storage on mount
  useEffect(() => {
    const init = async () => {
      await initializeFromStorage()
      setIsReady(true)
    }
    init()
  }, [initializeFromStorage])

  // Add initial tab if no tabs exist after initialization
  const addInitialTab = useCallback(() => {
    if (isInitialized && tabs.length === 0) {
      addTab({ title: 'Untitled-1' })
    }
  }, [isInitialized, tabs.length, addTab])

  useEffect(() => {
    addInitialTab()
  }, [addInitialTab])

  return (
    <Layout>
      <GlobalErrorHandler />
      <TitleBar />
      <MenuBar />
      <Breadcrumb />
      {!isReady ? (
        <div className={styles.mainContent} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <div className={styles.loadingText}>Loading...</div>
          </div>
        </div>
      ) : (
        <div className={styles.mainContent}>
          <LeftSidebar />
          <EditorContainer />
          <Sidebar />
        </div>
      )}
      {showStatusBar && <StatusBar />}
    </Layout>
  )
}
