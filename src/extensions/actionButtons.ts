import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { useActionStore } from '../store/actionStore'
import { useNotificationStore } from '../store/notificationStore'
import { executeAction } from '../utils/actionExecutor'

class ActionButtonWidget extends WidgetType {
  constructor(readonly actionId: string) { super() }

  eq(other: ActionButtonWidget) {
    return other.actionId === this.actionId
  }

  toDOM(view: EditorView) {
    const btn = document.createElement('button')
    btn.className = 'cm-action-button'
    
    // Look up action details
    const action = useActionStore.getState().actions.find(a => a.id === this.actionId)
    
    if (action) {
      btn.textContent = `▶ ${action.name}`
      btn.title = `Run: ${action.description || action.name}`
      btn.dataset.actionId = this.actionId
    } else {
      btn.textContent = `⚠ Unknown: ${this.actionId}`
      btn.classList.add('cm-action-error')
    }

    btn.onclick = (e) => {
      e.preventDefault()
      const currentAction = useActionStore.getState().actions.find(a => a.id === this.actionId)
      if (currentAction) {
        const result = executeAction(currentAction.code, view)
        
        if (result.success) {
          useNotificationStore.getState().addNotification({
            type: 'success',
            message: currentAction.name,
            details: 'Action executed successfully'
          })
        } else {
          console.error(`Action failed: ${result.error}`)
          useNotificationStore.getState().addNotification({
            type: 'error',
            message: 'Action Failed',
            details: result.error
          })
        }
      } else {
        console.error(`Action ${this.actionId} not found`)
        useNotificationStore.getState().addNotification({
          type: 'error',
          message: 'Action Not Found',
          details: `ID: ${this.actionId}`
        })
      }
    }
    return btn
  }

  ignoreEvent() {
    return true
  }
}

export const actionButtonPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    // Regex: [[action:action-id]]
    const regex = /\[\[action:([a-zA-Z0-9_-]+)\]\]/g
    
    for (const { from, to } of view.visibleRanges) {
      const text = view.state.doc.sliceString(from, to)
      let match
      while ((match = regex.exec(text))) {
        const start = from + match.index
        const end = start + match[0].length
        const actionId = match[1]

        builder.add(
          start,
          end,
          Decoration.replace({
            widget: new ActionButtonWidget(actionId),
          })
        )
      }
    }
    return builder.finish()
  }
}, {
  decorations: v => v.decorations
})
