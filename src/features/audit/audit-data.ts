const REDACTED = '[REDACTED]'
const MAX_DEPTH = 8
const MAX_ARRAY_ITEMS = 50
const MAX_OBJECT_KEYS = 100
const MAX_STRING_LENGTH = 2000

const sensitiveKeyPattern = /(?:password|passcode|secret|token|authorization|cookie|session|private.?key|passwordHash|filePublicId|documentPublicId|attachmentPublicId|revisionTokenHash)/i

function structuredString(value: string): unknown | undefined {
  const normalized = value.trim()
  if (!(normalized.startsWith('{') || normalized.startsWith('['))) return undefined
  try {
    return JSON.parse(normalized)
  } catch {
    return undefined
  }
}

export function redactAuditValue(value: unknown, depth = 0): unknown {
  if (depth >= MAX_DEPTH) return '[MAX_DEPTH]'
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') {
    const nested = structuredString(value)
    if (nested !== undefined) return redactAuditValue(nested, depth + 1)
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...` : value
  }
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => redactAuditValue(item, depth + 1))
    if (value.length > MAX_ARRAY_ITEMS) items.push(`[${value.length - MAX_ARRAY_ITEMS} item lainnya]`)
    return items
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).slice(0, MAX_OBJECT_KEYS)
    const result: Record<string, unknown> = {}
    for (const [key, nestedValue] of entries) {
      result[key] = sensitiveKeyPattern.test(key) ? REDACTED : redactAuditValue(nestedValue, depth + 1)
    }
    if (Object.keys(value).length > MAX_OBJECT_KEYS) result.__truncated__ = true
    return result
  }
  return String(value)
}

export function serializeAuditData(value: unknown) {
  return JSON.stringify(redactAuditValue(value))
}

export function parseAuditData(value: string | null) {
  if (!value) return null
  try {
    return redactAuditValue(JSON.parse(value))
  } catch {
    // Historical unstructured payloads are not rendered because they cannot
    // be inspected safely for nested credentials.
    return '[UNSTRUCTURED_DATA_REDACTED]'
  }
}
