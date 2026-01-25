/**
 * Locked Code Block Extension
 *
 * Makes code blocks with `{lock}` parameter read-only.
 * Use `{lock, exclude="variables"}` to make specific fields editable.
 *
 * EDITABLE FIELDS SYNTAX: [[content]]
 * Anything inside double brackets [[...]] becomes editable, while the brackets themselves remains locked.
 * This allows creating "form fields" inside locked blocks.
 *
 * Example:
 * ```yaml {lock, exclude="variables"}
 * name: [[{{user_name}}]]
 * role: [[assistant]]
 * ```
 */

import { EditorState, StateField, RangeSet, RangeSetBuilder, RangeValue, Transaction } from '@codemirror/state'
import { EditorView, Decoration, DecorationSet, ViewUpdate } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { extractCodeBlockInfo, getParamAsString } from '../utils/codeBlockParams'

// =============================================================================
// Range Values
// =============================================================================

class LockedRangeValue extends RangeValue {
  constructor(
    public readonly excludeVariables: boolean,
    public readonly exclusions: string[],
    public readonly blockIndex: number // Used to track identity for restoration
  ) { super() }

  eq(other: LockedRangeValue) {
    return this.excludeVariables === other.excludeVariables && 
           this.exclusions.join(',') === other.exclusions.join(',') &&
           this.blockIndex === other.blockIndex
  }
}

class AllowedRangeValue extends RangeValue {
  constructor(
    public readonly type: string, // 'variable'
    public readonly fieldIndex: number // Index of this field within the block
  ) { super() }
  
  eq(other: AllowedRangeValue) { 
    return this.type === other.type && this.fieldIndex === other.fieldIndex
  }
}

// =============================================================================
// Helpers
// =============================================================================

const EXCLUSION_HANDLERS: Record<string, (doc: any, start: number, end: number, builder: RangeSetBuilder<AllowedRangeValue>) => void> = {
  'variables': (doc, start, end, builder) => {
    const text = doc.sliceString(start, end)
    const pattern = /\[\[((?:(?!\]\]).)*)\]\]/g
    let match
    let fieldIndex = 0
    
    while ((match = pattern.exec(text)) !== null) {
      const fieldStart = start + match.index
      const fieldEnd = fieldStart + match[0].length
      const contentFrom = fieldStart + 2
      const contentTo = fieldEnd - 2
      
      if (contentTo >= contentFrom) {
         builder.add(contentFrom, contentTo, new AllowedRangeValue('variable', fieldIndex++))
      }
    }
  }
}

function buildLockedRanges(state: EditorState): { locked: RangeSet<LockedRangeValue>, allowed: RangeSet<AllowedRangeValue> } {
  const lockedBuilder = new RangeSetBuilder<LockedRangeValue>()
  const allowedBuilder = new RangeSetBuilder<AllowedRangeValue>()
  const doc = state.doc
  let blockCounter = 0

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === 'FencedCode') {
        const currentBlockIndex = blockCounter++
        const headerLine = doc.lineAt(node.from)
        const headerText = headerLine.text
        
        const fenceMatch = headerText.match(/^(`{3,}|~{3,})(.*)$/)
        if (!fenceMatch) return

        const infoString = fenceMatch[2].trim()
        const parsed = extractCodeBlockInfo(infoString)

        if (parsed.params.lock === true) {
          const contentStart = Math.min(node.to, headerLine.to + 1)
          let contentEnd = node.to
          const endLine = doc.lineAt(node.to)
          if (/^(`{3,}|~{3,})/.test(endLine.text)) {
            contentEnd = Math.max(contentStart, endLine.from - 1)
          }

          if (contentEnd > contentStart) {
            const excludeValue = getParamAsString(parsed.params, 'exclude', '')
            const exclusions = excludeValue.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
            const excludeVariables = exclusions.includes('variables')

            lockedBuilder.add(contentStart, contentEnd, new LockedRangeValue(excludeVariables, exclusions, currentBlockIndex))

            exclusions.forEach(ex => {
              const handler = EXCLUSION_HANDLERS[ex]
              if (handler) {
                handler(doc, contentStart, contentEnd, allowedBuilder)
              }
            })
          }
        }
      }
    }
  })

  return {
    locked: lockedBuilder.finish(),
    allowed: allowedBuilder.finish()
  }
}

// =============================================================================
// State Fields
// =============================================================================

const lockedRangesField = StateField.define<{ locked: RangeSet<LockedRangeValue>, allowed: RangeSet<AllowedRangeValue> }>({
  create(state) {
    return buildLockedRanges(state)
  },
  update(value, tr) {
    if (tr.docChanged) {
      return buildLockedRanges(tr.state)
    }
    return value
  }
})

