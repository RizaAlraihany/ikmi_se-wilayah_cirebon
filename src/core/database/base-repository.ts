import { PrismaClient } from '@prisma/client'

// Use a global prisma instance or pass it. 
// For now, we will create a global Prisma singleton (src/core/database/prisma.ts should exist)
import { prisma } from '@/core/database/prisma'

export class BaseRepository<T extends { deletedAt?: Date | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected model: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(modelDelegate: any) {
    this.model = modelDelegate
  }

  /**
   * Retrieves all active records (not soft deleted).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findActive(args: any = {}): Promise<T[]> {
    const where = args.where || {}
    return this.model.findMany({
      ...args,
      where: {
        ...where,
        deletedAt: null
      }
    })
  }

  /**
   * Soft deletes a record by setting deletedAt to current date.
   */
  async softDelete(id: string): Promise<T> {
    return this.model.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })
  }
}

/**
 * Executes a function inside a Prisma transaction.
 */
export async function withTransaction<R>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<R>
): Promise<R> {
  return prisma.$transaction(fn)
}
