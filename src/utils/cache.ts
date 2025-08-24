/**
 * Cache Service voor performance optimalisatie
 *
 * Deze service biedt een eenvoudige caching layer voor statische data
 * om database queries te verminderen en response tijden te verbeteren.
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minuten
  private stats = {
    hits: 0,
    misses: 0,
  }

  /**
   * Haal data op uit cache of voer fetchFn uit als data niet in cache is
   */
  async get<T>(key: string, fetchFn: () => Promise<T>, ttl = this.DEFAULT_TTL): Promise<T> {
    const cached = this.cache.get(key)

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.stats.hits++
      return cached.data as T
    }

    this.stats.misses++
    const data = await fetchFn()
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
    return data
  }

  /**
   * Invalideer cache entries die matchen met het gegeven pattern
   */
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Verwijder alle cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Verwijder verouderde cache entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Haal cache statistieken op
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses),
      size: this.cache.size,
    }
  }

  /**
   * Reset cache statistieken
   */
  resetStats(): void {
    this.stats.hits = 0
    this.stats.misses = 0
  }
}

// Export een singleton instance
export const cacheService = new CacheService()

// Voer periodiek cleanup uit
setInterval(() => {
  cacheService.cleanup()
}, 60 * 1000) // Elke minuut
