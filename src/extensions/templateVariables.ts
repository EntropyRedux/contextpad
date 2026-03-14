import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, keymap, WidgetType } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'

// Highlight {{VARIABLE}} with underline + background
const variableDecoration = Decoration.mark({
  class: 'cm-template-variable',
  attributes: { 'data-placeholder': 'true' }
})

export const variablePlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.findVariables(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.findVariables(update.view)
    }
  }

  findVariables(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    const regex = /\{\{([^}]+)\}\}/g
    
    for (const { from, to } of view.visibleRanges) {
      const text = view.state.doc.sliceString(from, to)
      let match
      while ((match = regex.exec(text))) {
        const start = from + match.index
        const end = start + match[0].length
        builder.add(start, end, variableDecoration)
      }
    }
    return builder.finish()
  }
}, {
  decorations: v => v.decorations
})

// Tab navigation for variables
export const tabNavigateVariables = keymap.of([{
  key: 'Tab',
  run: (view) => {
    const { state } = view
    const pos = state.selection.main.head
    const text = state.doc.toString()
    
    // Find next {{...}} after cursor
    const regex = /\{\{([^}]+)\}\}/g
    regex.lastIndex = pos
    const match = regex.exec(text)
    
    if (match) {
      // Select the variable content inside {{ }}
      // Or select the whole thing? Standard is usually selecting the content so typing replaces it.
      // But here it's {{VAR}}. If I type, I want to replace the whole {{VAR}}.
      const start = match.index
      const end = match.index + match[0].length
      
      view.dispatch({
        selection: { anchor: start, head: end },
        scrollIntoView: true
      })
      return true
    }
    // Loop back to start?
    const firstMatch = /\{\{([^}]+)\}\}/g.exec(text)
    if (firstMatch && firstMatch.index < pos) {
       view.dispatch({
        selection: { anchor: firstMatch.index, head: firstMatch.index + firstMatch[0].length },
        scrollIntoView: true
      })
      return true
    }
    
    return false // Allow default Tab behavior (indent)
  }
}])
