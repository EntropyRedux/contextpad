import { linter, Diagnostic, forceLinting } from '@codemirror/lint'
import { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { useTabStore } from '../store/tabStore'

export type SpellCheckMode = 'built-in' | 'browser' | 'disabled'

interface SpellCheckConfig {
  ignoreUppercase: boolean
  ignoreNumbers: boolean
  ignoreTitleCase: boolean
  ignoreSnakeCase: boolean
  customDictionary: string[]
  ignoredWords?: string[] // Session-based ignored words
}

export class SpellCheckService {
  private dictionary: Set<string> = new Set()
  private ignoredSessionWords: Set<string> = new Set()
  private initialized = false
  private loading = false

  /**
   * Initialize with full dictionary from public folder
   */
  async initialize() {
    if (this.initialized || this.loading) return
    this.loading = true

    try {
      console.log('SpellCheck: Loading dictionary...')
      const response = await fetch('/Dictionaries/en-US.txt')
      if (!response.ok) throw new Error('Failed to fetch dictionary')

      const text = await response.text()
      // Split by newline and normalize
      const words = text.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(Boolean)

      this.dictionary = new Set(words)
      this.initialized = true
      console.log(`SpellCheck: Loaded ${this.dictionary.size} words.`)
    } catch (error) {
      console.error('SpellCheck: Failed to load dictionary:', error)
      // Fallback to minimal set to avoid flagging everything
      this.dictionary = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'])
    } finally {
      this.loading = false
    }
  }

  /**
   * Create browser native spellcheck extension
   * Uses OS dictionary - zero performance overhead
   */
  createBrowserSpellCheckExtension(): Extension {
    return EditorView.contentAttributes.of({ spellcheck: 'true' })
  }

  /**
   * Create built-in spell check linter extension (with lazy suggestions)
   */
  createExtension(config: SpellCheckConfig, indexingScope: 'performance' | 'thorough'): Extension {
    // Trigger async initialization (non-blocking)
    this.initialize()

    return [
      linter(view => this.checkSpelling(view, config, indexingScope), {
        delay: 500 // Debounce linting by 500ms for better performance
      }),
      this.spellCheckTheme()
    ]
  }

  /**
   * Check spelling in document (Optimized: Tree-based, lazy suggestions)
   */
  private checkSpelling(view: EditorView, config: SpellCheckConfig, indexingScope: 'performance' | 'thorough'): Diagnostic[] {
    if (!this.initialized) return []

    const diagnostics: Diagnostic[] = []
    const tree = syntaxTree(view.state)
    const doc = view.state.doc

    // Performance limit - reduce check area
    const checkLimit = indexingScope === 'performance' ? 30000 : 100000

    // Iterate tree to find checking ranges (skipping code blocks, etc)
    tree.iterate({
      from: 0,
      to: Math.min(doc.length, checkLimit),
      enter: (node) => {
        // Skip code blocks and other non-text zones entirely
        if (
          node.name.includes('Code') ||
          node.name.includes('Link') ||
          node.name.includes('URL') ||
          node.name.includes('HTML')
        ) {
          return false // Don't enter children
        }

        if (node.to - node.from > 0 && !node.node.firstChild) {
          this.scanTextNode(node.from, node.to, doc, diagnostics, config)
        }
      }
    })

    return diagnostics
  }

  private scanTextNode(from: number, to: number, doc: any, diagnostics: Diagnostic[], config: SpellCheckConfig) {
    const text = doc.sliceString(from, to)
    const wordRegex = /\b[a-zA-Z][a-zA-Z']*\b/g
    let match: RegExpExecArray | null

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0]
      const wordFrom = from + match.index
      const wordTo = wordFrom + word.length

      // Skip words shorter than 2 chars
      if (word.length < 2) continue

      // Filter checks
      if (config.ignoreUppercase && /^[A-Z]+$/.test(word)) continue
      if (config.ignoreNumbers && /\d/.test(word)) continue
      if (config.ignoreSnakeCase && /_+/.test(word)) continue
      if (config.ignoreTitleCase && /^[A-Z][a-z']*$/.test(word)) continue

      // Dictionary & Ignore check
      if (this.isWordValid(word, config)) continue

      // Store word for lazy suggestion lookup
      const misspelledWord = word

      // Create diagnostic with LAZY actions - suggestions computed on-demand
      diagnostics.push({
        from: wordFrom,
        to: wordTo,
        severity: 'warning',
        message: `Spelling: "${word}"`,
        actions: [
          // "Get Suggestions" action - computes suggestions only when clicked
          {
            name: '📝 Get Suggestions...',
            apply: (view: EditorView, from: number, to: number) => {
              this.showSuggestionsPopup(view, from, to, misspelledWord, config)
            }
          },
          {
            name: 'Add to Dictionary',
            apply: () => {
              const state = useTabStore.getState()
              const currentConfig = state.viewSettings.spellCheckConfig
              state.setViewSettings({
                spellCheckConfig: {
                  ...currentConfig,
                  customDictionary: [...currentConfig.customDictionary, misspelledWord.toLowerCase()]
                }
              })
              // Force re-lint to remove the underline
              const activeTab = state.getActiveTab()
              if (activeTab?.editorView) {
                forceLinting(activeTab.editorView)
              }
            }
          },
          {
            name: 'Ignore',
            apply: (view: EditorView) => {
              this.ignoredSessionWords.add(misspelledWord.toLowerCase())
              forceLinting(view)
            }
          }
        ]
      })
    }
  }

  /**
   * Show suggestions popup - called lazily when user clicks "Get Suggestions"
   */
  private showSuggestionsPopup(view: EditorView, from: number, to: number, word: string, config: SpellCheckConfig) {
    // Calculate suggestions on-demand
    const suggestions = this.getSuggestions(word, config)

    if (suggestions.length === 0) {
      // No suggestions found - just notify
      console.log(`No suggestions found for "${word}"`)
      return
    }

    // Create a floating menu with suggestions
    const menu = document.createElement('div')
    menu.className = 'spell-suggestions-menu'
    menu.style.cssText = `
      position: fixed;
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      min-width: 150px;
    `

    suggestions.forEach(suggestion => {
      const item = document.createElement('button')
      item.textContent = suggestion
      item.style.cssText = `
        display: block;
        width: 100%;
        text-align: left;
        padding: 6px 10px;
        background: transparent;
        border: none;
        border-radius: 4px;
        color: #d4d4d4;
        cursor: pointer;
        font-size: 13px;
      `
      item.onmouseenter = () => { item.style.background = '#094771'; item.style.color = '#fff' }
      item.onmouseleave = () => { item.style.background = 'transparent'; item.style.color = '#d4d4d4' }
      item.onclick = () => {
        view.dispatch({ changes: { from, to, insert: suggestion } })
        menu.remove()
      }
      menu.appendChild(item)
    })

    // Position near the word
    const coords = view.coordsAtPos(from)
    if (coords) {
      menu.style.left = `${coords.left}px`
      menu.style.top = `${coords.bottom + 4}px`
    }

    document.body.appendChild(menu)

    // Close on click outside
    const closeHandler = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove()
        document.removeEventListener('click', closeHandler)
      }
    }
    setTimeout(() => document.addEventListener('click', closeHandler), 10)

    // Close on Escape
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        menu.remove()
        document.removeEventListener('keydown', escHandler)
      }
    }
    document.addEventListener('keydown', escHandler)
  }

  private isWordValid(word: string, config: SpellCheckConfig): boolean {
    const lower = word.toLowerCase()
    // Remove apostrophes for checking (e.g., "don't" -> "dont" or check "don't" directly)
    const normalized = lower.replace(/'/g, '')

    if (config.customDictionary.includes(lower)) return true
    if (config.customDictionary.includes(normalized)) return true
    if (this.ignoredSessionWords.has(lower)) return true
    if (this.dictionary.has(lower)) return true
    if (this.dictionary.has(normalized)) return true

    // Check common contractions
    const contractions: Record<string, boolean> = {
      "don't": true, "doesn't": true, "didn't": true, "won't": true, "wouldn't": true,
      "can't": true, "couldn't": true, "shouldn't": true, "wasn't": true, "weren't": true,
      "isn't": true, "aren't": true, "haven't": true, "hasn't": true, "hadn't": true,
      "i'm": true, "you're": true, "he's": true, "she's": true, "it's": true,
      "we're": true, "they're": true, "i've": true, "you've": true, "we've": true,
      "they've": true, "i'll": true, "you'll": true, "he'll": true, "she'll": true,
      "we'll": true, "they'll": true, "i'd": true, "you'd": true, "he'd": true,
      "she'd": true, "we'd": true, "they'd": true, "let's": true, "that's": true,
      "what's": true, "who's": true, "where's": true, "there's": true, "here's": true
    }
    if (contractions[lower]) return true

    return false
  }

  private getSuggestions(word: string, config: SpellCheckConfig): string[] {
    const lower = word.toLowerCase()
    const suggestions: Array<{ word: string, dist: number }> = []

    // Search a subset of dictionary for performance
    // Only check words within ±2 characters of the misspelled word
    const minLen = Math.max(1, word.length - 2)
    const maxLen = word.length + 2

    for (const candidate of this.dictionary) {
      if (candidate.length < minLen || candidate.length > maxLen) continue

      const d = this.levenshtein(lower, candidate)
      if (d <= 2) {
        suggestions.push({ word: candidate, dist: d })
        if (suggestions.length >= 8) break // Limit to 8 suggestions
      }
    }

    return suggestions.sort((a, b) => a.dist - b.dist).slice(0, 5).map(s => s.word)
  }

  private levenshtein(a: string, b: string): number {
    const tmp: number[][] = []
    for (let i = 0; i <= a.length; i++) tmp[i] = [i]
    for (let j = 0; j <= b.length; j++) tmp[0][j] = j
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1,
          tmp[i][j - 1] + 1,
          tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        )
      }
    }
    return tmp[a.length][b.length]
  }

  private spellCheckTheme(): Extension {
    return EditorView.theme({
      '.cm-lintRange-warning': {
        textDecoration: 'underline wavy #f59e0b 1px',
        textUnderlineOffset: '2px'
      },
      '.cm-diagnostic': {
        background: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: '6px',
        padding: '8px',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        color: '#d4d4d4',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: '180px'
      },
      '.cm-diagnosticAction': {
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '6px 8px',
        background: 'transparent',
        border: 'none',
        borderRadius: '4px',
        color: '#d4d4d4',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'background 0.1s'
      },
      '.cm-diagnosticAction:hover': {
        background: '#094771',
        color: '#ffffff'
      },
      '.cm-diagnosticAction:first-child': {
        background: '#0e639c',
        color: '#ffffff',
        fontWeight: '500'
      },
      '.cm-diagnosticAction:first-child:hover': {
        background: '#1177bb'
      },
      // Styling for "Add to Dictionary" and "Ignore"
      '.cm-diagnosticAction:nth-child(2)': {
        marginTop: '4px',
        borderTop: '1px solid #333',
        paddingTop: '8px',
        color: '#858585'
      },
      '.cm-diagnosticAction:last-child': {
         color: '#858585'
      },
      '.cm-diagnosticAction:nth-child(2):hover, .cm-diagnosticAction:last-child:hover': {
        color: '#ffffff',
        background: '#333'
      }
    })
  }
}

export const spellCheckService = new SpellCheckService()
