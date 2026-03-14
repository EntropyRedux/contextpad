import { EditorView } from '@codemirror/view'

export const autocompleteTheme = EditorView.theme({
  '.cm-tooltip-autocomplete': {
    background: 'var(--bg-overlay)',
    border: '1px solid var(--border-default)',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '13px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden'
  },

  '.cm-tooltip-autocomplete > ul': {
    maxHeight: '300px',
    overflowY: 'auto',
    margin: 0,
    padding: '4px 0',
    listStyle: 'none'
  },

  '.cm-tooltip-autocomplete > ul > li': {
    padding: '4px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-primary)'
  },

  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    background: 'var(--accent-bg)',
    color: 'var(--text-bright)'
  },

  '.cm-completionLabel': {
    flex: 1
  },

  '.cm-completionDetail': {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginLeft: '8px'
  },

  '.cm-completionIcon': {
    width: '14px',
    height: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    opacity: 0.8
  },

  '.cm-completionIcon-keyword': {
    color: 'var(--accent)'
  },

  '.cm-completionIcon-text': {
    color: '#9cdcfe'
  },

  /* Snippet styling */
  '.cm-completionIcon-snippet': {
    color: '#b5cea8'
  }
})
