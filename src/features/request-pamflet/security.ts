import { createHash } from 'node:crypto'
import { readClientIp } from '@/core/security/login-rate-limit'
import { rateLimit } from '@/core/security/rate-limiter'

const REQUEST_LIMIT = 5
const REQUEST_WINDOW_SECONDS = 10 * 60

export function pamfletRequestClientIp(forwardedFor: string | null, realIp: string | null) {
  return readClientIp(forwardedFor, realIp)
}

export async function assertPamfletRequestRateLimit(ip: string) {
  const fingerprint = createHash('sha256').update(ip).digest('hex')
  await rateLimit(`public:pamflet-request:${fingerprint}`, REQUEST_LIMIT, REQUEST_WINDOW_SECONDS)
}
