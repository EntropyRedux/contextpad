/**
 * Local Estimator - Uses tiktoken for offline token counting
 *
 * Supports OpenAI models with cached encoder instances
 * Falls back to cl100k_base if specific encoding unavailable
 */

import { getEncoding, Tiktoken } from 'js-tiktoken'
import type { ModelDefinition, TiktokenEncoding } from '../models'
import type { IEstimator, EstimatorResult } from './types'
import { EstimatorError } from './types'

export class LocalEstimator implements IEstimator {
  // Cache encoder instances to avoid re-initialization
  private encoderCache = new Map<TiktokenEncoding, Tiktoken>()

  /**
   * Get or create an encoder for the specified encoding
   */
  private getEncoder(encoding: TiktokenEncoding): Tiktoken {
    let encoder = this.encoderCache.get(encoding)

    if (!encoder) {
      try {
        encoder = getEncoding(encoding)
        this.encoderCache.set(encoding, encoder)
      } catch (error) {
        // Fallback to cl100k_base if requested encoding unavailable
        console.warn(`Encoding ${encoding} not available, falling back to cl100k_base`)

        encoder = this.encoderCache.get('cl100k_base')
        if (!encoder) {
          encoder = getEncoding('cl100k_base')
          this.encoderCache.set('cl100k_base', encoder)
        }
      }
    }

    return encoder
  }

  /**
   * Check if this estimator can handle the given model
   */
  canHandle(model: ModelDefinition): boolean {
    return model.method === 'local' && !!model.encoding
  }

  /**
   * Estimate tokens using tiktoken
   */
  async estimate(content: string, model: ModelDefinition): Promise<EstimatorResult> {
    if (!model.encoding) {
      throw new EstimatorError(
        'ENCODING_ERROR',
        `Model ${model.id} does not have a tiktoken encoding defined`
      )
    }

    try {
      const encoder = this.getEncoder(model.encoding)
      const tokens = encoder.encode(content)

      return {
        tokens: tokens.length,
        method: 'local',
        model: model.id,
        cached: false
      }
    } catch (error) {
      throw new EstimatorError(
        'ENCODING_ERROR',
        `Failed to encode content: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Estimate tokens for a partial content (used for large document approximation)
   * @param content - The text content
   * @param encoding - The tiktoken encoding to use
   * @returns Token count for the content
   */
  async estimatePartial(content: string, encoding: TiktokenEncoding = 'o200k_base'): Promise<number> {
    try {
      const encoder = this.getEncoder(encoding)
      const tokens = encoder.encode(content)
      return tokens.length
    } catch (error) {
      throw new EstimatorError(
        'ENCODING_ERROR',
        `Failed to encode content: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Free encoder resources (call when done with estimator)
   */
  dispose(): void {
    this.encoderCache.clear()
  }
}

// Singleton instance
export const localEstimator = new LocalEstimator()
