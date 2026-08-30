import { ZodError } from 'zod'
import { logger } from '@/core/monitoring/logger'
import { RateLimitError } from '@/core/security/rate-limiter'
import { AppError } from './custom-errors'

/** Keeps expected validation/authorization feedback while hiding infrastructure details. */
export function safeActionError(error: unknown, fallback: string, workflow: string) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message || 'Data tidak valid.'
  }
  if (error instanceof AppError && error.statusCode < 500) return error.message
  if (error instanceof RateLimitError) return error.message

  logger.error(error, { workflow })
  return fallback
}
