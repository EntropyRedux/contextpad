import { useEffect } from 'react'
import { useTabStore } from '../store/tabStore'
import { getCodeBlocksWithParameters } from '../utils/codeBlockDetection'

/**
 * Hook to detect code blocks with parameters in the active tab
 *
 * This is detection only - no actions are taken yet.
 * Future plans: Will be used for workflow automation and template actions.
 */
export function useCodeBlockDetection() {
  const activeTab = useTabStore(state => state.getActiveTab())

  useEffect(() => {
    if (!activeTab || !activeTab.content) return

    // Detect code blocks with parameters
    const blocksWithParams = getCodeBlocksWithParameters(activeTab.content)

    if (blocksWithParams.length > 0) {
      console.log(`[CodeBlock Detection] Found ${blocksWithParams.length} code block(s) with parameters:`)
      blocksWithParams.forEach((block, index) => {
        console.log(`  Block ${index + 1}:`, {
          language: block.language,
          parameters: block.parameters,
          lines: `${block.startLine}-${block.endLine}`,
          contentPreview: block.content.slice(0, 50) + (block.content.length > 50 ? '...' : '')
        })
      })
    }
  }, [activeTab?.content])
}
