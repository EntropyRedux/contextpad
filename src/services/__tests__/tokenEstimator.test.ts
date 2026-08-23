import { describe, it, expect, beforeEach } from 'vitest'
import { tokenEstimatorService } from '../tokenEstimator/TokenEstimatorService'
import { MODEL_REGISTRY, getModelById, calculateCost, getDefaultModelId } from '../tokenEstimator/models'
import { localEstimator } from '../tokenEstimator/estimators/LocalEstimator'
import { tokenCache } from '../tokenEstimator/TokenCache'

describe('TokenEstimatorService & Ecosystem', () => {
  beforeEach(() => {
    tokenCache.clear()
    tokenEstimatorService.reset()
  })

  describe('Model Registry & Pricing', () => {
    it('should have standard models registered', () => {
      expect(MODEL_REGISTRY['gpt-4o']).toBeDefined()
      expect(MODEL_REGISTRY['claude-sonnet-4-5-20250929']).toBeDefined()
      expect(MODEL_REGISTRY['gemini-2.5-flash']).toBeDefined()
    })

    it('should calculate cost correctly based on token count', () => {
      const model = getModelById('gpt-4o')!
      // $2.50 per 1M tokens
      const cost = calculateCost(100000, model)
      expect(cost).toBe(0.25)
    })

    it('should return default model id', () => {
      expect(getDefaultModelId()).toBe('gpt-4o')
    })
  })

  describe('Local Estimator (tiktoken)', () => {
    it('should count tokens for text using local model', async () => {
      const model = getModelById('gpt-4o')!
      const result = await localEstimator.estimate('Hello, world! This is a test.', model)
      expect(result.tokens).toBeGreaterThan(0)
      expect(result.method).toBe('local')
      expect(result.model).toBe('gpt-4o')
    })

    it('should estimate partial content for large text', async () => {
      const tokens = await localEstimator.estimatePartial('Sample text', 'o200k_base')
      expect(tokens).toBeGreaterThan(0)
    })
  })

  describe('Token Cache', () => {
    it('should store and retrieve token estimation results', () => {
      const content = 'Test cache content'
      const modelId = 'gpt-4o'
      const entry = {
        tokens: 42,
        cost: 0.0001,
        method: 'local' as const,
        model: modelId
      }

      tokenCache.set(content, modelId, entry)
      const cached = tokenCache.get(content, modelId)

      expect(cached).toBeDefined()
      expect(cached?.tokens).toBe(42)
    })

    it('should invalidate cache when content or model differs', () => {
      tokenCache.set('Content A', 'gpt-4o', {
        tokens: 10,
        cost: 0.001,
        method: 'local',
        model: 'gpt-4o'
      })

      expect(tokenCache.get('Content B', 'gpt-4o')).toBeNull()
      expect(tokenCache.get('Content A', 'gpt-5.2')).toBeNull()
    })
  })

  describe('Token Estimator Service State & Subscriptions', () => {
    it('should notify subscribers on immediate calculation', async () => {
      let latestStatus: string = ''
      let latestTokens: number | null = null

      const unsubscribe = tokenEstimatorService.subscribe((state) => {
        latestStatus = state.status
        latestTokens = state.tokens
      })

      tokenEstimatorService.calculateImmediate('Hello world', 'gpt-4o')

      // Wait a tick for async calculation
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(latestStatus).toBe('ready')
      expect(latestTokens).toBeGreaterThan(0)

      unsubscribe()
    })
  })
})
