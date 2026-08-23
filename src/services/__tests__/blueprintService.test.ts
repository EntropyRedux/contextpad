import { describe, it, expect } from 'vitest'
import { generateBlueprint } from '../blueprintService'

describe('BlueprintService', () => {
  it('should generate a basic blueprint from text and headers', () => {
    const markdown = `# Introduction\nThis is the intro section.\n## Details\nMore details here.`
    const blueprint = generateBlueprint(markdown, 'Doc Blueprint')

    expect(blueprint.title).toBe('Doc Blueprint')
    expect(blueprint.chunks.length).toBeGreaterThanOrEqual(2)
    expect(blueprint.chunks[0].type).toBe('text')
    expect(blueprint.chunks[0].content).toContain('# Introduction')
  })

  it('should treat code blocks with parameters as atomic code chunks', () => {
    const markdown = `
# Code Section

\`\`\`python {ai_ignore, role="system"}
def main():
    print("Hello ContextPad")
\`\`\`

Ending text paragraph.
    `
    const blueprint = generateBlueprint(markdown.trim(), 'Code Blueprint')

    const codeChunk = blueprint.chunks.find(c => c.type === 'code')
    expect(codeChunk).toBeDefined()
    expect(codeChunk?.language).toBe('python')
    expect(codeChunk?.params?.ai_ignore).toBe(true)
    expect(codeChunk?.params?.role).toBe('system')
    expect(codeChunk?.content).toContain('def main():')
  })

  it('should handle empty content cleanly', () => {
    const blueprint = generateBlueprint('', 'Empty')
    expect(blueprint.chunks).toEqual([])
  })
})
