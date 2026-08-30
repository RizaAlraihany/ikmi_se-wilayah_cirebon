export function submissionPrefix(now = new Date()) {
  const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Jakarta' }).format(now)
  return `IKMI-KT-${year}`
}

export function nextSubmissionNumber(prefix: string, latest?: string) {
  const current = latest?.startsWith(`${prefix}-`) ? Number(latest.slice(prefix.length + 1)) : 0
  return `${prefix}-${String(Number.isSafeInteger(current) ? current + 1 : 1).padStart(4, '0')}`
}
