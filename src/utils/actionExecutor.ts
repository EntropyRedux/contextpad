/**
 * Action executor for safely running user-defined JavaScript or Formulas
 */

import { validateActionCode } from './codeValidator'
import { processTemplateVariables } from './templateVariables'
import { executeFormula, validateFormula, setEditorContext, type EditorContext } from '../services/formulaParser'
import type { EditorView } from '@codemirror/view'
import { detectCodeBlocks } from './codeBlockDetection'
import { getParamAsString } from './codeBlockParams'

export interface ExecutionResult {
  success: boolean
  error?: string
}

/**
 * Execute action code in a sandboxed environment
 */
export function executeAction(
  code: string,
  editorView: EditorView,
  actionId?: string // Optional ID of the action being executed
): ExecutionResult {
  try {
    if (code.startsWith('FORMULA:')) {
      return executeFormulaAction(code.slice(8), editorView)
    }

    const validation = validateActionCode(code)
    if (!validation.valid) {
      throw new Error(`Code validation failed: ${validation.errors.join(', ')}`)
    }

    const helpers = getEditorHelpers(editorView, actionId)
    const fn = new Function('editor', 'helpers', code)
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
    const validation = validateFormula(formula)
    if (!validation.valid) {
      throw new Error(`Formula validation failed: ${validation.error}`)
    }

    const selection = editorView.state.selection.main
    const selectedText = editorView.state.doc.sliceString(selection.from, selection.to)
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
    const result = executeFormula(formula, selectedText)
    setEditorContext(null)

    if (!result.success) {
      throw new Error(result.error || 'Formula execution failed')
    }

    if (selection.from !== selection.to) {
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: result.value || '' },
        selection: { anchor: selection.from + (result.value?.length || 0) }
      })
    } else {
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
 * Automatically filters out content from blocks that exclude this actionId
 */
export function getEditorHelpers(view: EditorView, actionId?: string) {
  // Helper to get text with excluded blocks redacted
  const getFilteredText = () => {
    const docText = view.state.doc.toString()
    
    if (!actionId) return docText

    const blocks = detectCodeBlocks(docText)
    let filteredText = docText
    
    console.log(`[ActionExecutor] Filtering for action: ${actionId}`)

    // Iterate blocks in reverse to simplify index handling (though we are replacing ranges)
    // Actually, we should build a new string or array of parts.
    // Easier: Replace excluded blocks with empty lines to preserve line counts for other ops.
    
    // Iterate blocks in reverse to preserve indices for replacement
    const reversedBlocks = [...blocks].reverse()
    
    for (const block of reversedBlocks) {
      const excludeParam = getParamAsString(block.parameters, 'exclude', '')
      const exclusions = excludeParam.split(',').map(s => s.trim())
      
      console.log(`[ActionExecutor] Checking block lines ${block.startLine}-${block.endLine}. Exclusions:`, exclusions)

      // Check for 'action:ID' exclusion
      const isExcluded = exclusions.some(ex => ex === `action:${actionId}`)
      
      if (isExcluded) {
        console.log(`[ActionExecutor] Excluding block!`)
        // Redact content while preserving indices and line numbers
        // We replace characters with spaces but keep newlines
        const from = startLine.from
        const to = endLine.to
        
        const originalContent = filteredText.substring(from, to)
        const redactedContent = originalContent.replace(/[^\n]/g, ' ')
        
        filteredText = filteredText.substring(0, from) + redactedContent + filteredText.substring(to)
      }
    }
    
    return filteredText
  }

  return {
    // Selection operations
    getSelection: () => {
      const selection = view.state.selection.main
      if (selection.empty) return ''
      
      const fullText = getFilteredText()
      return fullText.slice(selection.from, selection.to)
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
      return getFilteredText()
    },
    
    getLine: (lineNumber: number) => {
      const text = getFilteredText()
      const lines = text.split('\n')
      // 1-based index
      if (lineNumber < 1 || lineNumber > lines.length) return ''
      return lines[lineNumber - 1]
    },
    
    getLines: () => {
      return getFilteredText().split('\n')
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