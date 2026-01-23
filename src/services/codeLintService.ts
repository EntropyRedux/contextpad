import { linter, Diagnostic } from '@codemirror/lint'
import { syntaxTree } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { Extension } from '@codemirror/state'

interface CodeLintConfig {
  enableJsonLint: boolean
  enableYamlLint: boolean
  enableSqlLint: boolean
  enableHtmlLint: boolean
  enableJavaScriptLint: boolean
}

export class CodeLintService {
  
  createExtension(config: CodeLintConfig, indexingScope: 'performance' | 'thorough'): Extension {
    return [
      linter(view => this.lintCodeBlocks(view, config, indexingScope)),
      this.codeLintTheme()
    ]
  }
  
  private lintCodeBlocks(view: EditorView, config: CodeLintConfig, indexingScope: 'performance' | 'thorough'): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const tree = syntaxTree(view.state)
    const docLength = view.state.doc.length
    const checkLimit = indexingScope === 'performance' ? 50000 : docLength
    
    tree.iterate({
      enter: (node) => {
        if (node.from > checkLimit) return false
        
        if (node.name === 'FencedCode') {
          const lang = this.getLanguage(node, view)
          if (!lang) return
          
          // Find the CodeText node (actual content inside the fence)
          const textNode = node.node.getChild('CodeText')
          if (!textNode) return
          
          const code = view.state.doc.sliceString(textNode.from, textNode.to)
          const errors = this.lintByLanguage(code, lang, config, textNode.from)
          diagnostics.push(...errors)
        }
      }
    })
    
    return diagnostics
  }
  
  private getLanguage(node: any, view: EditorView): string | null {
    const info = node.node.getChild('CodeInfo')
    if (!info) return null
    return view.state.doc.sliceString(info.from, info.to).trim().toLowerCase()
  }
  
  private lintByLanguage(code: string, lang: string, config: CodeLintConfig, offset: number): Diagnostic[] {
    switch (lang) {
      case 'json':
        return config.enableJsonLint ? this.lintJSON(code, offset) : []
      case 'yaml':
      case 'yml':
        return config.enableYamlLint ? this.lintYAML(code, offset) : []
      case 'html':
        return config.enableHtmlLint ? this.lintHTML(code, offset) : []
      case 'javascript':
      case 'js':
        return config.enableJavaScriptLint ? this.lintJS(code, offset) : []
      default:
        return []
    }
  }

  private lintJSON(code: string, offset: number): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    if (!code.trim()) return []

    // 1. Basic JSON.parse check
    try {
      JSON.parse(code)
    } catch (e: any) {
      const msg = e.message
      const posMatch = msg.match(/at position (\d+)/)
      const pos = posMatch ? parseInt(posMatch[1]) : 0
      diagnostics.push({
        from: offset + pos,
        to: offset + pos + 1,
        severity: 'error',
        message: `JSON Error: ${msg}`
      })
    }

    // 2. Trailing comma check (Regex fallback)
    const trailingComma = /,(s*[\}\]])/g
    let m
    while ((m = trailingComma.exec(code)) !== null) {
      diagnostics.push({
        from: offset + m.index,
        to: offset + m.index + 1,
        severity: 'warning',
        message: 'Trailing comma is not valid JSON'
      })
    }

    return diagnostics
  }

  private lintYAML(code: string, offset: number): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const lines = code.split('\n')
    
    lines.forEach((line, i) => {
      const indent = line.search(/\S/)
      if (indent > 0 && indent % 2 !== 0) {
        const lineStart = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0)
        diagnostics.push({
          from: offset + lineStart,
          to: offset + lineStart + indent,
          severity: 'warning',
          message: 'YAML: Indentation should be 2 spaces'
        })
      }
    })
    return diagnostics
  }

  private lintHTML(code: string, offset: number): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    // Basic unclosed tag check (simple stack)
    const tags = code.match(/<\/?([a-z1-6]+)/gi) || []
    const stack: string[] = []
    
    // This is a very rough regex check
    const tagRegex = /<(\/)?([a-z1-6]+)/gi
    let m
    while ((m = tagRegex.exec(code)) !== null) {
      const isClosing = !!m[1]
      const name = m[2].toLowerCase()
      if (['br', 'hr', 'img', 'input', 'meta', 'link'].includes(name)) continue
      
      if (isClosing) {
        if (stack.length === 0 || stack[stack.length - 1] !== name) {
          diagnostics.push({
            from: offset + m.index,
            to: offset + m.index + m[0].length,
            severity: 'error',
            message: `Unexpected closing tag </${name}>`
          })
        } else {
          stack.pop()
        }
      } else {
        stack.push(name)
      }
    }
    return diagnostics
  }

  private lintJS(code: string, offset: number): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    // Very basic check for common syntax errors like unclosed braces
    const openBraces = (code.match(/{/g) || []).length
    const closeBraces = (code.match(/}/g) || []).length
    if (openBraces !== closeBraces) {
      diagnostics.push({
        from: offset,
        to: offset + code.length,
        severity: 'warning',
        message: `Mismatched braces: {${openBraces}} vs }${closeBraces}}`
      })
    }
    return diagnostics
  }

  private codeLintTheme(): Extension {
    return EditorView.theme({
      '.cm-lintRange-error': {
        textDecoration: 'underline wavy #f44336 1px',
        textUnderlineOffset: '2px'
      }
    })
  }
}

export const codeLintService = new CodeLintService()
