/**
 * Google Estimator - Uses Gemini's countTokens API
 *
 * API Documentation: https://ai.google.dev/gemini-api/docs/tokens
 */

import { invoke } from '@tauri-apps/api/core'
import type { ModelDefinition } from '../models'
import type { IEstimator, EstimatorResult } from './types'
import { EstimatorError } from './types'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export class GoogleEstimator implements IEstimator {
  /**
   * Check if this estimator can handle the given model
   */
  canHandle(model: ModelDefinition): boolean {
    return model.provider === 'google' && model.method === 'online'
  }

  /**
   * Get API key from secure storage
   */
  private async getApiKey(): Promise<string> {
    try {
      const apiKey = await invoke<string>('get_api_key', { provider: 'google' })

      if (!apiKey || apiKey.trim() === '') {
        throw new EstimatorError(
          'MISSING_API_KEY',
          'Google API key not configured. Set it in Settings > API Keys.'
        )
      }

      return apiKey
    } catch (error) {
      if (error instanceof EstimatorError) {
        throw error
      }
      throw new EstimatorError(
        'MISSING_API_KEY',
        'Failed to retrieve Google API key. Set it in Settings > API Keys.'
      )
    }
  }

  /**
   * Estimate tokens using Google's countTokens API
   */
  async estimate(content: string, model: ModelDefinition): Promise<EstimatorResult> {
    const apiKey = await this.getApiKey()

    const url = `${GEMINI_API_BASE}/${model.id}:countTokens?key=${apiKey}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: content }]
            }
          ]
        })
      })

      if (!response.ok) {
        await this.handleErrorResponse(response)
      }

      const data = await response.json()

      return {
        tokens: data.totalTokens,
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
      case 400:
        // Google returns 400 for invalid API keys
        if (errorMessage.toLowerCase().includes('api key')) {
          throw new EstimatorError(
            'INVALID_API_KEY',
            'Invalid Google API key. Check your key in Settings.',
            400
          )
        }
        throw new EstimatorError(
          'INVALID_REQUEST',
          `Invalid request: ${errorMessage}`,
          400
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
          'Google API rate limit exceeded. Wait 60 seconds or use a local model.',
          429
        )

      case 404:
        throw new EstimatorError(
          'MODEL_NOT_FOUND',
          `Model "${response.url.split('/').pop()?.split(':')[0]}" not found.`,
          404
        )

      default:
        throw new EstimatorError(
          'UNKNOWN_ERROR',
          `Google API error (${response.status}): ${errorMessage}`,
          response.status
        )
    }
  }
}

// Singleton instance
export const googleEstimator = new GoogleEstimator()
