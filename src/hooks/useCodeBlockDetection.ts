import { useEffect } from 'react'
import { useTabStore } from '../store/tabStore'

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

    // blocksWithParams available for future workflow automation
  }, [activeTab?.content])
}
