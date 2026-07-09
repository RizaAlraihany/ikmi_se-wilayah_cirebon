import { redis } from './redis'
import { logger } from '../monitoring/logger'

class CacheService {
  private store: Map<string, { value: unknown; expiry: number | null }> = new Map()

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (redis) {
      try {
        const stringValue = JSON.stringify(value)
        if (ttlSeconds) {
          await redis.setex(key, ttlSeconds, stringValue)
        } else {
          await redis.set(key, stringValue)
        }
        return
      } catch (error) {
        logger.warn('Redis cache set failed, falling back to memory cache', { key, error })
      }
    }

    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    this.store.set(key, { value, expiry })
  }

  async get<T>(key: string): Promise<T | null> {
    if (redis) {
      try {
        const data = await redis.get(key)
        if (!data) return null
        return typeof data === 'string' ? JSON.parse(data) : data as T
      } catch (error) {
        logger.warn('Redis cache get failed, falling back to memory cache', { key, error })
      }
    }

    const item = this.store.get(key)
    if (!item) return null

    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key)
      return null
    }

    return item.value as T
  }

  async del(key: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(key)
        return
      } catch (error) {
        logger.warn('Redis cache delete failed, falling back to memory cache', { key, error })
      }
    }
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    if (redis) {
      try {
        await redis.flushdb()
        return
      } catch (error) {
        logger.warn('Redis cache clear failed, falling back to memory cache', { error })
      }
    }
    this.store.clear()
  }

  // Helper for Rate Limiting (Simple token bucket / counter)
  async increment(key: string, ttlSeconds: number): Promise<number> {
    if (redis) {
      try {
        const p = redis.pipeline()
        p.incr(key)
        p.expire(key, ttlSeconds)
        const results = await p.exec()
        return Number(results[0] ?? 0)
      } catch (error) {
        logger.warn('Redis cache increment failed, falling back to memory cache', { key, error })
      }
    }

    const item = this.store.get(key)
    const now = Date.now()
    
    if (!item || (item.expiry && now > item.expiry)) {
      this.store.set(key, { value: 1, expiry: now + ttlSeconds * 1000 })
      return 1
    }

    const newValue = (item.value as number) + 1
    this.store.set(key, { value: newValue, expiry: item.expiry })
    return newValue
  }
}

export const cache = new CacheService()
