import { redis } from './redis'
import { logger } from '../monitoring/logger'

class CacheService {
  private store: Map<string, { value: unknown; expiry: number | null }> = new Map()

  // Deteksi otomatis jika Redis tidak dikonfigurasi di environment lokal
  private isRedisDisabled = !redis || (process.env.NODE_ENV === 'development' && !process.env.UPSTASH_REDIS_REST_URL)

  /**
   * Menjalankan operasi Redis dengan batas waktu ketat agar tidak memblokir render lokal
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs = 500): Promise<T> {
    let timer: NodeJS.Timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Redis operation timed out')), timeoutMs)
    })
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (redis && !this.isRedisDisabled) {
      try {
        const stringValue = JSON.stringify(value)
        await this.executeWithTimeout(
          ttlSeconds ? redis.setex(key, ttlSeconds, stringValue) : redis.set(key, stringValue),
          500
        )
        return
      } catch {
        logger.warn('Redis cache set failed / timed out, falling back to memory cache', { key })
      }
    }
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    this.store.set(key, { value, expiry })
  }

  async get<T>(key: string): Promise<T | null> {
    if (redis && !this.isRedisDisabled) {
      try {
        const data = await this.executeWithTimeout(redis.get(key), 500)
        if (!data) return null
        return typeof data === 'string' ? JSON.parse(data) : (data as T)
      } catch {
        logger.warn('Redis cache get failed / timed out, falling back to memory cache', { key })
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
    if (redis && !this.isRedisDisabled) {
      try {
        await this.executeWithTimeout(redis.del(key), 500)
        return
      } catch {
        logger.warn('Redis cache delete failed / timed out, falling back to memory cache', { key })
      }
    }
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    if (redis && !this.isRedisDisabled) {
      try {
        await this.executeWithTimeout(redis.flushdb(), 500)
        return
      } catch (error) {
        logger.warn('Redis cache clear failed / timed out, falling back to memory cache', { error })
      }
    }
    this.store.clear()
  }

  // Helper untuk Rate Limiting (Simple token bucket / counter)
  async increment(key: string, ttlSeconds: number): Promise<number> {
    if (redis && !this.isRedisDisabled) {
      try {
        const current = Number(await this.executeWithTimeout(redis.incr(key), 500))
        if (current === 1) {
          await this.executeWithTimeout(redis.expire(key, ttlSeconds), 500)
        }
        return current
      } catch {
        logger.warn('Redis cache increment failed, falling back to memory cache', { key })
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
