/**
 * CodeMirror Extension for Inline Formulas
 *
 * Detects {=FORMULA()} syntax in the editor and provides:
 * - Syntax highlighting
 * - Run button widget
 * - Ctrl+Enter execution
 * - Preview on hover
 */

import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
  keymap
} from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import {
  executeFormula,
  validateFormula,
  previewFormula,
  setEditorContext,
  type EditorContext
} from '../services/formulaParser'
import { useNotificationStore } from '../store/notificationStore'

// Regex to match inline formulas: {=FORMULA()}
const FORMULA_REGEX = /\{=([^}]+)\}/g

/**
 * Widget that renders a small run button next to formulas
 */
class FormulaRunWidget extends WidgetType {
  constructor(
    readonly formula: string,
    readonly from: number,
    readonly to: number
  ) {
    super()
  }

  toDOM(view: EditorView): HTMLElement {
    const button = document.createElement('button')
    button.className = 'cm-formula-run-btn'
    button.textContent = '▶'
    button.title = 'Execute formula (Ctrl+Enter)'

    button.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      executeFormulaAtPosition(view, this.from, this.to, this.formula)
    })

    return button
  }

  ignoreEvent() {
    return false
  }
}

/**
 * Execute a formula and replace it with the result
 */
function executeFormulaAtPosition(
  view: EditorView,
  from: number,
  to: number,
  formula: string
) {
  const addNotification = useNotificationStore.getState().addNotification

  // Get current selection (if any) for formulas that use it
  const selection = view.state.sliceDoc(
    view.state.selection.main.from,
    view.state.selection.main.to
  )

  // Set up editor context for position-based functions
  const pos = view.state.selection.main.head
  const line = view.state.doc.lineAt(pos)
  const doc = view.state.doc

  const context: EditorContext = {
    line: line.number,
    column: pos - line.from + 1,
    lineCount: doc.lines,
    charCount: doc.length,
    wordCount: doc.toString().split(/\s+/).filter(w => w.length > 0).length,
    getLine: (n: number) => {
      if (n < 1 || n > doc.lines) return ''
      return doc.line(n).text
    },
    getRange: (fromLine: number, toLine: number) => {
      const start = Math.max(1, Math.min(fromLine, doc.lines))
      const end = Math.max(start, Math.min(toLine, doc.lines))
      const lines: string[] = []
      for (let i = start; i <= end; i++) {
        lines.push(doc.line(i).text)
      }
      return lines.join('\n')
    }
  }

  setEditorContext(context)

  // Execute the formula
  const result = executeFormula(formula, selection)

  // Clear context
  setEditorContext(null)

  if (result.success) {
    // Replace the formula with the result
    view.dispatch({
      changes: { from, to, insert: result.value || '' },
      selection: { anchor: from + (result.value?.length || 0) }
    })

    addNotification({
      type: 'success',
      message: 'Formula executed',
      details: formula
    })
  } else {
    addNotification({
      type: 'error',
      message: 'Formula error',
      details: result.error || 'Unknown error'
    })
  }
}

/**
 * Find the formula at or around the cursor position
 */
function findFormulaAtCursor(view: EditorView): { from: number; to: number; formula: string } | null {
  const pos = view.state.selection.main.head
  const line = view.state.doc.lineAt(pos)
  const lineText = line.text
  const lineStart = line.from

  // Find all formulas in the current line
  const regex = /\{=([^}]+)\}/g
  let match

  while ((match = regex.exec(lineText)) !== null) {
    const formulaStart = lineStart + match.index
    const formulaEnd = formulaStart + match[0].length

    // Check if cursor is inside this formula
    if (pos >= formulaStart && pos <= formulaEnd) {
      return {
        from: formulaStart,
        to: formulaEnd,
        formula: match[1]
      }
    }
  }

  return null
}

/**
 * Keymap for Ctrl+Enter to execute formula at cursor
 */
