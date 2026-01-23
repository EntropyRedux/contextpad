import type { ModelDefinition } from '../models'
import type { IEstimator, EstimatorResult } from './types'
import { EstimatorError } from './types'
import { localEstimator } from './LocalEstimator'
import { getModelById } from '../models'

export class CustomEstimator implements IEstimator {
  /**
   * Check if this estimator can handle the given model
   */
  canHandle(model: ModelDefinition): boolean {
    return model.method === 'custom'
  }

  /**
   * Estimate tokens using custom strategies
   */
  async estimate(content: string, model: ModelDefinition): Promise<EstimatorResult> {
    if (model.method !== 'custom') {
      throw new EstimatorError('UNKNOWN_ERROR', 'CustomEstimator called with non-custom model')
    }

    const strategy = model.calculationType || 'char_ratio'
    let tokens = 0

    try {
      switch (strategy) {
        case 'inherit':
          if (!model.baseModelId) {
             throw new Error('Base model ID required for inherit strategy')
          }
          // Fetch base model definition
          // Note: This relies on the registry or we assume base is a standard model
          // Ideally we resolve this via the service, but here we can try to look it up 
          // or just use localEstimator if we know it's a tiktoken model.
          // For simplicity, we assume 'inherit' typically implies inheriting a Tiktoken encoding.
          // If the user picked an online model to inherit from, we can't easily proxy that here without access to the service/API keys.
          // So we restrict 'inherit' to using LocalEstimator (tiktoken) logic for now.
          
          // We can construct a temporary model def for the local estimator
          const baseEncoding = 'o200k_base' // Default fallback
          const tempModel: ModelDefinition = {
             ...model,
             method: 'local',
             encoding: model.baseModelId === 'gpt-4o' ? 'o200k_base' : 'cl100k_base' 
             // Logic to resolve encoding from baseModelId would be better if exposed
          }
          
          // Better: Check if the base model exists in registry
          const baseModel = getModelById(model.baseModelId)
          if (baseModel && baseModel.method === 'local') {
             return localEstimator.estimate(content, baseModel)
          } else {
             // Fallback to simple encoding if unknown or online
             return localEstimator.estimate(content, { ...model, method: 'local', encoding: 'o200k_base' })
          }

        case 'char_ratio':
          const divisor = model.ratio || 4
          tokens = Math.ceil(content.length / divisor)
          break

        case 'fixed_per_word':
          const multiplier = model.ratio || 1
          const words = content.trim().split(/\s+/).length
          tokens = Math.ceil(words * multiplier)
          break
          
        default:
          tokens = Math.ceil(content.length / 4)
      }

      return {
        tokens,
        method: 'custom',
        model: model.id,
        cached: false
      }
    } catch (error) {
       throw new EstimatorError(
        'CALCULATION_ERROR',
        `Custom estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

export const customEstimator = new CustomEstimator()
