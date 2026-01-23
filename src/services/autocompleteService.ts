import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion
} from '@codemirror/autocomplete'
import { Extension } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'
import { slashCommandCompletions } from '../extensions/slashCommands'

interface AutocompleteConfig {
  activateOnTyping: boolean
  maxRenderedOptions: number
  minCharacters: number
  enableMarkdownSnippets: boolean
  enableCodeBlockSnippets: boolean
  useDocumentWords: boolean
  useDictionary: boolean
}

export class AutocompleteService {
  
  /**
   * Create autocomplete extension based on config
   */
  createExtension(config: AutocompleteConfig, indexingScope: 'performance' | 'thorough'): Extension {
    return autocompletion({
      activateOnTyping: config.activateOnTyping,
      maxRenderedOptions: config.maxRenderedOptions,
      override: [
        slashCommandCompletions,
        this.combinedCompletion.bind(this, config, indexingScope)
      ],
      defaultKeymap: true,
      closeOnBlur: true,
      icons: true
    })
  }

  /**
   * Combined completion source that handles both words and snippets with context awareness
   */
  private combinedCompletion(
    config: AutocompleteConfig,
    indexingScope: 'performance' | 'thorough',
    context: CompletionContext
  ): CompletionResult | null {
    const word = context.matchBefore(/\w+/)
    if (!word || (word.from === word.to && !context.explicit)) return null

    const tree = syntaxTree(context.state)
    const node = tree.resolveInner(context.pos, -1)
    const inCodeBlock = this.isInCodeContext(node)
    
    let options: Completion[] = []

    // 1. Snippets (Context Aware)
    if (inCodeBlock && config.enableCodeBlockSnippets) {
      options.push(...this.getCodeSnippets(word.text))
    } else if (!inCodeBlock && config.enableMarkdownSnippets) {
      options.push(...this.getMarkdownSnippets(word.text))
    }

    // 2. Document Words
    if (config.useDocumentWords) {
      const docWords = this.getDocumentWordSuggestions(config, indexingScope, context, word.text)
      options.push(...docWords)
    }

    if (options.length === 0) return null

    return {
      from: word.from,
      options: options
    }
  }

  private isInCodeContext(node: any): boolean {
    let current = node
    while (current) {
      if (current.name === 'FencedCode' || current.name === 'CodeBlock' || current.name === 'InlineCode') {
        return true
      }
      current = current.parent
    }
    return false
  }

  private getMarkdownSnippets(term: string): Completion[] {
    const snippets: Completion[] = [
      { label: 'h1', type: 'keyword', apply: '# ', detail: 'Heading 1' },
      { label: 'h2', type: 'keyword', apply: '## ', detail: 'Heading 2' },
      { label: 'h3', type: 'keyword', apply: '### ', detail: 'Heading 3' },
      { label: 'code', type: 'keyword', apply: '```${}\n\n```', detail: 'Fenced Code Block' },
      { label: 'link', type: 'keyword', apply: '[${text}](url)', detail: 'Markdown Link' },
      { label: 'image', type: 'keyword', apply: '![${alt}](url)', detail: 'Markdown Image' },
      { label: 'table', type: 'keyword', apply: '| Header | Header |\n|---|---|\n| ${} | |', detail: 'Table' },
      { label: 'todo', type: 'keyword', apply: '- [ ] ', detail: 'Task List Item' },
      { label: 'bold', type: 'keyword', apply: '**${}**', detail: 'Bold Text' },
      { label: 'italic', type: 'keyword', apply: '*${}*', detail: 'Italic Text' }
    ]
    return snippets.filter(s => s.label.startsWith(term.toLowerCase()))
  }

  private getCodeSnippets(term: string): Completion[] {
    const snippets: Completion[] = [
      { label: 'func', type: 'keyword', apply: 'function ${name}() {\n  ${}\n}', detail: 'Function' },
      { label: 'if', type: 'keyword', apply: 'if (${condition}) {\n  ${}\n}', detail: 'If block' },
      { label: 'log', type: 'keyword', apply: 'console.log(${});', detail: 'Console Log' },
      { label: 'json', type: 'keyword', apply: '{\n  "${key}": "${value}"\n}', detail: 'JSON object' }
    ]
    return snippets.filter(s => s.label.startsWith(term.toLowerCase()))
  }

  private getDocumentWordSuggestions(
    config: AutocompleteConfig,
    indexingScope: 'performance' | 'thorough',
    context: CompletionContext,
    term: string
  ): Completion[] {
    if (term.length < config.minCharacters) return []

    // Optimization: Only scan a window around the cursor instead of the whole doc
    const range = 5000 // Scan 5000 chars before and after cursor
    const from = Math.max(0, context.pos - range)
    const to = Math.min(context.state.doc.length, context.pos + range)
    const text = context.state.doc.sliceString(from, to)
    
    const words = text.match(/\b[a-zA-Z]{3,}\b/g) || []
    
    const prefix = term.toLowerCase()
    const uniqueWords = Array.from(new Set(words))
    
    return uniqueWords
      .filter(w => w.toLowerCase().startsWith(prefix) && w.toLowerCase() !== prefix)
      .slice(0, config.maxRenderedOptions)
      .map(w => ({ label: w, type: 'text', boost: -1 }))
  }
}

export const autocompleteService = new AutocompleteService()