/**
 * Anthropic Estimator - Uses Claude's count_tokens API
 *
 * API Documentation: https://docs.anthropic.com/en/api/counting-tokens
 */

import { invoke } from '@tauri-apps/api/core'
import type { ModelDefinition } from '../models'
import type { IEstimator, EstimatorResult } from './types'
import { EstimatorError } from './types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages/count_tokens'
const ANTHROPIC_VERSION = '2023-06-01'

export class AnthropicEstimator implements IEstimator {
  /**
   * Check if this estimator can handle the given model
   */
  canHandle(model: ModelDefinition): boolean {
    return model.provider === 'anthropic' && model.method === 'online'
  }

  /**
   * Get API key from secure storage
   */
  private async getApiKey(): Promise<string> {
    try {
      const apiKey = await invoke<string>('get_api_key', { provider: 'anthropic' })

      if (!apiKey || apiKey.trim() === '') {
        throw new EstimatorError(
          'MISSING_API_KEY',
          'Anthropic API key not configured. Set it in Settings > API Keys.'
        )
      }

      return apiKey
    } catch (error) {
      if (error instanceof EstimatorError) {
        throw error
      }
      throw new EstimatorError(
        'MISSING_API_KEY',
        'Failed to retrieve Anthropic API key. Set it in Settings > API Keys.'
      )
    }
  }

  /**
   * Estimate tokens using Anthropic's count_tokens API
   */
  async estimate(content: string, model: ModelDefinition): Promise<EstimatorResult> {
    const apiKey = await this.getApiKey()

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model.id,
          messages: [{ role: 'user', content: content }]
        })
      })

      if (!response.ok) {
        await this.handleErrorResponse(response)
      }

      const data = await response.json()

      return {
        tokens: data.input_tokens,
        method: 'online',
        model: model.id,
        cached: false
      }
    } catch (error) {
      if (error instanceof EstimatorError) {
        throw error
      }

      // Network or other fetch errors
      throw new EstimatorError(
        'NETWORK_ERROR',
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = ''

    try {
      const errorData = await response.json()
      errorMessage = errorData.error?.message || response.statusText
    } catch {
      errorMessage = response.statusText
    }

    switch (response.status) {
      case 401:
        throw new EstimatorError(
          'INVALID_API_KEY',
          'Invalid Anthropic API key. Check your key in Settings.',
          401
        )

      case 403:
        throw new EstimatorError(
          'INVALID_API_KEY',
          'API key does not have permission for this operation.',
          403
        )

      case 429:
        throw new EstimatorError(
          'RATE_LIMITED',
          'Anthropic API rate limit exceeded. Wait 60 seconds or use a local model.',
          429
        )

      case 400:
        throw new EstimatorError(
          'INVALID_REQUEST',
          `Invalid request: ${errorMessage}`,
          400
        )

      case 404:
        throw new EstimatorError(
          'MODEL_NOT_FOUND',
          `Model not found. The model ID may be incorrect.`,
          404
        )

      default:
        throw new EstimatorError(
          'UNKNOWN_ERROR',
          `Anthropic API error (${response.status}): ${errorMessage}`,
          response.status
        )
    }
  }
}

// Singleton instance
export const anthropicEstimator = new AnthropicEstimator()
