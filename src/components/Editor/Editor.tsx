import { useEffect, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { useTabStore } from '../../store/tabStore'
import { useSettingsStore } from '../../store/settingsStore'
import { buildEditorExtensions, useEditorReconfigure } from '../../hooks/useEditorExtensions'
import { FloatingSearch } from './FloatingSearch'
import styles from './Editor.module.css'

interface EditorProps {
  tabId: string
  initialContent: string
  onChange: (content: string) => void
}

export function Editor({ tabId, initialContent, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const timerRef = useRef<number | null>(null)
  const setCursorInfo = useTabStore(state => state.setCursorInfo)
  const updateTab = useTabStore(state => state.updateTab)
  const viewSettings = useTabStore(state => state.viewSettings)
  const accentOverridesHeadings = useSettingsStore(state => state.appearance.accentOverridesHeadings)
  const tabs = useTabStore(state => state.tabs)
  const currentTab = tabs.find(t => t.id === tabId)

  const [showSearch, setShowSearch] = useState(false)
  const [searchMode, setSearchMode] = useState<'find' | 'replace'>('find')

  // Reconfigure extensions when settings change
  useEditorReconfigure(viewRef, viewSettings, accentOverridesHeadings)

  // Create editor on mount
  useEffect(() => {
    if (!editorRef.current) return

    const language = currentTab?.language || 'markdown'
    const mode = viewSettings.parserMode || 'auto'
    const lineCount = initialContent.split('\n').length

    let isLargeFile = false
    if (mode === 'ast') isLargeFile = false
    else if (mode === 'plain') isLargeFile = true
    else isLargeFile = initialContent.length > 100000 || lineCount > viewSettings.largeFileThreshold

    const extensions = buildEditorExtensions({
      viewSettings,
      language,
      isLargeFile,
      accentOverridesHeadings,
      onChange,
      setCursorInfo,
      timerRef
    })

    const view = new EditorView({
      state: EditorState.create({
        doc: initialContent,
        extensions,
      }),
      parent: editorRef.current,
    })

    viewRef.current = view
    updateTab(tabId, { editorView: view })

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      onChange(view.state.doc.toString())
      view.destroy()
      setCursorInfo(null)
      updateTab(tabId, { editorView: undefined })
    }
  }, [tabId, viewSettings.parserMode, viewSettings.largeFileThreshold])

  // Listen for global search events
  useEffect(() => {
    const handleOpenSearch = (e: CustomEvent<{ mode: 'find' | 'replace' }>) => {
      setSearchMode(e.detail.mode)
      setShowSearch(true)
    }
    window.addEventListener('open-search', handleOpenSearch as EventListener)
    return () => window.removeEventListener('open-search', handleOpenSearch as EventListener)
  }, [])

  return (
    <div className={styles.editorContainer}>
      <div ref={editorRef} className={styles.editor}></div>
      {showSearch && viewRef.current && (
        <FloatingSearch
          view={viewRef.current}
          mode={searchMode}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  )
}
