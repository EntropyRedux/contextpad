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
export async function executeAction(
  code: string,
  editorView: EditorView,
  actionId?: string // Optional ID of the action being executed
): Promise<ExecutionResult> {
  try {
    if (code.startsWith('FORMULA:')) {
      return executeFormulaAction(code.slice(8), editorView)
    }

    const validation = validateActionCode(code)
    if (!validation.valid) {
      throw new Error(`Code validation failed: ${validation.errors.join(', ')}`)
    }

    const helpers = getEditorHelpers(editorView, actionId)

    // Prepare the context to send to the sandbox
    const context = {
      selection: helpers.getSelection(),
      allText: helpers.getAllText(),
      cursorPosition: helpers.getCursorPosition(),
      currentLineText: helpers.getCurrentLine(),
      lineCount: helpers.getLineCount()
    }

    // Create a hidden sandbox iframe
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = '/sandbox.html'
    iframe.sandbox.add('allow-scripts')
    document.body.appendChild(iframe)

    return new Promise((resolve) => {
      const messageId = crypto.randomUUID()

      // Timeout safeguard
      const timeout = setTimeout(() => {
        window.removeEventListener('message', messageHandler)
        document.body.removeChild(iframe)
        resolve({ success: false, error: 'Action execution timed out' })
      }, 5000)

      const messageHandler = async (event: MessageEvent) => {
        // Ensure message is from our sandbox
        if (event.source !== iframe.contentWindow) return

        const { id, success, error, mutations } = event.data
        if (id !== messageId) return

        clearTimeout(timeout)
        window.removeEventListener('message', messageHandler)
        document.body.removeChild(iframe)

        if (!success) {
          resolve({ success: false, error })
          return
        }

        // Apply mutations
        try {
          if (mutations && Array.isArray(mutations)) {
            for (const m of mutations) {
              switch (m.type) {
                case 'replaceSelection':
                  helpers.replaceSelection(m.text)
                  break
                case 'insertAtCursor':
                  helpers.insertAtCursor(m.text)
                  break
                case 'replaceAllText':
                  helpers.replaceAllText(m.text)
                  break
                case 'setCursorPosition':
                  helpers.setCursorPosition(m.pos)
                  break
                case 'copyToClipboard':
                  await navigator.clipboard.writeText(m.text)
                  break
                case 'log':
                  console.log('[Sandbox]', ...m.args)
                  break
                case 'error':
                  console.error('[Sandbox Error]', ...m.args)
                  break
              }
            }
          }
          resolve({ success: true })
        } catch (mutationErr) {
          resolve({
            success: false,
            error: mutationErr instanceof Error ? mutationErr.message : String(mutationErr)
          })
        }
      }

      window.addEventListener('message', messageHandler)

      // Wait for iframe to load before posting message
      iframe.onload = () => {
        iframe.contentWindow?.postMessage({
          id: messageId,
          code,
          context
        }, '*')
      }
    })

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

    // Iterate blocks in reverse to preserve indices for replacement
    const reversedBlocks = [...blocks].reverse()

    for (const block of reversedBlocks) {
      const excludeParam = getParamAsString(block.parameters, 'exclude', '')
      const exclusions = excludeParam.split(',').map(s => s.trim())

      const isExcluded = exclusions.some(ex => ex === `action:${actionId}`)

      if (isExcluded) {
        // Redact content while preserving indices and line numbers
        // We replace characters with spaces but keep newlines
        const from = view.state.doc.line(block.startLine).from
        const to = view.state.doc.line(block.endLine).to

        const originalContent = filteredText.substring(from, to)
        const redactedContent = originalContent.replace(/[^\n]/g, ' ')

        filteredText = filteredText.substring(0, from) + redactedContent + filteredText.substring(to)
      }
    }

    return filteredText
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(String(text ?? ''))
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

    copyToClipboard,
    // Legacy aliases for backwards-compatible action snippets
    toCopy: copyToClipboard,
    copy: copyToClipboard,

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