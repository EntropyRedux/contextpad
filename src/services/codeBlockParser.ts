export interface CodeBlockParams {
  [key: string]: string | number | boolean
}

export interface ParsedCodeBlock {
  language: string
  params: CodeBlockParams
  content: string
  fullMatch: string
}

export function parseCodeBlocks(text: string): ParsedCodeBlock[] {
  const regex = /```(\w+)(?:\s*\{([^}]*)\})?\n([\s\S]*?)```/g
  const blocks: ParsedCodeBlock[] = []

  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, language, paramsStr, content] = match as unknown as string[]

    blocks.push({
      language,
      params: paramsStr ? parseParams(paramsStr) : {},
      content,
      fullMatch
    })
  }

  return blocks
}

function parseParams(paramsStr: string): CodeBlockParams {
  const params: CodeBlockParams = {}
  const pairs = paramsStr.split(',')

  for (const pair of pairs) {
    const [key, value] = pair.split(':').map(s => s.trim())
    if (key && value) {
      if (value === 'true') params[key] = true
      else if (value === 'false') params[key] = false
      else if (!isNaN(Number(value))) params[key] = Number(value)
      else params[key] = value.replace(/['"]/g, '')
    }
  }

  return params
}
