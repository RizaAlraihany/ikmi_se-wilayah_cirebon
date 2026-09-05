import { createHash, randomUUID } from 'node:crypto'
import { cache } from '@/core/cache/cache'
import { readClientIp } from '@/core/security/login-rate-limit'
import { rateLimit } from '@/core/security/rate-limiter'
import type { VerifiedDocxImportManifest } from './docx-import'

const DOCX_DISCARD_RATE_WINDOW_SECONDS = 10 * 60
const DOCX_DISCARD_IP_LIMIT = 30
const DOCX_DISCARD_SESSION_LIMIT = 10
const DOCX_DISCARD_MANIFEST_LIMIT = 5
const DOCX_DISCARD_LOCK_SECONDS = 30

function fingerprint(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function consumedKey(sessionId: string) {
  return `docx-discard-consumed:${fingerprint(sessionId)}`
}

function lockKey(sessionId: string) {
  return `docx-discard-lock:${fingerprint(sessionId)}`
}

function remainingManifestTtlSeconds(issuedAt: number) {
  const remainingMs = issuedAt + 7 * 24 * 60 * 60 * 1000 - Date.now()
  return Math.max(1, Math.ceil(remainingMs / 1000))
}

export function docxDiscardClientIp(forwardedFor: string | null, realIp: string | null) {
  return readClientIp(forwardedFor, realIp)
}

export async function assertDocxDiscardRateLimit(ip: string, manifest: VerifiedDocxImportManifest, manifestToken: string) {
  await rateLimit(`public:docx-discard:ip:${fingerprint(ip)}`, DOCX_DISCARD_IP_LIMIT, DOCX_DISCARD_RATE_WINDOW_SECONDS)
  await rateLimit(`public:docx-discard:session:${fingerprint(manifest.sessionId)}`, DOCX_DISCARD_SESSION_LIMIT, DOCX_DISCARD_RATE_WINDOW_SECONDS)
  await rateLimit(`public:docx-discard:manifest:${fingerprint(manifestToken)}`, DOCX_DISCARD_MANIFEST_LIMIT, DOCX_DISCARD_RATE_WINDOW_SECONDS)
}

export async function isDocxDiscardConsumed(sessionId: string) {
  return (await cache.getSecurity<string>(consumedKey(sessionId))) !== null
}

export async function acquireDocxDiscardLock(sessionId: string) {
  const lockToken = randomUUID()
  const acquired = await cache.setIfAbsent(lockKey(sessionId), lockToken, DOCX_DISCARD_LOCK_SECONDS)
  return acquired ? lockToken : null
}

export async function markDocxDiscardConsumed(manifest: VerifiedDocxImportManifest) {
  await cache.setIfAbsent(consumedKey(manifest.sessionId), 'consumed', remainingManifestTtlSeconds(manifest.issuedAt))
}

export async function releaseDocxDiscardLock(sessionId: string, lockToken: string) {
  await cache.deleteIfValue(lockKey(sessionId), lockToken)
}
