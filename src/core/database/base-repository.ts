import { PrismaClient } from '@prisma/client'

// Use a global prisma instance or pass it. 
// For now, we will create a global Prisma singleton (src/core/database/prisma.ts should exist)
import { prisma } from '@/core/database/prisma'

type RepositoryFindArgs = {
  where?: Record<string, unknown>
  [key: string]: unknown
}

type SoftDeleteDelegate<T, FindManyArgs, UpdateArgs> = {
  findMany(args: FindManyArgs): Promise<T[]>
  update(args: UpdateArgs): Promise<T>
}

export class BaseRepository<
  T extends { deletedAt?: Date | null },
  FindManyArgs extends RepositoryFindArgs,
  UpdateArgs extends object
> {
  protected model: SoftDeleteDelegate<T, FindManyArgs, UpdateArgs>

  constructor(modelDelegate: SoftDeleteDelegate<T, FindManyArgs, UpdateArgs>) {
    this.model = modelDelegate
  }

  /**
   * Retrieves all active records (not soft deleted).
   */
  async findActive(args: RepositoryFindArgs = {}): Promise<T[]> {
    const where = args.where || {}
    const findArgs = {
      ...args,
      where: {
        ...where,
        deletedAt: null
      }
    } as unknown as FindManyArgs
    return this.model.findMany(findArgs)
  }

  /**
   * Soft deletes a record by setting deletedAt to current date.
   */
  async softDelete(id: string): Promise<T> {
    const updateArgs = {
      where: { id },
      data: {
        deletedAt: new Date()
      }
    } as unknown as UpdateArgs
    return this.model.update(updateArgs)
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
