import { useEffect, useRef, useState } from 'react'
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightActiveLine, keymap, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { EditorState, RangeSetBuilder, Compartment } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { bracketMatching, foldGutter, indentOnInput } from '@codemirror/language'
import { search, highlightSelectionMatches } from '@codemirror/search'
import { useTabStore } from '../../store/tabStore'
import { getLanguageExtension } from '../../utils/languageExtensions'
import { getThemeExtension } from '../../themes/themeRegistry'
import { markdownHighlighting } from '../../themes/markdownHighlighting'
import { slashCommandsExtension, triggerCommandPalette } from '../../extensions/slashCommands'
import { actionButtonPlugin } from '../../extensions/actionButtons'
import { variablePlugin, tabNavigateVariables } from '../../extensions/templateVariables'
import { inlineFormulaExtension } from '../../extensions/inlineFormulas'
import { codeBlockParamsExtension } from '../../extensions/codeBlockParams'
import { lockedEditorExtension } from '../../extensions/lockedEditor'
import { autocompleteService } from '../../services/autocompleteService'
import { spellCheckService } from '../../services/spellCheckService'
import { codeLintService } from '../../services/codeLintService'
import { autocompleteTheme } from '../../themes/autocompleteTheme'
import { FloatingSearch } from './FloatingSearch'
import styles from './Editor.module.css'

interface EditorProps {
  tabId: string
  initialContent: string
  onChange: (content: string) => void
}

// Plugin to detect and underline <u> HTML tags - OPTIMIZED for large files
const underlinePlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>()

    for (const { from, to } of view.visibleRanges) {
      const text = view.state.doc.sliceString(from, to)
      const regex = /<u>(.*?)<\/u>/g
      let match

      while ((match = regex.exec(text)) !== null) {
        const matchFrom = from + match.index + 3
        const matchTo = from + match.index + match[0].length - 4

        if (matchFrom < matchTo) {
          builder.add(
            matchFrom,
            matchTo,
            Decoration.mark({
              attributes: { style: 'text-decoration: underline' }
            })
          )
        }
      }
    }

    return builder.finish()
  }
}, {
  decorations: v => v.decorations
})

const fontThemeCompartment = new Compartment()
const colorThemeCompartment = new Compartment()
const lineNumbersCompartment = new Compartment()
const wordWrapCompartment = new Compartment()
const languageCompartment = new Compartment()
const autocompleteCompartment = new Compartment()
const spellCheckCompartment = new Compartment()
const codeLintCompartment = new Compartment()
const markersCompartment = new Compartment()