export const formulaKeymap = keymap.of([
  {
    key: 'Ctrl-Enter',
    run: (view) => {
      const formula = findFormulaAtCursor(view)
      if (formula) {
        executeFormulaAtPosition(view, formula.from, formula.to, formula.formula)
        return true
      }
      return false
    }
  }
])

/**
 * Decoration for formula highlighting
 */
const formulaDecoration = Decoration.mark({
  class: 'cm-inline-formula'
})

const formulaErrorDecoration = Decoration.mark({
  class: 'cm-inline-formula cm-formula-error'
})

/**
 * ViewPlugin that detects and decorates inline formulas
 */
export const inlineFormulaPlugin = ViewPlugin.fromClass(
  class {
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
        const regex = /\{=([^}]+)\}/g
        let match

        while ((match = regex.exec(text)) !== null) {
          const matchFrom = from + match.index
          const matchTo = from + match.index + match[0].length
          const formula = match[1]

          // Validate the formula
          const validation = validateFormula(formula)

          // Add mark decoration for the formula text
          if (validation.valid) {
            builder.add(matchFrom, matchTo, formulaDecoration)
          } else {
            builder.add(matchFrom, matchTo, formulaErrorDecoration)
          }

          // Add widget decoration for the run button (at the end of formula)
          const widget = Decoration.widget({
            widget: new FormulaRunWidget(formula, matchFrom, matchTo),
            side: 1 // After the formula
          })
          builder.add(matchTo, matchTo, widget)
        }
      }

      return builder.finish()
    }
  },
  {
    decorations: (v) => v.decorations
  }
)

/**
 * Execute all formulas in the document
 */
export function executeAllFormulas(view: EditorView): { executed: number; errors: number } {
  const addNotification = useNotificationStore.getState().addNotification
  const doc = view.state.doc
  const text = doc.toString()

  // Set up editor context
  const pos = view.state.selection.main.head
  const line = view.state.doc.lineAt(pos)

  const context: EditorContext = {
    line: line.number,
    column: pos - line.from + 1,
    lineCount: doc.lines,
    charCount: doc.length,
    wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
    getLine: (n: number) => {
      if (n < 1 || n > doc.lines) return ''
      return doc.line(n).text
    },
    getRange: (fromLine: number, toLine: number) => {
      const start = Math.max(1, Math.min(fromLine, doc.lines))
      const end = Math.max(start, Math.min(toLine, doc.lines))
      const lines: string[] = []
      for (let i = start; i <= end; i++) {
        lines.push(doc.line(i).text)
      }
      return lines.join('\n')
    }
  }

  setEditorContext(context)

  // Find all formulas
  const regex = /\{=([^}]+)\}/g
  const matches: { from: number; to: number; formula: string }[] = []
  let match

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      from: match.index,
      to: match.index + match[0].length,
      formula: match[1]
    })
  }

  if (matches.length === 0) {
    setEditorContext(null)
    addNotification({
      type: 'info',
      message: 'No formulas found',
      details: 'No {=FORMULA()} syntax found in document'
    })
    return { executed: 0, errors: 0 }
  }

  // Get selection for formulas that use it
  const selection = view.state.sliceDoc(
    view.state.selection.main.from,
    view.state.selection.main.to
  )

  // Process in reverse order to maintain positions
  const changes: { from: number; to: number; insert: string }[] = []
  let executed = 0
  let errors = 0

  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i]
    const result = executeFormula(m.formula, selection)

    if (result.success) {
      changes.push({ from: m.from, to: m.to, insert: result.value || '' })
      executed++
    } else {
      errors++
    }
  }

  setEditorContext(null)

  if (changes.length > 0) {
    view.dispatch({ changes })
  }

  addNotification({
    type: errors > 0 ? 'warning' : 'success',
    message: `Executed ${executed} formula${executed !== 1 ? 's' : ''}`,
    details: errors > 0 ? `${errors} error${errors !== 1 ? 's' : ''} occurred` : undefined
  })

  return { executed, errors }
}

/**
 * Combined extension for inline formulas
 */
export const inlineFormulaExtension = [
  inlineFormulaPlugin,
  formulaKeymap
]
