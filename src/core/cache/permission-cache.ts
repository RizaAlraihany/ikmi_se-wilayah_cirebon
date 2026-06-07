// A simple memory cache for permissions as a fallback. 
// Can be replaced with Redis later.

interface CacheEntry {
  value: boolean
  expiry: number
}

const cache = new Map<string, CacheEntry>()

export const permissionCache = {
  get: async (key: string): Promise<boolean | null> => {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      cache.delete(key)
      return null
    }
    return entry.value
  },

  set: async (key: string, value: boolean, ttlSeconds: number = 300): Promise<void> => {
    // Simple eviction to prevent memory leak
    if (cache.size > 2000) {
      const now = Date.now()
      for (const [k, item] of cache.entries()) {
        if (item.expiry < now) {
          cache.delete(k)
        }
      }
      if (cache.size > 2000) {
        cache.clear()
      }
    }

    cache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    })
  },

  invalidate: async (key: string): Promise<void> => {
    cache.delete(key)
  }
}
