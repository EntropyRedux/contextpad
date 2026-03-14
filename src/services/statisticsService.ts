/**
 * Statistics Service - Basic document statistics
 *
 * NOTE: Token calculation has been moved to the TokenEstimator service.
 * This service now only handles basic stats (characters, words, lines).
 *
 * For token calculation, use:
 * import { tokenEstimator } from './tokenEstimator'
 */

export interface DocumentStats {
  characters: number
  words: number
  lines: number
}

export class StatisticsService {
  /**
   * Calculate basic document statistics
   * Fast, synchronous operation
   */
  calculateStats(content: string): DocumentStats {
    return {
      characters: content.length,
      words: this.countWords(content),
      lines: content.split('\n').length
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text.trim()) return 0
    return text.trim().split(/\s+/).filter(Boolean).length
  }
}

export const statistics = new StatisticsService()
