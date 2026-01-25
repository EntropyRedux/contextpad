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
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCodeBlockDetection } from './hooks/useCodeBlockDetection'
import { useFileWatcher } from './hooks/useFileWatcher'
import { useFileDrop } from './hooks/useFileDrop'
import { useStartupFiles } from './hooks/useStartupFiles'
import { GlobalErrorHandler } from './components/GlobalErrorHandler'
import styles from './App.module.css'

export default function App() {
  const [isReady, setIsReady] = useState(false)
  const initializeFromStorage = useTabStore(state => state.initializeFromStorage)
  const isInitialized = useTabStore(state => state.isInitialized)
  const addTab = useTabStore(state => state.addTab)
  const tabs = useTabStore(state => state.tabs)
  const showStatusBar = useTabStore(state => state.viewSettings.showStatusBar)

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

  // Show loading state while initializing
  if (!isReady) {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>Loading...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <GlobalErrorHandler />
      <TitleBar />
      <MenuBar />
      <Breadcrumb />
      <div className={styles.mainContent}>
        <LeftSidebar />
        <EditorContainer />
        <Sidebar />
      </div>
      {showStatusBar && <StatusBar />}
    </Layout>
  )
}