// Store default values: Map<"blockIndex:fieldIndex", string>
const fieldDefaultsField = StateField.define<Map<string, string>>({
  create(state) {
    return scanFieldDefaults(state, new Map())
  },
  update(value, tr) {
    // Only re-scan if specific conditions met? 
    // Actually, we want to PERSIST defaults even if they are edited.
    // We only want to learn NEW defaults if new blocks are added.
    // For simplicity, we keep existing defaults and only add new ones if we find "virgin" fields?
    // OR: We assume the *first* time we parse a block, that's the default.
    
    // Strategy: If the doc changed structurally (reparsed), check for fields.
    // If a field exists in the map, keep it. If not, add it.
    // BUT: If user edits field, we don't want to update the default to the edited value.
    // PROBLEM: How do we know if it's the "original" value or an edited one?
    // SOLUTION: We rely on the initial load. Or we just don't support updating defaults dynamically.
    // Let's stick to: Defaults are set on init.
    
    // Actually, if we paste a new locked block, we want its values to be defaults.
    // But if we edit an existing one, we don't.
    // Complex.
    // Simplification: We restore to `{{variable}}` if the field looks like a variable placeholder? 
    // No, user said "return it to its original content".
    
    // Let's try: Re-scan defaults only if the NUMBER of blocks changed?
    // Or just keep the map and never overwrite existing keys?
    if (tr.docChanged) {
       return scanFieldDefaults(tr.state, value)
    }
    return value
  }
})

function scanFieldDefaults(state: EditorState, currentDefaults: Map<string, string>): Map<string, string> {
  const newDefaults = new Map(currentDefaults)
  const ranges = buildLockedRanges(state) // We might be rebuilding twice, slight perf hit but safe
  
  const cursor = ranges.allowed.iter()
  while (cursor.value) {
    // Find which block this field belongs to
    // We need the block index. We can look it up in locked ranges.
    let blockIndex = -1
    ranges.locked.between(cursor.from, cursor.to, (_f, _t, v) => {
      blockIndex = v.blockIndex
      return false
    })

    if (blockIndex !== -1 && cursor.value instanceof AllowedRangeValue) {
      const key = `${blockIndex}:${cursor.value.fieldIndex}`
      
      // If we don't have a default for this field, set it.
      // This works for new blocks.
      // It implies that initial state is always the default.
      if (!newDefaults.has(key)) {
        const content = state.doc.sliceString(cursor.from, cursor.to)
        newDefaults.set(key, content)
      }
    }
    cursor.next()
  }
  return newDefaults
}

// =============================================================================
// Transaction Filter
// =============================================================================

const lockedBlockFilter = EditorState.transactionFilter.of((tr) => {
  if (!tr.docChanged) return tr

  const ranges = tr.startState.field(lockedRangesField, false)
  if (!ranges || ranges.locked.size === 0) return tr

  let blocked = false

  tr.changes.iterChanges((fromA, toA) => {
    if (blocked) return

    let isLocked = false
    let currentLockedRange: { from: number, to: number, value: LockedRangeValue } | null = null

    ranges.locked.between(fromA, toA, (from, to, value) => {
      isLocked = true
      currentLockedRange = { from, to, value }
      return false 
    })

    if (!isLocked) return 

    if (currentLockedRange && currentLockedRange.value.exclusions.length > 0) {
      let isAllowed = false
      ranges.allowed.between(fromA, toA, (allowFrom, allowTo) => {
        if (fromA >= allowFrom && toA <= allowTo) {
          isAllowed = true
        }
      })
      if (isAllowed) return 
    }

    blocked = true
  })

  return blocked ? [] : tr
})

// =============================================================================
// Restore Listener
// =============================================================================

const restoreListener = EditorView.updateListener.of((update) => {
  if (!update.docChanged) return

  const ranges = update.state.field(lockedRangesField, false)
  const defaults = update.state.field(fieldDefaultsField, false)
  if (!ranges || !defaults) return

  const restoreChanges: {from: number, to: number, insert: string}[] = []

  const cursor = ranges.allowed.iter()
  while (cursor.value) {
    if (cursor.from === cursor.to) { // Field is empty!
      // Identify field
      let blockIndex = -1
      ranges.locked.between(cursor.from, cursor.to, (_f, _t, v) => {
        blockIndex = v.blockIndex
        return false
      })

      if (blockIndex !== -1 && cursor.value instanceof AllowedRangeValue) {
        const key = `${blockIndex}:${cursor.value.fieldIndex}`
        const defaultContent = defaults.get(key)
        
        if (defaultContent) {
          restoreChanges.push({
            from: cursor.from,
            to: cursor.to,
            insert: defaultContent
          })
        }
      }
    }
    cursor.next()
  }

  if (restoreChanges.length > 0) {
    setTimeout(() => {
      update.view.dispatch({ changes: restoreChanges })
    })
  }
})

// =============================================================================
// Visual Decorations
// =============================================================================

const lockedDecorations = EditorView.decorations.compute([lockedRangesField], (state) => {
  const ranges = state.field(lockedRangesField, false)
  if (!ranges) return Decoration.none

  const builder = new RangeSetBuilder<Decoration>()
  
  ranges.locked.between(0, state.doc.length, (from, to) => {
    builder.add(from, to, Decoration.mark({ class: 'cm-locked-content' }))
  })
  
  return builder.finish()
})

// =============================================================================
// Export
// =============================================================================

export function lockedEditorExtension() {
  return [
    lockedRangesField,
    fieldDefaultsField,
    lockedBlockFilter,
    restoreListener,
    lockedDecorations
  ]
}
