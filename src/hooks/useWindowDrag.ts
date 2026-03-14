import { getCurrentWindow } from '@tauri-apps/api/window'

/**
 * Start dragging the window programmatically.
 * Call this on mousedown of elements that should drag the window.
 */
export async function startWindowDrag() {
  try {
    await getCurrentWindow().startDragging()
  } catch (error) {
    console.error('Failed to start window drag:', error)
  }
}

/**
 * Returns a mousedown handler for window dragging.
 * Use this on elements that should be drag regions.
 */
export function useWindowDrag() {
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left mouse button
    if (e.button !== 0) return

    // Don't drag if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a')
    ) {
      return
    }

    startWindowDrag()
  }

  return { handleMouseDown, startWindowDrag }
}
