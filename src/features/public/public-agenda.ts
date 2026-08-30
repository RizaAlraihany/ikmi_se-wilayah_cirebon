import { addMonths, subMonths } from 'date-fns'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/core/database/prisma'
import { expandAgendaOccurrences } from '@/features/agendas/domain'

export const publicAgendaSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  location: true,
  status: true,
  scheduleType: true,
  startDatetime: true,
  endDatetime: true,
  recurrenceRule: true,
  relativeOffset: true,
  organizationalUnit: { select: { name: true } },
  program: { select: { actualEnd: true } },
  relativeToProgram: { select: { actualEnd: true } },
} satisfies Prisma.AgendaSelect

type PublicAgendaRecord = Prisma.AgendaGetPayload<{ select: typeof publicAgendaSelect }>

function toPublicOccurrences(agendas: PublicAgendaRecord[], rangeStart: Date, rangeEnd: Date) {
  return agendas
    .flatMap((agenda) => {
      // A fixed Agenda may have started before the query window and still be running.
      // Expanding from its real start keeps that occurrence discoverable.
      const expansionStart = agenda.scheduleType === 'FIXED_DATE'
        && agenda.startDatetime
        && agenda.startDatetime < rangeStart
        ? agenda.startDatetime
        : rangeStart

      return expandAgendaOccurrences(agenda, expansionStart, rangeEnd).map((occurrence) => ({
        id: `${agenda.id}:${occurrence.start.toISOString()}`,
        agendaId: agenda.id,
        slug: agenda.slug,
        name: agenda.name,
        description: agenda.description,
        location: agenda.location,
        status: agenda.status,
        organizationalUnitName: agenda.organizationalUnit?.name ?? null,
        scheduleType: agenda.scheduleType,
        start: occurrence.start,
        end: occurrence.end,
      }))
    })
    .sort((left, right) => left.start.getTime() - right.start.getTime())
}

async function findPublicAgendas(includeCompleted: boolean) {
  return prisma.agenda.findMany({
    where: {
      deletedAt: null,
      visibility: 'PUBLIC',
      status: { notIn: includeCompleted ? ['ARCHIVED', 'DRAFT'] : ['ARCHIVED', 'DRAFT', 'COMPLETED'] },
    },
    select: publicAgendaSelect,
  })
}

export async function getPublicAgendaOccurrences(now = new Date()) {
  const rangeEnd = addMonths(now, 6)
  const agendas = await findPublicAgendas(false)

  return toPublicOccurrences(agendas, now, rangeEnd)
    .filter((occurrence) => (occurrence.end ?? occurrence.start) >= now)
}

export async function getCompletedPublicAgendaOccurrences(now = new Date()) {
  const rangeStart = subMonths(now, 12)
  const agendas = await findPublicAgendas(true)

  return toPublicOccurrences(agendas, rangeStart, now)
    .filter((occurrence) => {
      if (occurrence.status === 'POSTPONED' || occurrence.status === 'CANCELLED') return false
      return (occurrence.end ?? occurrence.start) < now
    })
    .sort((left, right) => right.start.getTime() - left.start.getTime())
}

export const publicAgendaDetailSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  location: true,
  status: true,
  scheduleType: true,
  startDatetime: true,
  endDatetime: true,
  recurrenceRule: true,
  relativeOffset: true,
  conditionalNote: true,
  updatedAt: true,
  organizationalUnit: { select: { name: true } },
  program: { select: { name: true, slug: true, visibility: true, deletedAt: true } },
  relativeToProgram: { select: { name: true, slug: true, visibility: true, deletedAt: true } },
  posts: {
    where: { status: 'PUBLISHED' as const, deletedAt: null },
    orderBy: { publishedAt: 'desc' as const },
    take: 3,
    select: { id: true, slug: true, title: true, category: { select: { slug: true, name: true } } },
  },
} satisfies Prisma.AgendaSelect

export async function getPublicAgendaBySlug(slug: string) {
  const agenda = await prisma.agenda.findFirst({
    where: { slug, visibility: 'PUBLIC', deletedAt: null, status: { notIn: ['DRAFT', 'ARCHIVED'] } },
    select: publicAgendaDetailSelect,
  })
  if (!agenda) return null

  const publicProgram = agenda.program?.deletedAt === null && agenda.program.visibility === 'PUBLIC'
    ? { name: agenda.program.name, slug: agenda.program.slug }
    : null
  const publicRelativeProgram = agenda.relativeToProgram?.deletedAt === null && agenda.relativeToProgram.visibility === 'PUBLIC'
    ? { name: agenda.relativeToProgram.name, slug: agenda.relativeToProgram.slug }
    : null

  return { ...agenda, program: publicProgram, relativeToProgram: publicRelativeProgram }
}
