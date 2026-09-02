import { describe, it, expect } from 'vitest'
import { generateTOC, generateHTML } from '../htmlGenerator'

describe('HTML & TOC Generator', () => {
  describe('generateTOC', () => {
    it('should generate hierarchical HTML TOC from markdown headings', () => {
      const markdown = `
# Title Level 1
Some intro text.
## Section Level 2
Details here.
### Subsection Level 3
Specific items.
      `.trim()

      const toc = generateTOC(markdown)
      expect(toc).toContain('<ul class="toc-root">')
      expect(toc).toContain('<a href="#title-level-1">Title Level 1</a>')
      expect(toc).toContain('<a href="#section-level-2">Section Level 2</a>')
      expect(toc).toContain('<a href="#subsection-level-3">Subsection Level 3</a>')
    })

    it('should return empty string when no headings exist', () => {
      const markdown = 'Just plain paragraph text.'
      const toc = generateTOC(markdown)
      expect(toc).toBe('')
    })
  })

  describe('generateHTML', () => {
    it('should generate a full standalone HTML document with theme variables and no CDN scripts', () => {
      const content = '<p>Rendered Markdown Content</p>'
      const html = generateHTML(content, 'Test Doc', { previewMaxWidth: '800px', previewFontScale: 1.2 })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<title>Test Doc</title>')
      expect(html).toContain('Rendered Markdown Content')
      expect(html).toContain('max-width: 800px')

      // Security: no third-party CDN scripts may be referenced
      expect(html).not.toContain('cdn.tailwindcss.com')
      expect(html).not.toContain('cdnjs.cloudflare.com')
      expect(html).not.toContain('cdn.jsdelivr.net')

      // Live preview references the local external runner
      expect(html).toContain('<script src="/preview.js" defer></script>')
    })

    it('should embed a self-contained inline runner for exported documents', () => {
      const content = '<p>Exported</p>'
      const html = generateHTML(content, 'Exported Doc', {}, '', 'dark', true)

      // Exported files must be self-contained (no reference to /preview.js)
      expect(html).not.toContain('src="/preview.js"')
      expect(html).toContain('<script>')
      expect(html).toContain('toc-toggle')
    })

    it('should escape the document title', () => {
      const content = '<p>Content</p>'
      const html = generateHTML(content, '</title><script>alert(1)</script>', {}, '', 'dark', false)

      expect(html).not.toContain('<script>alert(1)</script></title>')
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    })

    it('should escape TOC heading text', () => {
      const toc = generateTOC('## <img src=x onerror=alert(1)>')
      expect(toc).not.toContain('<img src=x')
      expect(toc).toContain('&lt;img')
    })

    it('should include TOC container and toggle button when TOC is provided', () => {
      const content = '<p>Content</p>'
      const toc = '<ul class="toc-root"><li><a href="#test">Test</a></li></ul>'
      const html = generateHTML(content, 'Doc With TOC', { previewShowTOC: true }, toc)

      expect(html).toContain('<button id="toc-toggle">')
      expect(html).toContain('<nav class="toc-sidebar">')
      expect(html).toContain(toc)
    })
  })
})
