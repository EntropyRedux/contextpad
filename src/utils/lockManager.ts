import { EditorView } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { extractCodeBlockInfo, buildInfoString } from './codeBlockParams'

/**
 * Utility to manage locking/unlocking of code blocks in the editor.
 */

/**
 * Locks all code blocks in the document that aren't already locked.
 */
export function lockAllBlocks(view: EditorView) {
  const { state } = view
  const changes: { from: number, to: number, insert: string }[] = []

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === 'FencedCode') {
        const headerLine = state.doc.lineAt(node.from)
        const headerText = headerLine.text
        
        const fenceMatch = headerText.match(/^(`{3,}|~{3,})(.*)$/)
        if (!fenceMatch) return

        const infoString = fenceMatch[2].trim()
        const parsed = extractCodeBlockInfo(infoString)

        if (!parsed.params.lock) {
          const newParams = { ...parsed.params, lock: true }
          const newHeader = `${fenceMatch[1]}${buildInfoString(parsed.language, newParams)}`
          changes.push({
            from: headerLine.from,
            to: headerLine.to,
            insert: newHeader
          })
        }
      }
    }
  })

  if (changes.length > 0) {
    view.dispatch({ changes })
  }
}

/**
 * Unlocks all code blocks in the document.
 */
export function unlockAllBlocks(view: EditorView) {
  const { state } = view
  const changes: { from: number, to: number, insert: string }[] = []

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === 'FencedCode') {
        const headerLine = state.doc.lineAt(node.from)
        const headerText = headerLine.text
        
        const fenceMatch = headerText.match(/^(`{3,}|~{3,})(.*)$/)
        if (!fenceMatch) return

        const infoString = fenceMatch[2].trim()
        const parsed = extractCodeBlockInfo(infoString)

        if (parsed.params.lock) {
          const { lock, ...restParams } = parsed.params
          const newHeader = `${fenceMatch[1]}${buildInfoString(parsed.language, restParams)}`
          changes.push({
            from: headerLine.from,
            to: headerLine.to,
            insert: newHeader
          })
        }
      }
    }
  })

  if (changes.length > 0) {
    view.dispatch({ changes })
  }
}

/**
 * Toggles lock on the code block at the current selection.
 */
export function toggleBlockLock(view: EditorView) {
  const { state } = view
  const pos = state.selection.main.head
  const tree = syntaxTree(state)
  
  let targetNode: any = null
  tree.iterate({
    from: pos,
    to: pos,
    enter: (node) => {
      if (node.name === 'FencedCode' || node.name === 'CodeBlock') {
        targetNode = node
        return false
      }
    }
  })

  if (targetNode) {
    const headerLine = state.doc.lineAt(targetNode.from)
    const headerText = headerLine.text
    
    const fenceMatch = headerText.match(/^(`{3,}|~{3,})(.*)$/)
    if (!fenceMatch) return

    const infoString = fenceMatch[2].trim()
    const parsed = extractCodeBlockInfo(infoString)

    const newParams = { ...parsed.params }
    if (newParams.lock) {
      delete newParams.lock
    } else {
      newParams.lock = true
    }

    const newHeader = `${fenceMatch[1]}${buildInfoString(parsed.language, newParams)}`
    
    view.dispatch({
      changes: {
        from: headerLine.from,
        to: headerLine.to,
        insert: newHeader
      }
    })
  }
}
