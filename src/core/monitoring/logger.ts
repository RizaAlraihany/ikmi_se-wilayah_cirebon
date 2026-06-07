/**
 * Centralized Logger for Application.
 * 
 * In production, this can be integrated with Sentry (@sentry/nextjs)
 * or BetterStack simply by extending the methods here.
 */
import { env } from '../config/env'

const isProduction = env.NODE_ENV === 'production'

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    console.log(`[INFO] ${message}`, context || '')
  },

  warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[WARN] ${message}`, context || '')
  },

  error(error: Error | unknown, context?: Record<string, unknown>) {
    if (isProduction) {
      // TODO: Sentry.captureException(error, { extra: context })
    }
    
    console.error(`[ERROR]`, error, context || '')
  },

  fatal(error: Error | unknown, context?: Record<string, unknown>) {
    if (isProduction) {
      // TODO: Sentry.captureException(error, { level: 'fatal', extra: context })
    }

    console.error(`[FATAL] System might crash:`, error, context || '')
  }
}
