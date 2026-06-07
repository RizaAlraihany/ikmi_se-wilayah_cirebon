import { BaseRepository } from '@/core/database/base-repository'
import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

type Post = NonNullable<Awaited<ReturnType<typeof prisma.post.findUnique>>>

class PostRepository extends BaseRepository<Post> {
  constructor() {
    super(prisma.post)
  }

  async findBySlug(slug: string) {
    return prisma.post.findFirst({
      where: {
        slug,
        deletedAt: null
      }
    })
  }

  async findByIdWithAuthor(id: string) {
    return prisma.post.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        author: {
          select: {
            id: true,
            departmentId: true,
          }
        }
      }
    })
  }

  async create(data: Prisma.Args<typeof prisma.post, 'create'>['data']) {
    return prisma.post.create({ data })
  }

  async update(id: string, data: Prisma.Args<typeof prisma.post, 'update'>['data']) {
    return prisma.post.update({
      where: { id },
      data
    })
  }
}

export const postRepository = new PostRepository()
