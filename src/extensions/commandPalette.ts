import { autocompletion, CompletionContext } from '@codemirror/autocomplete'
import { useActionStore } from '../store/actionStore'
import { useTemplateStore } from '../store/templateStore'
import { executeAction } from '../utils/actionExecutor'
import { getEditorHelpers } from '../utils/actionExecutor'

function actionCompletions(context: CompletionContext) {
  const word = context.matchBefore(/\w*/)
  if (!word || (word.from === word.to && !context.explicit)) return null

  const actions = useActionStore.getState().actions
  const templates = useTemplateStore.getState().templates

  return {
    from: word.from,
    options: [
      ...actions.filter(a => a.enabled).map(a => ({
        label: a.name,
        type: 'function',
        detail: 'Action',
        apply: (view: any) => {
            // We need to execute the action. 
            // The apply function in autocompletion usually inserts text.
            // But we can run side effects.
            // However, we probably want to insert the [[action:ID]] widget OR run it?
            // "Command Palette" implies running it.
            // But checking the reference doc: "apply: () => executeAction(a)"
            
            // If it's a button type, maybe insert the widget?
            if (a.type === 'button') {
                 const helpers = getEditorHelpers(view)
                 helpers.insertAtCursor(`[[action:${a.id}]]`)
            } else {
                 executeAction(a.code, view)
            }
        }
      })),
      ...templates.map(t => ({
        label: t.name,
        type: 'text',
        detail: 'Template',
        apply: (view: any) => {
             const helpers = getEditorHelpers(view)
             helpers.insertTemplate(t.content)
        }
      }))
    ]
  }
}

export const commandPaletteExtension = autocompletion({
  override: [actionCompletions],
  activateOnTyping: false // Only on Ctrl+Space (or explicit trigger)
})
