import { prisma } from '@/core/database/prisma'

export async function getPamfletRequestFormOptions() {
  const [programs, agendas] = await Promise.all([
    prisma.program.findMany({
      where: { deletedAt: null, visibility: 'PUBLIC' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.agenda.findMany({
      where: {
        deletedAt: null,
        visibility: 'PUBLIC',
        status: { notIn: ['DRAFT', 'ARCHIVED'] },
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return { programs, agendas }
}
