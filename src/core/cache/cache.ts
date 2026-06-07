/**
 * Cache Service
 * 
 * Untuk saat ini menggunakan In-Memory Cache (Map).
 * Jika Redis sudah terpasang (misal package `ioredis`), service ini bisa 
 * diganti / diekspansi untuk menggunakan Redis Client.
 */

import { redis } from './redis'

class CacheService {
  private store: Map<string, { value: unknown; expiry: number | null }> = new Map()

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (redis) {
      const stringValue = JSON.stringify(value)
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, stringValue)
      } else {
        await redis.set(key, stringValue)
      }
      return
    }

    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    this.store.set(key, { value, expiry })
  }

  async get<T>(key: string): Promise<T | null> {
    if (redis) {
      const data = await redis.get(key)
      if (!data) return null
      return typeof data === 'string' ? JSON.parse(data) : data as T
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
      await redis.del(key)
      return
    }
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    if (redis) {
      await redis.flushdb()
      return
    }
    this.store.clear()
  }

  // Helper for Rate Limiting (Simple token bucket / counter)
  async increment(key: string, ttlSeconds: number): Promise<number> {
    if (redis) {
      const p = redis.pipeline()
      p.incr(key)
      p.expire(key, ttlSeconds)
      const results = await p.exec()
      return results[0] as number
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
