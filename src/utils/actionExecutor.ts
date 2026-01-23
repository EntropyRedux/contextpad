/**
 * Action executor for safely running user-defined JavaScript or Formulas
 * Based on monolithic implementation (lines 3173-3184)
 */

import { validateActionCode } from './codeValidator'
import { processTemplateVariables } from './templateVariables'
import { executeFormula, validateFormula, setEditorContext, type EditorContext } from '../services/formulaParser'
import type { EditorView } from '@codemirror/view'

export interface ExecutionResult {
  success: boolean
  error?: string
}

/**
 * Execute action code in a sandboxed environment
 * Supports both JavaScript and Formula (FORMULA: prefix)
 * Provides access to editor helpers - no window, document, or file system
 */
export function executeAction(
  code: string,
  editorView: EditorView
): ExecutionResult {
  try {
    // Check if this is a formula (has FORMULA: prefix)
    if (code.startsWith('FORMULA:')) {
      return executeFormulaAction(code.slice(8), editorView)
    }

    // JavaScript execution
    // Validate code before execution
    const validation = validateActionCode(code)
    if (!validation.valid) {
      throw new Error(`Code validation failed: ${validation.errors.join(', ')}`)
    }

    // Create helper functions for common operations
    const helpers = getEditorHelpers(editorView)

    // Create sandboxed function with editor helpers
    // Security note: Code validation happens in validateActionCode()
    const fn = new Function('editor', 'helpers', code)

    // Execute with helpers object for easier API
    fn(editorView, helpers)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

/**
 * Execute a formula-based action
 */
function executeFormulaAction(
  formula: string,
  editorView: EditorView
): ExecutionResult {
  try {
    // Validate formula
    const validation = validateFormula(formula)
    if (!validation.valid) {
      throw new Error(`Formula validation failed: ${validation.error}`)
    }

    // Get current selection
    const selection = editorView.state.selection.main
    const selectedText = editorView.state.doc.sliceString(selection.from, selection.to)

    // Set up editor context for position-based functions
    const pos = selection.head
    const line = editorView.state.doc.lineAt(pos)
    const doc = editorView.state.doc

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
    const result = executeFormula(formula, selectedText)

    setEditorContext(null)

    if (!result.success) {
      throw new Error(result.error || 'Formula execution failed')
    }

    // Replace selection with result (or insert at cursor if no selection)
    if (selection.from !== selection.to) {
      // Has selection - replace it
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: result.value || '' },
        selection: { anchor: selection.from + (result.value?.length || 0) }
      })
    } else {
      // No selection - insert at cursor
      editorView.dispatch({
        changes: { from: pos, insert: result.value || '' },
        selection: { anchor: pos + (result.value?.length || 0) }
      })
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

/**
 * Get editor helper object for common operations
 * This provides a simpler API for action code
 */
export function getEditorHelpers(view: EditorView) {
  return {
    // Selection operations
    getSelection: () => {
      const selection = view.state.selection.main
      return view.state.doc.sliceString(selection.from, selection.to)
    },

    replaceSelection: (text: string) => {
      const selection = view.state.selection.main
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text }
      })
    },

    insertAtCursor: (text: string) => {
      const pos = view.state.selection.main.head
      view.dispatch({
        changes: { from: pos, insert: text },
        selection: { anchor: pos + text.length }
      })
    },

    // Document operations
    getAllText: () => {
      return view.state.doc.toString()
    },

    replaceAllText: (text: string) => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text }
      })
    },

    // Cursor operations
    getCursorPosition: () => {
      return view.state.selection.main.head
    },

    setCursorPosition: (pos: number) => {
      view.dispatch({
        selection: { anchor: pos }
      })
    },

    // Line operations
    getCurrentLine: () => {
      const pos = view.state.selection.main.head
      const line = view.state.doc.lineAt(pos)
      return line.text
    },

    getLineCount: () => {
      return view.state.doc.lines
    },

    // Template insertion with variable processing
    insertTemplate: (templateContent: string) => {
      const selection = view.state.selection.main
      const selectedText = view.state.doc.sliceString(selection.from, selection.to)
      const pos = view.state.selection.main.head

      // Process template variables
      const processed = processTemplateVariables(templateContent, selectedText)

      view.dispatch({
        changes: { from: pos, insert: processed.content },
        selection: {
          anchor: processed.cursorOffset !== null
            ? pos + processed.cursorOffset
            : pos + processed.content.length
        }
      })
    }
  }
}
