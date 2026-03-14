/**
 * Token Cache - LRU cache with TTL for token calculation results
 *
 * Features:
 * - DJB2 hash algorithm for consistent key generation
 * - Content length salt to prevent collisions
 * - TTL expiration (default 60 seconds)
 * - LRU eviction when max capacity reached
 */

export interface CachedResult {
  tokens: number
  method: 'local' | 'online'
  model: string
  cost: number
  timestamp: number
}

export class TokenCache {
  private cache = new Map<string, CachedResult>()
  private readonly maxSize: number
  private readonly ttlMs: number

  constructor(maxSize = 100, ttlMs = 60000) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  /**
   * Generate a cache key from content and model ID
   * Uses DJB2 hash + content length to minimize collisions
   */
  private getCacheKey(content: string, modelId: string): string {
    const hash = this.djb2Hash(content)
    return `${hash}-${content.length}-${modelId}`
  }

  /**
   * DJB2 hash algorithm
   * For large strings, samples every Nth character for performance
   */
  private djb2Hash(str: string): string {
    let hash = 5381

    // For strings > 10k chars, sample every ~1000th character
    // This balances collision resistance with performance
    const step = str.length > 10000 ? Math.max(1, Math.floor(str.length / 1000)) : 1

    for (let i = 0; i < str.length; i += step) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i)
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36)
  }

  /**
   * Get a cached result if it exists and hasn't expired
   */
  get(content: string, modelId: string): CachedResult | null {
    const key = this.getCacheKey(content, modelId)
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    // Check TTL
    const age = Date.now() - cached.timestamp
    if (age > this.ttlMs) {
      this.cache.delete(key)
      return null
    }

    // Move to end for LRU (delete and re-add)
    this.cache.delete(key)
    this.cache.set(key, cached)

    return cached
  }

  /**
   * Store a result in the cache
   */
  set(content: string, modelId: string, result: Omit<CachedResult, 'timestamp'>): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    const key = this.getCacheKey(content, modelId)
    this.cache.set(key, {
      ...result,
      timestamp: Date.now()
    })
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove expired entries (can be called periodically)
   */
  prune(): number {
    const now = Date.now()
    let pruned = 0

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttlMs) {
        this.cache.delete(key)
        pruned++
      }
    }

    return pruned
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs
    }
  }
}

// Singleton instance
export const tokenCache = new TokenCache()
