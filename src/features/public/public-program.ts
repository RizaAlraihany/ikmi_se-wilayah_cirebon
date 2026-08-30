import { prisma } from '@/core/database/prisma'
import type { Prisma } from '@prisma/client'
import { deriveProgramStatus, type ProgramDerivedStatus } from '@/features/programs/domain'
import { publicPlainText } from './public-text'

export const publicProgramSummarySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  statusOverride: true,
  plannedStart: true,
  plannedEnd: true,
  location: true,
  department: { select: { name: true, code: true } },
} satisfies Prisma.ProgramSelect

export const publicProgramDetailSelect = {
  ...publicProgramSummarySelect,
  objective: true,
  targetAudience: true,
  method: true,
  output: true,
  homepageBanners: {
    where: { deletedAt: null, status: 'PUBLISHED' },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    take: 1,
    select: { desktopImage: true, mobileImage: true },
  },
  posts: {
    where: { deletedAt: null, status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      thumbnailUrl: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
    },
  },
} satisfies Prisma.ProgramSelect

type PublicProgramSummary = Prisma.ProgramGetPayload<{ select: typeof publicProgramSummarySelect }>

const programStatusOrder: Record<ProgramDerivedStatus, number> = {
  ONGOING: 0,
  UPCOMING: 1,
  UNSCHEDULED: 2,
  POSTPONED: 3,
  CANCELLED: 4,
  COMPLETED: 5,
}

export function orderPublicPrograms(programs: PublicProgramSummary[], now = new Date()) {
  return [...programs].sort((left, right) => {
    const leftStatus = deriveProgramStatus(left, now)
    const rightStatus = deriveProgramStatus(right, now)
    const statusDifference = programStatusOrder[leftStatus] - programStatusOrder[rightStatus]
    if (statusDifference !== 0) return statusDifference

    const leftDate = left.plannedStart?.getTime() ?? Number.MAX_SAFE_INTEGER
    const rightDate = right.plannedStart?.getTime() ?? Number.MAX_SAFE_INTEGER
    return leftStatus === 'COMPLETED' ? rightDate - leftDate : leftDate - rightDate
  })
}

export function programPlainText(value: string | null | undefined) {
  return publicPlainText(value)
}

export async function getPublicPrograms() {
  const programs = await prisma.program.findMany({
    where: {
      deletedAt: null,
      visibility: 'PUBLIC',
    },
    select: publicProgramSummarySelect,
    orderBy: [
      { plannedStart: 'desc' },
      { createdAt: 'desc' }
    ],
  })

  return orderPublicPrograms(programs)
}

export async function getPublicProgramBySlug(slug: string) {
  return prisma.program.findFirst({
    where: {
      slug,
      deletedAt: null,
      visibility: 'PUBLIC',
    },
    select: publicProgramDetailSelect,
  })
}
