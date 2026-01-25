import { useTabStore } from '../store/tabStore'

export function useViewCommands() {
  const { viewSettings, setViewSettings } = useTabStore()

  const toggleStatusBar = () => {
    setViewSettings({ showStatusBar: !viewSettings.showStatusBar })
  }

  const toggleLineNumbers = () => {
    setViewSettings({ showLineNumbers: !viewSettings.showLineNumbers })
  }

  const toggleBreadcrumb = () => {
    setViewSettings({ showBreadcrumb: !viewSettings.showBreadcrumb })
  }

  const toggleActivityBar = () => {
    setViewSettings({ showActivityBar: !viewSettings.showActivityBar })
  }

  const FONT_SIZE_PRESETS = [12, 14, 16, 18, 20, 22, 24]

  const zoomIn = () => {
    const currentIndex = FONT_SIZE_PRESETS.indexOf(viewSettings.fontSize)
    if (currentIndex < FONT_SIZE_PRESETS.length - 1) {
      setViewSettings({ fontSize: FONT_SIZE_PRESETS[currentIndex + 1] })
    } else if (currentIndex === -1) {
      // If current size is not in presets, find next larger preset
      const nextSize = FONT_SIZE_PRESETS.find(size => size > viewSettings.fontSize)
      if (nextSize) {
        setViewSettings({ fontSize: nextSize })
      }
    }
  }

  const zoomOut = () => {
    const currentIndex = FONT_SIZE_PRESETS.indexOf(viewSettings.fontSize)
    if (currentIndex > 0) {
      setViewSettings({ fontSize: FONT_SIZE_PRESETS[currentIndex - 1] })
    } else if (currentIndex === -1) {
      // If current size is not in presets, find next smaller preset
      const prevSize = [...FONT_SIZE_PRESETS].reverse().find(size => size < viewSettings.fontSize)
      if (prevSize) {
        setViewSettings({ fontSize: prevSize })
      }
    }
  }

  const resetZoom = () => {
    setViewSettings({ fontSize: 14 })
  }

  const toggleBracketMatching = () => {
    setViewSettings({ enableBracketMatching: !viewSettings.enableBracketMatching })
  }

  const toggleFoldGutter = () => {
    setViewSettings({ enableFoldGutter: !viewSettings.enableFoldGutter })
  }

  const toggleAutoIndent = () => {
    setViewSettings({ enableAutoIndent: !viewSettings.enableAutoIndent })
  }

  const toggleCodeBlockMarkers = () => {
    setViewSettings({ showCodeBlockMarkers: !viewSettings.showCodeBlockMarkers })
  }

  return {
    toggleStatusBar,
    toggleLineNumbers,
    toggleBreadcrumb,
    toggleActivityBar,
    toggleCodeBlockMarkers,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleBracketMatching,
    toggleFoldGutter,
    toggleAutoIndent,
  }
}
