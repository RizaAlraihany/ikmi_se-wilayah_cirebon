import { createHash } from 'crypto'
import { rateLimit, resetRateLimit } from './rate-limiter'

const LOGIN_IP_LIMIT = 25
const LOGIN_IP_WINDOW_SECONDS = 5 * 60
const LOGIN_IDENTIFIER_SHORT_LIMIT = 5
const LOGIN_IDENTIFIER_SHORT_WINDOW_SECONDS = 5 * 60
const LOGIN_IDENTIFIER_LONG_LIMIT = 15
const LOGIN_IDENTIFIER_LONG_WINDOW_SECONDS = 60 * 60

function fingerprint(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function identifierKey(email: string) {
  return `auth:login:identifier:${fingerprint(email)}`
}

function ipKey(ip: string) {
  return `auth:login:ip:${fingerprint(ip)}`
}

/**
 * Uses a short and long identifier window. A burst is stopped quickly, while
 * repeated failures are throttled for longer without storing email/IP in cache
 * keys or logs.
 */
export async function assertLoginRateLimit(ip: string, email: string) {
  const identifier = identifierKey(email)

  await Promise.all([
    rateLimit(ipKey(ip), LOGIN_IP_LIMIT, LOGIN_IP_WINDOW_SECONDS),
    rateLimit(`${identifier}:short`, LOGIN_IDENTIFIER_SHORT_LIMIT, LOGIN_IDENTIFIER_SHORT_WINDOW_SECONDS),
    rateLimit(`${identifier}:long`, LOGIN_IDENTIFIER_LONG_LIMIT, LOGIN_IDENTIFIER_LONG_WINDOW_SECONDS),
  ])
}

export async function resetSuccessfulLoginRateLimit(email: string) {
  const identifier = identifierKey(email)
  await Promise.all([
    resetRateLimit(`${identifier}:short`),
    resetRateLimit(`${identifier}:long`),
  ])
}

export function readClientIp(forwardedFor: string | null, realIp: string | null) {
  const candidate = forwardedFor?.split(',')[0]?.trim() || realIp?.trim() || 'unknown'
  return candidate.slice(0, 128)
}
