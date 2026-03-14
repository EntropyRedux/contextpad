/**
 * Code block parameter detection utility
 *
 * Detects parameters in markdown code blocks (e.g., ```language {param=value})
 * 
 * REFACTORED: Now uses the robust parser from codeBlockParams.ts
 */

import { extractCodeBlockInfo, CodeBlockParams } from './codeBlockParams'

export interface CodeBlockInfo {
  startLine: number
  endLine: number
  language: string
  parameters: CodeBlockParams // Updated to use structured params
  content: string
}

/**
 * Detects all code blocks with parameters in the given markdown content
 */
export function detectCodeBlocks(content: string): CodeBlockInfo[] {
  // Normalize line endings
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const codeBlocks: CodeBlockInfo[] = []
  let currentBlock: Partial<CodeBlockInfo> | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Check for code block start: ``` or ~~~
    const startMatch = trimmedLine.match(/^(`{3,}|~{3,})(.*)$/)

    if (startMatch && !currentBlock) {
      // Start of a new code block
      const infoString = startMatch[2].trim()
      const parsed = extractCodeBlockInfo(infoString)

      currentBlock = {
        startLine: i + 1, // 1-indexed
        language: parsed.language,
        parameters: parsed.params,
        content: ''
      }
    } else if (currentBlock) {
      // Check for code block end (must start with same fence char, ideally we track fence length but simplifying for now)
      if (trimmedLine.startsWith('```') || trimmedLine.startsWith('~~~')) {
        currentBlock.endLine = i + 1 // 1-indexed
        codeBlocks.push(currentBlock as CodeBlockInfo)
        currentBlock = null
      } else {
        // Inside a code block, accumulate content
        if (currentBlock.content) {
          currentBlock.content += '\n' + line
        } else {
          currentBlock.content = line
        }
      }
    }
  }

  // Handle unclosed code block
  if (currentBlock) {
    currentBlock.endLine = lines.length
    codeBlocks.push(currentBlock as CodeBlockInfo)
  }

  return codeBlocks
}

/**
 * Gets code blocks that have at least one parameter
 */
export function getCodeBlocksWithParameters(content: string): CodeBlockInfo[] {
  return detectCodeBlocks(content).filter(block => Object.keys(block.parameters).length > 0)
}

/**
 * Checks if a given line is inside a code block
 */
export function isLineInCodeBlock(content: string, lineNumber: number): boolean {
  const blocks = detectCodeBlocks(content)
  return blocks.some(block =>
    lineNumber >= block.startLine && lineNumber <= block.endLine
  )
}

/**
 * Gets the code block at a specific line, if any
 */
export function getCodeBlockAtLine(content: string, lineNumber: number): CodeBlockInfo | null {
  const blocks = detectCodeBlocks(content)
  return blocks.find(block =>
    lineNumber >= block.startLine && lineNumber <= block.endLine
  ) || null
}