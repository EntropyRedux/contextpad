// ContextPad theme bootstrap.
// Applies persisted theme/accent before first render to avoid a flash of
// wrong theme. Intentionally an external file (served from public/) so the
// shell CSP can enforce `script-src 'self'` without 'unsafe-inline'.
try {
  var s = localStorage.getItem('contextpad-settings')
  var tabsMeta = localStorage.getItem('contextpad-tabs-v2') || localStorage.getItem('contextpad-tabs')
  if (s) {
    var p = JSON.parse(s)
    var a = p && p.state && p.state.appearance
    if (a) {
      if (a.appTheme) document.documentElement.setAttribute('data-theme', a.appTheme)
      if (a.accentColor) document.documentElement.setAttribute('data-accent', a.accentColor)

      if (a.applyEditorFontAppWide && tabsMeta) {
        var parsedTabs = JSON.parse(tabsMeta)
        var selectedFont = parsedTabs && parsedTabs.viewSettings && parsedTabs.viewSettings.fontFamily
        if (selectedFont) {
          var fontStack
          if (selectedFont === 'Inter') {
            fontStack = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif"
          } else if (selectedFont === 'Roboto') {
            fontStack = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif"
          } else if (selectedFont === 'Serif') {
            fontStack = "Georgia, 'Times New Roman', Times, serif"
          } else {
            fontStack = "'" + selectedFont + "', 'Courier New', monospace"
          }
          document.documentElement.style.setProperty('--app-font-family', fontStack)
        }
      }
    }
  }
} catch (e) {}
// Defaults if nothing persisted
if (!document.documentElement.hasAttribute('data-theme'))
  document.documentElement.setAttribute('data-theme', 'charcoal')
if (!document.documentElement.hasAttribute('data-accent'))
  document.documentElement.setAttribute('data-accent', 'sapphire')