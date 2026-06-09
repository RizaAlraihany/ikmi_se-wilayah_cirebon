import { env } from '../config/env'

const isProduction = env.NODE_ENV === 'production'

type LogLevel = 'info' | 'warn' | 'error' | 'fatal'
type LogContext = Record<string, unknown>

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isProduction ? undefined : error.stack,
    }
  }

  return { message: String(error) }
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    ...context,
  }

  const line = JSON.stringify(payload)

  if (level === 'error' || level === 'fatal') {
    console.error(line)
    return
  }

  if (level === 'warn') {
    console.warn(line)
    return
  }

  console.log(line)
}

export const logger = {
  info(message: string, context?: LogContext) {
    write('info', message, context)
  },

  warn(message: string, context?: LogContext) {
    write('warn', message, context)
  },

  error(error: Error | unknown, context?: LogContext) {
    if (isProduction) {
      // TODO: Sentry.captureException(error, { extra: context })
    }

    write('error', 'Application error', {
      ...context,
      error: serializeError(error),
    })
  },

  fatal(error: Error | unknown, context?: LogContext) {
    if (isProduction) {
      // TODO: Sentry.captureException(error, { level: 'fatal', extra: context })
    }

    write('fatal', 'Fatal application error', {
      ...context,
      error: serializeError(error),
    })
  },

  request(context: {
    method: string
    path: string
    status?: number
    userId?: string
    durationMs?: number
  }) {
    write('info', 'request', context)
  },

  workflow(event: string, context?: LogContext) {
    write('info', 'workflow.event', { event, ...context })
  },

  automation(handler: string, context?: LogContext) {
    write('info', 'automation.handler', { handler, ...context })
  },
}
