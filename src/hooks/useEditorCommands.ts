import { useTabStore } from '../store/tabStore'
import { undo as cmUndo, redo as cmRedo } from '@codemirror/commands'

export function useEditorCommands() {
  const getActiveTab = useTabStore(state => state.getActiveTab)

  const undo = () => {
    const activeTab = getActiveTab()
    if (activeTab?.editorView) {
      cmUndo(activeTab.editorView)
    }
  }

  const redo = () => {
    const activeTab = getActiveTab()
    if (activeTab?.editorView) {
      cmRedo(activeTab.editorView)
    }
  }

  const cut = () => {
    const activeTab = getActiveTab()
    if (activeTab?.editorView) {
      const view = activeTab.editorView
      const selection = view.state.selection.main
      if (!selection.empty) {
        const text = view.state.doc.sliceString(selection.from, selection.to)
        navigator.clipboard.writeText(text)
        view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: '' }
        })
      }
    }
  }

  const copy = () => {
    const activeTab = getActiveTab()
    if (activeTab?.editorView) {
      const view = activeTab.editorView
      const selection = view.state.selection.main
      if (!selection.empty) {
        const text = view.state.doc.sliceString(selection.from, selection.to)
        navigator.clipboard.writeText(text)
      }
    }
  }

  const paste = async () => {
    const activeTab = getActiveTab()
    if (activeTab?.editorView) {
      try {
        const text = await navigator.clipboard.readText()
        const view = activeTab.editorView
        const selection = view.state.selection.main
        view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: text }
        })
      } catch (err) {
        console.error('Failed to read clipboard:', err)
      }
    }
  }

  const selectAll = () => {
    const activeTab = getActiveTab()
    if (activeTab?.editorView) {
      const view = activeTab.editorView
      view.dispatch({
        selection: { anchor: 0, head: view.state.doc.length }
      })
    }
  }

  return {
    undo,
    redo,
    cut,
    copy,
    paste,
    selectAll,
  }
}
