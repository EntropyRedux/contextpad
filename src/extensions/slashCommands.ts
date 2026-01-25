/**
 * Slash Commands Extension for CodeMirror 6
 * Triggered by ALT + / to show inline command palette
 */

import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion,
  startCompletion
} from '@codemirror/autocomplete'
import { EditorView, keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { useActionStore } from '../store/actionStore'
import { useTemplateStore } from '../store/templateStore'
import { useNotificationStore } from '../store/notificationStore'
import { executeAction } from '../utils/actionExecutor'
import { processTemplateVariables } from '../utils/templateVariables'

// --- ICONS (Lucide SVGs) ---
const ICONS = {
  COMMAND: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`, // Zap
  BUTTON: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1 .074.919l-4.3 2.5a1 1 0 0 1-1.22.15L11 14.5a.5.5 0 0 0-.649.07l-.392.392A1 1 0 0 1 8.5 15H3a1 1 0 0 1-1-1v-5.5a1 1 0 0 1 .293-.707l3.72-3.72a1 1 0 0 1 .632-.276c.49.026.83.473.655.939l-.663 1.956Z"/></svg>`, // MousePointerClick
  TEMPLATE: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>` // FileText
}

// --- RENDERER ---
const renderItem = (completion: Completion, state: any, type: 'CMD' | 'BTN' | 'TMPL') => {
  const dom = document.createElement('div')
  dom.className = 'cm-slash-item'
  
  // Icon
  const icon = document.createElement('span')
  icon.className = `cm-slash-icon ${type.toLowerCase()}`
  icon.innerHTML = type === 'CMD' ? ICONS.COMMAND : type === 'BTN' ? ICONS.BUTTON : ICONS.TEMPLATE
  
  // Content
  const content = document.createElement('div')
  content.className = 'cm-slash-content'
  
  const label = document.createElement('div')
  label.className = 'cm-slash-label'
  label.textContent = completion.label
  
  const detail = document.createElement('div')
  detail.className = 'cm-slash-detail'
  detail.textContent = completion.detail || ''
  
  content.appendChild(label)
  content.appendChild(detail)
  
  // Badge
  const badge = document.createElement('span')
  badge.className = `cm-slash-badge ${type.toLowerCase()}`
  badge.textContent = type
  
  dom.appendChild(icon)
  dom.appendChild(content)
  dom.appendChild(badge)
  
  return dom
}

/**
 * Build completions from actions and templates
 */
function getSlashCompletions(): Completion[] {
  const completions: Completion[] = []

  // Get enabled actions
  const actions = useActionStore.getState().getEnabledActions()
  actions.forEach(action => {
    const isButton = action.type === 'button'
    const typeLabel = isButton ? 'BTN' : 'CMD'
    
    completions.push({
      label: action.name,
      detail: action.category, // Used for secondary text
      info: action.description || 'Action',
      type: 'function', // Fallback
      boost: 1, // Prioritize actions
      
      // Custom Render Logic
      typeLabel, // Custom property for our renderer if needed, but we bind it below
      
      apply: (view: EditorView, completion: Completion, from: number, to: number) => {
        try {
          if (isButton) {
            view.dispatch({
              changes: { from: from, to: to, insert: `[[action:${action.id}]]` }
            })
            useNotificationStore.getState().addNotification({
              type: 'success',
              message: 'Button Inserted',
              details: `Inserted widget for "${action.name}"`
            })
          } else {
            // Remove the typed trigger text before running command
            view.dispatch({
              changes: { from: from, to: to, insert: '' }
            })
            
            const result = executeAction(action.code, view, action.id)
            if (!result.success) {
              console.error('Action failed:', result.error)
              useNotificationStore.getState().addNotification({
                type: 'error',
                message: 'Action Failed',
                details: result.error
              })
            } else {
              useNotificationStore.getState().addNotification({
                type: 'success',
                message: 'Action Executed',
                details: `Ran command "${action.name}"`
              })
            }
          }
        } catch (err) {
          console.error('Error applying action:', err)
        }
      }
    })
  })

  // Get visible templates
  const templates = useTemplateStore.getState().getVisibleTemplates()
  templates.forEach(template => {
    completions.push({
      label: template.name,
      detail: template.category,
      info: template.variables.length > 0 ? `Vars: ${template.variables.join(', ')}` : '',
      type: 'text',
      boost: 0,
      
      apply: (view: EditorView, completion: Completion, from: number, to: number) => {
        try {
          const processed = processTemplateVariables(template.content, '')

          view.dispatch({
            changes: { from: from, to: to, insert: processed.content },
            selection: {
              anchor: processed.cursorOffset !== null
                ? from + processed.cursorOffset
                : from + processed.content.length
            }
          })
          useNotificationStore.getState().addNotification({
            type: 'success',
            message: 'Template Inserted',
            details: `Inserted "${template.name}"`
          })
        } catch (err) {
          console.error('Error applying template:', err)
        }
      }
    })
  })

  return completions
}

/**
 * Completion source for slash commands
 * ONLY triggers on explicit activation (Ctrl+Space or Ctrl+Right-click)
 */
export function slashCommandCompletions(context: CompletionContext): CompletionResult | null {
  // Only show actions/templates on explicit trigger (Ctrl+Space)
  // Never show on normal typing
  if (!context.explicit) {
    return null
  }

  // Match any word characters before cursor for filtering
  const word = context.matchBefore(/\w*/)

  // 2. Get all options (filtered later by CodeMirror)
  const allOptions = getSlashCompletions()

  if (allOptions.length === 0) {
    return null
  }

  return {
    // FIX: Anchor 'from' to the start of the word being typed
    // This allows CodeMirror to filter the list against the user's input
    from: word ? word.from : context.pos,
    
    // Map options to attach the custom renderer with closure state
    options: allOptions.map(opt => ({
      ...opt,
      // We infer type from boost/fallback for now to keep getSlashCompletions clean
      // Actions have boost 1, Templates 0.
      // Better: check the option properties we set.
      render: (completion: Completion, state: any) => {
        // HACK: Re-infer type logic for rendering
        // In a real app we'd pass this cleaner, but this works given our setup
        let type: 'CMD' | 'BTN' | 'TMPL' = 'TMPL'
        if (opt.type === 'function') {
           // It's an action. Check apply logic? Hard to peek function.
           // We can check the 'typeLabel' custom prop we added above (though TS might complain if strict)
           // Let's use the 'info' or cast.
           // Better: Add a hidden property to opt in getSlashCompletions
           // TS workaround: access custom property
           const customType = (opt as any).typeLabel
           type = customType || 'CMD'
        }
        return renderItem(completion, state, type)
      }
    })),
    
    filter: true // Enable standard filtering
  }
}

/**
 * Keymap for ALT + / trigger
 */
const slashCommandKeymap = keymap.of([
  {
    key: 'Ctrl-Space',
    run: (view) => {
      startCompletion(view)
      return true
    }
  }
])

/**
 * Custom theme for slash command autocomplete
 */
const slashCommandTheme = EditorView.theme({
  '.cm-tooltip.cm-tooltip-autocomplete': {
    backgroundColor: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
    maxHeight: '350px',
    minWidth: '320px',
    zIndex: 2000,
    padding: '4px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: "'Inter', system-ui, sans-serif",
    gap: '2px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto', // Ensure scrolling
    maxHeight: 'inherit'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '0',
    borderRadius: '4px',
    overflow: 'hidden',
    flexShrink: 0 // PREVENT SQUEEZING: Don't let items shrink to fit height
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: '#2d2d2d',
    color: '#ffffff'
  },
  
  // Custom Item Styles
  '.cm-slash-item': {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    gap: '12px',
    width: '100%',
    cursor: 'pointer'
  },
  '.cm-slash-icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    backgroundColor: '#252526',
    color: '#858585',
    flexShrink: 0
  },
  '.cm-slash-icon.cmd': { color: '#b180f7', backgroundColor: 'rgba(177, 128, 247, 0.1)' },
  '.cm-slash-icon.btn': { color: '#4cc2ff', backgroundColor: 'rgba(76, 194, 255, 0.1)' },
  '.cm-slash-icon.tmpl': { color: '#73c991', backgroundColor: 'rgba(115, 201, 145, 0.1)' },
  
  '.cm-slash-content': {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden'
  },
  '.cm-slash-label': {
    fontSize: '13px',
    fontWeight: '500',
    color: '#e0e0e0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  '.cm-slash-detail': {
    fontSize: '11px',
    color: '#858585',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '2px'
  },
  
  '.cm-slash-badge': {
    fontSize: '9px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    flexShrink: 0
  },
  '.cm-slash-badge.cmd': { color: '#b180f7', border: '1px solid rgba(177, 128, 247, 0.3)' },
  '.cm-slash-badge.btn': { color: '#4cc2ff', border: '1px solid rgba(76, 194, 255, 0.3)' },
  '.cm-slash-badge.tmpl': { color: '#73c991', border: '1px solid rgba(115, 201, 145, 0.3)' },

  // Info Tooltip (Description)
  '.cm-completionInfo': {
    position: 'absolute',
    left: '100%',
    top: '0',
    marginLeft: '8px',
    padding: '8px 12px',
    backgroundColor: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#cccccc',
    maxWidth: '250px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
  }
})

/**
 * Create the slash commands extension
 */
export function slashCommandsExtension() {
  return [
    Prec.highest(slashCommandKeymap),
    slashCommandTheme
  ]
}

/**
 * Programmatically trigger the command palette
 */
export function triggerCommandPalette(view: EditorView) {
  startCompletion(view)
}