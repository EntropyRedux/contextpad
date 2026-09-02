import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useTabStore } from '../store/tabStore'

/**
 * Intercepts main-window close requests. If any tab has unsaved changes the
 * user is prompted before the window is actually closed. Content is flushed
 * on every close attempt so the latest edits are never lost to the debounce.
 */
export function useCloseGuard() {
  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setup = async () => {
      unlisten = await listen('app-close-requested', async () => {
        const { tabs } = useTabStore.getState()
        const dirtyTabs = tabs.filter(t => t.isDirty)

        if (dirtyTabs.length === 0) {
          await invoke('confirm_close')
          return
        }

        const names = dirtyTabs
          .slice(0, 3)
          .map(t => `"${t.title}"`)
          .join(', ')
        const more = dirtyTabs.length > 3 ? ` and ${dirtyTabs.length - 3} more` : ''
        const confirmed = confirm(
          `Close ContextPad? ${dirtyTabs.length} tab${dirtyTabs.length === 1 ? ' has' : 's have'} unsaved changes:\n${names}${more}`
        )

        if (confirmed) {
          await invoke('confirm_close')
        }
      })
    }

    setup()

    return () => {
      if (unlisten) unlisten()
    }
  }, [])
}