import { Extension } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { nord } from '@uiw/codemirror-theme-nord'
import { githubLight, githubDark } from '@uiw/codemirror-theme-github'
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode'
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'

const monokai = createTheme({
  theme: 'dark',
  settings: {
    background: '#272822',
    foreground: '#f8f8f2',
    caret: '#f8f8f0',
    selection: '#49483e',
    selectionMatch: '#49483e',
    lineHighlight: '#3e3d32',
    gutterBackground: '#272822',
    gutterForeground: '#90908a',
  },
  styles: [
    { tag: [t.keyword, t.operatorKeyword], color: '#f92672' },
    { tag: [t.name, t.deleted, t.character, t.macroName], color: '#f8f8f2' },
    { tag: [t.propertyName], color: '#a6e22e' },
    { tag: [t.function(t.variableName), t.labelName], color: '#a6e22e' },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#66d9ef' },
    { tag: [t.definition(t.name), t.separator], color: '#f8f8f2' },
    { tag: [t.className], color: '#a6e22e' },
    { tag: [t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#ae81ff' },
    { tag: [t.typeName], color: '#66d9ef' },
    { tag: [t.operator], color: '#f92672' },
    { tag: [t.url, t.escape, t.regexp, t.link], color: '#66d9ef' },
    { tag: [t.meta, t.comment], color: '#75715e' },
    { tag: [t.strong], fontWeight: 'bold' },
    { tag: [t.emphasis], fontStyle: 'italic' },
    { tag: [t.strikethrough], textDecoration: 'line-through' },
    { tag: [t.link], color: '#66d9ef', textDecoration: 'underline' },
    { tag: [t.heading], color: '#f92672', fontWeight: 'bold' },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#ae81ff' },
    { tag: [t.processingInstruction, t.string, t.inserted], color: '#e6db74' },
    { tag: [t.invalid], color: '#ff6188' },
  ],
})

export interface Theme {
  id: string
  name: string
  extension: Extension
  type: 'dark' | 'light'
}

export const THEMES: Theme[] = [
  {
    id: 'one-dark',
    name: 'One Dark',
    extension: oneDark,
    type: 'dark',
  },
  {
    id: 'vscode-dark',
    name: 'VS Code Dark',
    extension: vscodeDark,
    type: 'dark',
  },
  {
    id: 'vscode-light',
    name: 'VS Code Light',
    extension: vscodeLight,
    type: 'light',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    extension: dracula,
    type: 'dark',
  },
  {
    id: 'monokai',
    name: 'Monokai',
    extension: monokai,
    type: 'dark',
  },
  {
    id: 'nord',
    name: 'Nord',
    extension: nord,
    type: 'dark',
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    extension: githubDark,
    type: 'dark',
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    extension: githubLight,
    type: 'light',
  },
]

export const DEFAULT_THEME_ID = 'one-dark'

export function getThemeById(id: string): Theme | undefined {
  return THEMES.find(theme => theme.id === id)
}

export function getThemeExtension(id: string): Extension {
  const theme = getThemeById(id)
  return theme ? theme.extension : THEMES[0].extension
}
