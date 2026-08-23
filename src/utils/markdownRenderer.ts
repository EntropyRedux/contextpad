import { marked, Tokens } from 'marked'

// Helper for consistent IDs
export const slugify = (text: any) => {
  const str = typeof text === 'string' ? text : String(text || '');
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// IMPORTANT: marked.use() requires a plain object for the renderer, NOT a class instance.
// Class instance methods live on the prototype and are invisible to marked.use() which
// only iterates own enumerable properties. This was the root cause of headings not getting
// custom IDs in the live preview.
marked.use({
  renderer: {
    // Handle Mermaid Code Blocks
    // Transform ```mermaid ... ``` into <div class="mermaid">...</div>
    code(this: any, token: Tokens.Code): string {
      if (token.lang === 'mermaid') {
        return `<div class="mermaid">${token.text}</div>`
      }
      // Default code block rendering with language class
      const langClass = token.lang ? ` class="language-${token.lang}"` : ''
      const escapedCode = token.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return `<pre><code${langClass}>${escapedCode}</code></pre>\n`
    },

    // Handle Headings with Custom IDs (for TOC linking)
    heading(this: any, token: Tokens.Heading): string {
      const id = slugify(token.text);
      // Parse inline tokens to properly render bold, italic, links etc in headings
      const text = this.parser.parseInline(token.tokens);
      return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
    }
  },
  extensions: [{
    name: 'actionButton',
    level: 'inline' as const,
    start(src: string) { return src.match(/\[\[action:/)?.index },
    tokenizer(src: string): any {
      const rule = /^\[\[action:([a-zA-Z0-9-]+)\]\]/
      const match = rule.exec(src)
      if (match) {
        return {
          type: 'actionButton',
          raw: match[0],
          id: match[1]
        }
      }
    },
    renderer(token: any) {
      const actionId = (token as { id?: string }).id || ''
      return `<button class="cm-action-button" title="Action: ${actionId}" data-action-id="${actionId}">
        ${actionId}
      </button>`
    }
  } as any],
  gfm: true,
  breaks: true,
  async: false
})

export const renderMarkdown = async (content: string): Promise<string> => {
  return marked.parse(content) as string
}
