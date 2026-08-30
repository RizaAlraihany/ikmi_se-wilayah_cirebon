import { cache } from '@/core/cache/cache'
import {
  assertLoginRateLimit,
  readClientIp,
  resetSuccessfulLoginRateLimit,
} from '@/core/security/login-rate-limit'
import { RateLimitError } from '@/core/security/rate-limiter'

describe('login rate limiting', () => {
  beforeEach(async () => {
    await cache.clear()
  })

  it('uses the first forwarded address and a real-IP fallback', () => {
    expect(readClientIp('203.0.113.1, 10.0.0.1', '198.51.100.2')).toBe('203.0.113.1')
    expect(readClientIp(null, '198.51.100.2')).toBe('198.51.100.2')
  })

  it('blocks a repeated password-guessing burst for one identifier', async () => {
    const email = 'admin@example.test'
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(assertLoginRateLimit('203.0.113.10', email)).resolves.toBeUndefined()
    }

    await expect(assertLoginRateLimit('203.0.113.10', email)).rejects.toBeInstanceOf(RateLimitError)
  })

  it('clears the identifier throttle after a successful login without clearing the IP throttle', async () => {
    const email = 'admin@example.test'
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await assertLoginRateLimit('203.0.113.11', email)
    }

    await resetSuccessfulLoginRateLimit(email)

    await expect(assertLoginRateLimit('203.0.113.11', email)).resolves.toBeUndefined()
  })
})
