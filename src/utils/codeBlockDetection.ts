/**
 * Code block parameter detection utility
 *
 * Detects parameters in markdown code blocks (e.g., ```language param1 param2)
 * This is detection only - no actions are taken yet.
 *
 * Future plans: This will be used for workflow automation and template actions.
 */

export interface CodeBlockInfo {
  startLine: number
  endLine: number
  language: string
  parameters: string[]
  content: string
}

/**
 * Detects all code blocks with parameters in the given markdown content
 */
export function detectCodeBlocks(content: string): CodeBlockInfo[] {
  const lines = content.split('\n')
  const codeBlocks: CodeBlockInfo[] = []
  let currentBlock: Partial<CodeBlockInfo> | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Check for code block start
    if (trimmedLine.startsWith('```')) {
      if (!currentBlock) {
        // Start of a new code block
        const metadata = trimmedLine.slice(3).trim()
        const parts = metadata.split(/\s+/).filter(p => p.length > 0)

        currentBlock = {
          startLine: i + 1, // 1-indexed
          language: parts[0] || '',
          parameters: parts.slice(1),
          content: ''
        }
      } else {
        // End of current code block
        currentBlock.endLine = i + 1 // 1-indexed
        codeBlocks.push(currentBlock as CodeBlockInfo)
        currentBlock = null
      }
    } else if (currentBlock) {
      // Inside a code block, accumulate content
      if (currentBlock.content) {
        currentBlock.content += '\n' + line
      } else {
        currentBlock.content = line
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
  return detectCodeBlocks(content).filter(block => block.parameters.length > 0)
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
