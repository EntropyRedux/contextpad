import { useTabStore } from '../../store/tabStore'
import { Editor } from './Editor'
import styles from './Editor.module.css'

export function EditorContainer() {
  const { tabs, activeTabId, updateTab } = useTabStore()
  const activeTab = tabs.find(t => t.id === activeTabId)

  if (!activeTab) {
    return (
      <div className={styles.emptyState}>
        <p>No file open. Create a new tab to get started.</p>
      </div>
    )
  }

  // SIMPLIFIED: Only render active tab, remount on switch
  // Content is preserved in Zustand store, so switching back restores state
  // Trade-off: Lose undo history per tab, but rendering is reliable
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
      <Editor
        key={activeTab.id}
        tabId={activeTab.id}
        initialContent={activeTab.content}
        onChange={(content: string) => {
          updateTab(activeTab.id, {
            content,
            isDirty: true,
            lastModifiedTime: Date.now()
          })
        }}
      />
    </div>
  )
}
