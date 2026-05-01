import { useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { WebviewWindow, getAllWebviewWindows } from '@tauri-apps/api/webviewWindow'
import { renderMarkdown } from '../utils/markdownRenderer'
import { generateHTML, generateTOC } from '../utils/htmlGenerator'
import { useTabStore } from '../store/tabStore'
import { useNotificationStore } from '../store/notificationStore'

export function usePreviewSync() {
  const settings = useTabStore(state => state.viewSettings)
  const showLivePreview = settings.showLivePreview
  // Use proper selector pattern instead of calling getActiveTab() which uses get() internally
  const activeTab = useTabStore(state => {
    const { tabs, activeTabId } = state
    return tabs.find(t => t.id === activeTabId) || null
  })
  const addNotification = useNotificationStore(state => state.addNotification)
  const isServerRunning = useRef(false)
  const previewWindowRef = useRef<WebviewWindow | null>(null)
  const toggleDebounceRef = useRef<number | null>(null)

  // Start/Stop Server and Webview Window
  useEffect(() => {
    let mounted = true

    const manageServer = async () => {
      // Debounce rapid toggles
      if (toggleDebounceRef.current) {
        clearTimeout(toggleDebounceRef.current)
      }

      toggleDebounceRef.current = window.setTimeout(async () => {
        if (showLivePreview) {
          if (!isServerRunning.current) {
            try {
              const port = await invoke<number>('start_preview_server')
              if (!mounted) return

              isServerRunning.current = true

              // Initial content sync
              if (activeTab) {
                const contentHtml = await renderMarkdown(activeTab.content)
                const tocHtml = settings.previewShowTOC ? generateTOC(activeTab.content) : ''

                const resolvedTheme = settings.previewTheme === 'match'
                  ? (settings.theme.includes('light') ? 'light' : 'dark')
                  : settings.previewTheme as 'light' | 'dark'

                const fullHtml = generateHTML(contentHtml, activeTab.title, settings, tocHtml, resolvedTheme)
                await invoke('update_preview_content', { html: fullHtml })
              }

              // Check for existing preview window and close it
              try {
                const existingWindows = await getAllWebviewWindows()
                const existingPreview = existingWindows.find(w => w.label === 'preview')
                if (existingPreview) {
                  await existingPreview.close()
                }
              } catch {
                // Ignore errors when checking existing windows
              }

              // Create integrated webview window
              try {
                const webview = new WebviewWindow('preview', {
                  url: `http://localhost:${port}`,
                  title: 'ContextPad Live Preview',
                  width: 900,
                  height: 700,
                  decorations: true,
                  center: true
                })
                previewWindowRef.current = webview

                // Listen for window close to sync state
                webview.once('tauri://close-requested', () => {
                  previewWindowRef.current = null
                  useTabStore.getState().setViewSettings({ showLivePreview: false })
                })

                // Listen for window errors
                webview.once('tauri://error', (e) => {
                  console.error('Preview window error:', e)
                  previewWindowRef.current = null
                })

                addNotification({ type: 'success', message: 'Preview started' })
              } catch (winError) {
                console.error('Failed to create preview window:', winError)
                addNotification({ type: 'info', message: 'Opening in external browser...' })
                
                // Fallback to external browser - open_file_explorer works for URLs on Windows
                await invoke('open_file_explorer', { path: `http://localhost:${port}` }).catch(err => {
                   console.error('External browser fallback failed:', err)
                   addNotification({ type: 'error', message: 'Failed to open preview' })
                })

                // Still sync state but don't stop server
                isServerRunning.current = true
              }
            } catch (error) {
              console.error('Preview start error:', error)
              if (mounted) {
                addNotification({ type: 'error', message: `Failed to start preview: ${error}` })
                useTabStore.getState().setViewSettings({ showLivePreview: false })
              }
            }
          }
        } else {
          // Stop preview
          if (isServerRunning.current || previewWindowRef.current) {
            try {
              if (previewWindowRef.current) {
                await previewWindowRef.current.close().catch(() => {})
                previewWindowRef.current = null
              }
              await invoke('stop_preview_server')
              addNotification({ type: 'info', message: 'Preview stopped' })
            } catch (error) {
              console.error('Preview stop error:', error)
            } finally {
              if (mounted) {
                isServerRunning.current = false
              }
            }
          }
        }
      }, 100) // 100ms debounce
    }

    manageServer()

    // Cleanup on unmount
    return () => {
      mounted = false
      if (toggleDebounceRef.current) {
        clearTimeout(toggleDebounceRef.current)
      }
      // Close window and stop server on unmount
      if (previewWindowRef.current) {
        previewWindowRef.current.close().catch(() => {})
        previewWindowRef.current = null
      }
      if (isServerRunning.current) {
        invoke('stop_preview_server').catch(() => {})
        isServerRunning.current = false
      }
    }
  }, [showLivePreview])

  // Sync Content on document changes
  useEffect(() => {
    let timeout: number | null = null;

    const syncContent = async () => {
      if (showLivePreview && activeTab && isServerRunning.current) {
        try {
          const contentHtml = await renderMarkdown(activeTab.content)
          const tocHtml = settings.previewShowTOC ? generateTOC(activeTab.content) : ''

          const resolvedTheme = settings.previewTheme === 'match'
            ? (settings.theme.includes('light') ? 'light' : 'dark')
            : settings.previewTheme as 'light' | 'dark'

          const fullHtml = generateHTML(contentHtml, activeTab.title, settings, tocHtml, resolvedTheme)

          await invoke('update_preview_content', { html: fullHtml })
        } catch (e) {
          console.error('Sync error', e)
        }
      }
    }

    if (showLivePreview) {
      timeout = window.setTimeout(syncContent, 150);
    }

    return () => {
      if (timeout) window.clearTimeout(timeout);
    }
  }, [
    showLivePreview,
    activeTab?.content,
    activeTab?.id,
    activeTab?.title,
    settings.previewTheme,
    settings.previewShowTOC,
    settings.theme
  ]);

  // Sync Settings in real-time (Fast path)
  useEffect(() => {
    if (showLivePreview && previewWindowRef.current) {
      const settingsData = {
        previewFontScale: settings.previewFontScale,
        previewMaxWidth: settings.previewMaxWidth,
        previewContentMargin: settings.previewContentMargin,
        previewCustomCSS: settings.previewCustomCSS
      };
      const sJson = JSON.stringify(settingsData);
      
      // Use eval for instant cross-window sync
      (previewWindowRef.current as any).eval(`window.updatePreviewSettings(${sJson})`)
        .catch((err: any) => console.warn('Real-time sync failed:', err));
    }
  }, [
    settings.previewFontScale,
    settings.previewMaxWidth,
    settings.previewContentMargin,
    settings.previewCustomCSS,
    showLivePreview // Ensure it syncs when window opens
  ])
}