export function Editor({ tabId, initialContent, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const timerRef = useRef<number | null>(null)
  const setCursorInfo = useTabStore(state => state.setCursorInfo)
  const updateTab = useTabStore(state => state.updateTab)
  const viewSettings = useTabStore(state => state.viewSettings)
  const tabs = useTabStore(state => state.tabs)
  const currentTab = tabs.find(t => t.id === tabId)

  const [showSearch, setShowSearch] = useState(false)
  const [searchMode, setSearchMode] = useState<'find' | 'replace'>('find')

  useEffect(() => {
    if (!editorRef.current) return

    const language = currentTab?.language || 'markdown'
    const mode = viewSettings.parserMode || 'auto'
    const lineCount = initialContent.split('\n').length

    let isLargeFile = false
    if (mode === 'ast') isLargeFile = false
    else if (mode === 'plain') isLargeFile = true
    else isLargeFile = initialContent.length > 100000 || lineCount > viewSettings.largeFileThreshold

    const extensions = [
      ...(isLargeFile ? [] : [underlinePlugin]),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      search({ top: true }), // Search extension - needed for FloatingSearch to work properly
      highlightSelectionMatches(), // Highlights all matches when searching
      ...(viewSettings.enableFoldGutter && !isLargeFile ? [foldGutter()] : []),
      ...(viewSettings.enableAutoIndent ? [indentOnInput()] : []),
      ...(viewSettings.enableBracketMatching && !isLargeFile ? [bracketMatching()] : []),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      colorThemeCompartment.of(getThemeExtension(viewSettings.theme)),
      languageCompartment.of(isLargeFile ? [] : getLanguageExtension(language)),
      ...(language === 'markdown' && !isLargeFile && viewSettings.enableMarkdownRendering ? [markdownHighlighting] : []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const content = update.state.doc.toString()
          if (timerRef.current) window.clearTimeout(timerRef.current)
          timerRef.current = window.setTimeout(() => onChange(content), 150)
        }
        if (update.selectionSet && !update.docChanged) {
          const pos = update.state.selection.main.head
          const line = update.state.doc.lineAt(pos)
          setCursorInfo({ line: line.number, column: pos - line.from + 1 })
        }
      }),
      fontThemeCompartment.of(EditorView.theme({
        "&": {
          fontSize: `${viewSettings.fontSize}px`,
          fontFamily: `'${viewSettings.fontFamily}', 'Courier New', monospace`
        },
        ".cm-content, .cm-gutters, .cm-line": {
          fontSize: `${viewSettings.fontSize}px`,
          fontFamily: `'${viewSettings.fontFamily}', 'Courier New', monospace`
        }
      })),
      lineNumbersCompartment.of(viewSettings.showLineNumbers ? lineNumbers() : []),
      wordWrapCompartment.of(viewSettings.wordWrap ? EditorView.lineWrapping : []),
      autocompleteCompartment.of(
        autocompleteService.createExtension(
          viewSettings.enableAutocomplete
            ? viewSettings.autocompleteConfig
            : { ...viewSettings.autocompleteConfig, activateOnTyping: false },
          viewSettings.indexingScope
        )
      ),
      autocompleteTheme,
      spellCheckCompartment.of(
        viewSettings.enableSpellCheck
          ? (viewSettings.spellCheckMode === 'browser'
              ? spellCheckService.createBrowserSpellCheckExtension()
              : spellCheckService.createExtension(viewSettings.spellCheckConfig, viewSettings.indexingScope))
          : []
      ),
      codeLintCompartment.of(
        viewSettings.enableCodeLinting
          ? codeLintService.createExtension(viewSettings.codeLintConfig, viewSettings.indexingScope)
          : []
      ),
      markersCompartment.of(codeBlockParamsExtension(viewSettings.showCodeBlockMarkers)),
      slashCommandsExtension(),
      actionButtonPlugin,
      lockedEditorExtension(),
      variablePlugin,
      tabNavigateVariables,
      ...inlineFormulaExtension,
      EditorView.domEventHandlers({
        contextmenu: (event, view) => {
          if (event.ctrlKey) {
            event.preventDefault()
            triggerCommandPalette(view)
            return true
          }
        }
      })
    ]

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

  // Update theme when setting changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: colorThemeCompartment.reconfigure(getThemeExtension(viewSettings.theme))
      })
    }
  }, [viewSettings.theme])

  // Update font family and size when settings change
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: fontThemeCompartment.reconfigure(
          EditorView.theme({
            "&": {
              fontSize: `${viewSettings.fontSize}px`,
              fontFamily: `'${viewSettings.fontFamily}', 'Courier New', monospace`
            },
            ".cm-content, .cm-gutters, .cm-line": {
              fontSize: `${viewSettings.fontSize}px`,
              fontFamily: `'${viewSettings.fontFamily}', 'Courier New', monospace`
            }
          })
        )
      })
    }
  }, [viewSettings.fontSize, viewSettings.fontFamily])

  // Update word wrap when setting changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: wordWrapCompartment.reconfigure(
          viewSettings.wordWrap ? EditorView.lineWrapping : []
        )
      })
    }
  }, [viewSettings.wordWrap])

  // Update line numbers when setting changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: lineNumbersCompartment.reconfigure(
          viewSettings.showLineNumbers ? lineNumbers() : []
        )
      })
    }
  }, [viewSettings.showLineNumbers])

  // Update autocomplete when settings change
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: autocompleteCompartment.reconfigure(
          autocompleteService.createExtension(
            viewSettings.enableAutocomplete
              ? viewSettings.autocompleteConfig
              : { ...viewSettings.autocompleteConfig, activateOnTyping: false },
            viewSettings.indexingScope
          )
        )
      })
    }
  }, [viewSettings.enableAutocomplete, viewSettings.autocompleteConfig, viewSettings.indexingScope])

  // Update spell check when settings change
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: spellCheckCompartment.reconfigure(
          viewSettings.enableSpellCheck
            ? (viewSettings.spellCheckMode === 'browser'
                ? spellCheckService.createBrowserSpellCheckExtension()
                : spellCheckService.createExtension(viewSettings.spellCheckConfig, viewSettings.indexingScope))
            : []
        )
      })
    }
  }, [viewSettings.enableSpellCheck, viewSettings.spellCheckMode, viewSettings.spellCheckConfig, viewSettings.indexingScope])

  // Update code linting when settings change
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: codeLintCompartment.reconfigure(
          viewSettings.enableCodeLinting
            ? codeLintService.createExtension(viewSettings.codeLintConfig, viewSettings.indexingScope)
            : []
        )
      })
    }
  }, [viewSettings.enableCodeLinting, viewSettings.codeLintConfig, viewSettings.indexingScope])

  // Update code block markers when settings change
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: markersCompartment.reconfigure(codeBlockParamsExtension(viewSettings.showCodeBlockMarkers))
      })
    }
  }, [viewSettings.showCodeBlockMarkers])

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
