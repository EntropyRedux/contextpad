import { useEffect } from 'react'
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightActiveLine, keymap, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { EditorState, RangeSetBuilder, Compartment, Extension } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { bracketMatching, foldGutter, indentOnInput } from '@codemirror/language'
import { search, highlightSelectionMatches } from '@codemirror/search'
import { getLanguageExtension } from '../utils/languageExtensions'
import { getThemeExtension } from '../themes/themeRegistry'
import { createMarkdownHighlighting } from '../themes/markdownHighlighting'
import { slashCommandsExtension, triggerCommandPalette } from '../extensions/slashCommands'
import { actionButtonPlugin } from '../extensions/actionButtons'
import { variablePlugin, tabNavigateVariables } from '../extensions/templateVariables'
import { inlineFormulaExtension } from '../extensions/inlineFormulas'
import { codeBlockParamsExtension } from '../extensions/codeBlockParams'
import { lockedEditorExtension } from '../extensions/lockedEditor'
import { autocompleteService } from '../services/autocompleteService'
import { spellCheckService } from '../services/spellCheckService'
import { codeLintService } from '../services/codeLintService'
import { autocompleteTheme } from '../themes/autocompleteTheme'
import type { ViewSettings, CursorInfo } from '../store/tabStore'

// =============================================================================
// Module-level compartments (stable across renders)
// =============================================================================

const fontThemeCompartment = new Compartment()
const colorThemeCompartment = new Compartment()
const lineNumbersCompartment = new Compartment()
const wordWrapCompartment = new Compartment()
const languageCompartment = new Compartment()
const autocompleteCompartment = new Compartment()
const spellCheckCompartment = new Compartment()
const codeLintCompartment = new Compartment()
const markersCompartment = new Compartment()
const markdownHighlightingCompartment = new Compartment()

// =============================================================================
// Static plugins
// =============================================================================

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

// =============================================================================
// Extension builder
// =============================================================================

interface BuildExtensionsOpts {
  viewSettings: ViewSettings
  language: string
  isLargeFile: boolean
  accentOverridesHeadings: boolean
  onChange: (content: string) => void
  setCursorInfo: (info: CursorInfo | null) => void
  timerRef: React.MutableRefObject<number | null>
}

function getEditorFontStack(fontFamily: string): string {
  switch (fontFamily) {
    case 'Inter':
      return "'Inter', 'Segoe UI', Arial, sans-serif"
    case 'Roboto':
      return "'Roboto', 'Segoe UI', Arial, sans-serif"
    case 'Serif':
      return "Georgia, 'Times New Roman', Times, serif"
    default:
      return `'${fontFamily}', 'Courier New', monospace`
  }
}

export function buildEditorExtensions(opts: BuildExtensionsOpts): Extension[] {
  const { viewSettings, language, isLargeFile, accentOverridesHeadings, onChange, setCursorInfo, timerRef } = opts

  return [
    ...(isLargeFile ? [] : [underlinePlugin]),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    history(),
    search({ top: true }),
    highlightSelectionMatches(),
    ...(viewSettings.enableFoldGutter && !isLargeFile ? [foldGutter()] : []),
    ...(viewSettings.enableAutoIndent ? [indentOnInput()] : []),
    ...(viewSettings.enableBracketMatching && !isLargeFile ? [bracketMatching()] : []),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    colorThemeCompartment.of(getThemeExtension(viewSettings.theme)),
    languageCompartment.of(isLargeFile ? [] : getLanguageExtension(language)),
    markdownHighlightingCompartment.of(
      language === 'markdown' && !isLargeFile && viewSettings.enableMarkdownRendering
        ? createMarkdownHighlighting(accentOverridesHeadings)
        : []
    ),
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
        fontFamily: getEditorFontStack(viewSettings.fontFamily)
      },
      ".cm-content, .cm-gutters, .cm-line": {
        fontSize: `${viewSettings.fontSize}px`,
        fontFamily: getEditorFontStack(viewSettings.fontFamily)
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
}

// =============================================================================
// Reconfigure hook
// =============================================================================

export function useEditorReconfigure(
  viewRef: React.MutableRefObject<EditorView | null>,
  viewSettings: ViewSettings,
  accentOverridesHeadings: boolean = false
) {
  // Theme
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: colorThemeCompartment.reconfigure(getThemeExtension(viewSettings.theme))
      })
    }
  }, [viewSettings.theme])

  // Font family and size
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: fontThemeCompartment.reconfigure(
          EditorView.theme({
            "&": {
              fontSize: `${viewSettings.fontSize}px`,
              fontFamily: getEditorFontStack(viewSettings.fontFamily)
            },
            ".cm-content, .cm-gutters, .cm-line": {
              fontSize: `${viewSettings.fontSize}px`,
              fontFamily: getEditorFontStack(viewSettings.fontFamily)
            }
          })
        )
      })
    }
  }, [viewSettings.fontSize, viewSettings.fontFamily])

  // Word wrap
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: wordWrapCompartment.reconfigure(
          viewSettings.wordWrap ? EditorView.lineWrapping : []
        )
      })
    }
  }, [viewSettings.wordWrap])

  // Line numbers
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: lineNumbersCompartment.reconfigure(
          viewSettings.showLineNumbers ? lineNumbers() : []
        )
      })
    }
  }, [viewSettings.showLineNumbers])

  // Autocomplete
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

  // Spell check
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

  // Code linting
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

  // Code block markers
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: markersCompartment.reconfigure(codeBlockParamsExtension(viewSettings.showCodeBlockMarkers))
      })
    }
  }, [viewSettings.showCodeBlockMarkers])

  // Markdown heading accent override
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: markdownHighlightingCompartment.reconfigure(
          viewSettings.enableMarkdownRendering
            ? createMarkdownHighlighting(accentOverridesHeadings)
            : []
        )
      })
    }
  }, [accentOverridesHeadings, viewSettings.enableMarkdownRendering])
}
