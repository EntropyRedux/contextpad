import { Extension } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { nord } from '@uiw/codemirror-theme-nord'
import { githubLight, githubDark } from '@uiw/codemirror-theme-github'
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode'

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
