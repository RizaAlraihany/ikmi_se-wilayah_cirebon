import { PrismaClient } from '@prisma/client'
import { env } from '../config/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const shouldLogQueries = process.env.PRISMA_LOG_QUERIES === 'true'

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? shouldLogQueries
          ? ['query', 'error', 'warn']
          : ['error', 'warn']
        : ['error'],
  })

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma