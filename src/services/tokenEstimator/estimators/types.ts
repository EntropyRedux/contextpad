/**
 * Shared types for token estimators
 */

import type { ModelDefinition } from '../models'

/**
 * Result from an estimator calculation
 */
export interface EstimatorResult {
  tokens: number
  method: 'local' | 'online'
  model: string
  cached: boolean
}

/**
 * Error types for better error handling
 */
export type EstimatorErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'MODEL_NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'ENCODING_ERROR'
  | 'UNKNOWN_ERROR'

export class EstimatorError extends Error {
  code: EstimatorErrorCode
  statusCode?: number

  constructor(code: EstimatorErrorCode, message: string, statusCode?: number) {
    super(message)
    this.name = 'EstimatorError'
    this.code = code
    this.statusCode = statusCode
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case 'MISSING_API_KEY':
        return 'API key required'
      case 'INVALID_API_KEY':
        return 'Invalid API key'
      case 'RATE_LIMITED':
        return 'Rate limited - wait 60s'
      case 'NETWORK_ERROR':
        return 'Network error'
      case 'MODEL_NOT_FOUND':
        return 'Model not found'
      case 'INVALID_REQUEST':
        return 'Invalid request'
      case 'ENCODING_ERROR':
        return 'Encoding error'
      default:
        return 'Calculation failed'
    }
  }
}

/**
 * Interface that all estimators must implement
 */
export interface IEstimator {
  /**
   * Estimate token count for the given content
   * @param content - The text content to estimate
   * @param model - The model definition
   * @returns Promise resolving to EstimatorResult
   * @throws EstimatorError on failure
   */
  estimate(content: string, model: ModelDefinition): Promise<EstimatorResult>

  /**
   * Check if this estimator can handle the given model
   */
  canHandle(model: ModelDefinition): boolean
}
