import { BaseRepository } from '@/core/database/base-repository'
import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

type User = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>
type UserFindManyArgs = Prisma.Args<typeof prisma.user, 'findMany'>
type UserUpdateArgs = Prisma.Args<typeof prisma.user, 'update'>

class UserRepository extends BaseRepository<User, UserFindManyArgs, UserUpdateArgs> {
  constructor() {
    super(prisma.user)
  }

  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null
      }
    })
  }

  async create(data: Prisma.Args<typeof prisma.user, 'create'>['data']) {
    return prisma.user.create({ data })
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data
    })
  }
}

export const userRepository = new UserRepository()
