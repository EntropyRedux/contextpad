import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../markdownRenderer'

describe('renderMarkdown sanitization', () => {
  it('strips script tags from markdown content', async () => {
    const html = await renderMarkdown('<p>safe</p><script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('safe')
  })

  it('strips inline event handlers', async () => {
    const html = await renderMarkdown('<img src=x onerror="alert(1)">')
    expect(html).not.toContain('onerror')
  })

  it('removes javascript: URLs', async () => {
    const html = await renderMarkdown('<a href="javascript:alert(1)">click</a>')
    expect(html).not.toContain('javascript:')
  })

  it('keeps safe markdown output (headings, links, code)', async () => {
    const html = await renderMarkdown('# Heading\n\n[link](https://example.com)\n\n```js\nconst a = 1\n```')
    expect(html).toContain('<h1')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('<pre><code')
  })
})