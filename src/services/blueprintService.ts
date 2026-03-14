import { extractCodeBlockInfo } from '../utils/codeBlockParams'

export interface BlueprintChunk {
  type: 'text' | 'code'
  content: string
  metadata: Record<string, any>
  language?: string
  params?: Record<string, any>
  rawParams?: string
}

export interface Blueprint {
  title: string
  generatedAt: string
  chunks: BlueprintChunk[]
}

/**
 * Parses markdown content into a structured Blueprint JSON.
 * - Text is chunked by Headers (#).
 * - Code blocks are treated as atomic chunks with metadata.
 */
export function generateBlueprint(content: string, title: string = 'Untitled'): Blueprint {
  const lines = content.split('\n')
  const chunks: BlueprintChunk[] = []
  
  let currentTextBuffer: string[] = []
  let currentCodeBuffer: string[] = []
  let inCodeBlock = false
  let codeBlockInfo = ''

  const flushText = () => {
    if (currentTextBuffer.length > 0) {
      const text = currentTextBuffer.join('\n').trim()
      if (text) {
        chunks.push({
          type: 'text',
          content: text,
          metadata: {}
        })
      }
      currentTextBuffer = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Check for Code Block Fence
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      if (inCodeBlock) {
        // Closing block
        const info = extractCodeBlockInfo(codeBlockInfo)
        chunks.push({
          type: 'code',
          content: currentCodeBuffer.join('\n'),
          language: info.language,
          params: info.params,
          rawParams: info.rawParams,
          metadata: info.params
        })

        currentCodeBuffer = []
        inCodeBlock = false
        codeBlockInfo = ''
      } else {
        // Opening block
        flushText() // Close any pending text chunk
        inCodeBlock = true
        codeBlockInfo = trimmed.slice(3).trim() // Remove ```
      }
      continue
    }

    if (inCodeBlock) {
      currentCodeBuffer.push(line)
    } else {
      // Check for Header (split text chunks)
      if (line.trim().startsWith('#')) {
        flushText()
        currentTextBuffer.push(line)
      } else {
        currentTextBuffer.push(line)
      }
    }
  }

  // Flush remaining text
  flushText()

  return {
    title,
    generatedAt: new Date().toISOString(),
    chunks
  }
}
