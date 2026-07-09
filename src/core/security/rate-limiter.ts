import { cache } from '../cache/cache'
import { logger } from '../monitoring/logger'

export class RateLimitError extends Error {
  constructor(message: string = 'Terlalu banyak permintaan. Silakan coba lagi nanti.') {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * Membatasi jumlah permintaan dari sebuah key (contoh: IP atau User ID).
 * @param key Identifier unik untuk rate limit
 * @param limit Batas maksimal permintaan dalam window tersebut
 * @param windowSeconds Durasi window dalam detik
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  const current = await cache.increment(`ratelimit:${key}`, windowSeconds)
  if (current > limit) {
    logger.warn('Rate limit exceeded', { key, limit, windowSeconds, current })
    throw new RateLimitError()
  }
}
