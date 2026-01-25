/**
 * Code Block Parameters Extension for CodeMirror 6
 *
 * Provides:
 * 1. Autocomplete when typing inside {params} (Exported source)
 * 2. Toggling visibility of code block info strings (language + params)
 *
 * @version 1.5.0
 */

import { EditorState, RangeSetBuilder } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view'
import {
  CompletionContext,
  CompletionResult,
  Completion,
} from '@codemirror/autocomplete'
import {
  KNOWN_PARAMS,
} from '../utils/codeBlockParams'
import { useActionStore } from '../store/actionStore'

// =============================================================================
// Constants
// =============================================================================

const INSIDE_PARAMS_REGEX = /^(`{3,}|~{3,})(\S*?)\s*\{([^}]*)$/
const HEADER_REGEX = /^(\s*)(`{3,}|~{3,})(.*)$/

// =============================================================================
// Visibility Plugin
// =============================================================================

function buildMarkerDecorations(view: EditorView, showMarkers: boolean): DecorationSet {
  if (showMarkers) return Decoration.none

  const builder = new RangeSetBuilder<Decoration>()
  
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    const lines = text.split('\n')
    let pos = from

    for (const line of lines) {
      const match = line.match(HEADER_REGEX)
      if (match) {
        const start = pos + match[1].length + match[2].length
        const end = pos + line.length
        
        if (end > start) {
          builder.add(start, end, Decoration.replace({}))
        }
      }
      pos += line.length + 1
    }
  }

  return builder.finish()
}

export const codeBlockMarkerPlugin = (showMarkers: boolean) => ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildMarkerDecorations(view, showMarkers)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildMarkerDecorations(update.view, showMarkers)
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
)

// =============================================================================
// Autocomplete for Params
// =============================================================================

function isInsideParams(state: EditorState, pos: number): { from: number; prefix: string } | null {
  const line = state.doc.lineAt(pos)
  const textBefore = line.text.slice(0, pos - line.from)

  const match = textBefore.match(INSIDE_PARAMS_REGEX)
  if (match) {
    const paramsContent = match[3] || ''
    const lastCommaOrBrace = Math.max(
      paramsContent.lastIndexOf(','),
      paramsContent.lastIndexOf('{'),
      -1
    )
    const prefix = paramsContent.slice(lastCommaOrBrace + 1).trim()

    const fromOffset = lastCommaOrBrace + 1
    const leadingSpaces = paramsContent.slice(fromOffset).length - paramsContent.slice(fromOffset).trimStart().length
    const from = line.from + textBefore.lastIndexOf('{') + 1 + fromOffset + leadingSpaces

    return { from, prefix }
  }

  return null
}

function getParamCompletions(): Completion[] {
  const completions: Completion[] = []

  // Add Action IDs for exclude="action:..."
  const actions = useActionStore.getState().actions
  actions.forEach(action => {
    completions.push({
      label: `action:${action.id}`,
      type: 'constant',
      detail: 'Action ID',
      info: `Exclude action: ${action.name}`,
      apply: (view, completion, from, to) => {
        // If we are inside quotes, just insert the ID part? 
        // Or assume user typed "action:"? 
        // Simple insert for now.
        view.dispatch({
          changes: { from, to, insert: `action:${action.id}` }
        })
      }
    })
  })

  for (const [key, info] of Object.entries(KNOWN_PARAMS)) {
    if (info.type === 'boolean') {
      completions.push({
        label: key,
        type: 'keyword',
        detail: 'boolean',
        info: info.description,
        boost: 1,
      })
    } else if (info.type === 'string') {
      completions.push({
        label: `${key}=""`,
        type: 'property',
        detail: 'string',
        info: info.description,
        apply: (view, completion, from, to) => {
          const insert = `${key}=""`
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor: from + insert.length - 1 },
          })
        },
      })
    }
  }

  return completions
}

export function codeBlockParamsCompletions(context: CompletionContext): CompletionResult | null {
  const inside = isInsideParams(context.state, context.pos)

  if (!inside) {
    return null
  }

  const completions = getParamCompletions()

  const filtered = completions.filter((c) =>
    c.label.toLowerCase().startsWith(inside.prefix.toLowerCase())
  )

  if (filtered.length === 0 && inside.prefix.length === 0) {
    return {
      from: inside.from,
      options: completions,
      filter: false,
    }
  }

  return {
    from: inside.from,
    options: filtered.length > 0 ? filtered : completions,
    filter: true,
  }
}

// =============================================================================
// Extension Export
// =============================================================================

/**
 * Create the code block params extension
 * REFACTORED: Returns ONLY the visibility plugin.
 * Autocomplete is handled by the global AutocompleteService to avoid conflicts.
 */
export function codeBlockParamsExtension(showMarkers: boolean = true) {
  return [
    codeBlockMarkerPlugin(showMarkers)
  ]
}
