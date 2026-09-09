import { prisma } from '@/core/database/prisma'
import { NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { requireCmsUpdate } from '@/features/cms/access'
import { homepageBannerSchema, type HomepageBannerInput } from './schema'

async function validateProgram(programId: string | null | undefined) {
  if (!programId) return null
  const program = await prisma.program.findFirst({
    where: {
      id: programId,
      deletedAt: null,
      visibility: 'PUBLIC',
      campaignEnabled: true,
    },
    select: { id: true },
  })
  if (!program) {
    throw new ValidationError('Program terkait harus publik dan opsi campaign-nya aktif.')
  }
  return program
}

function storageData(data: HomepageBannerInput) {
  return {
    internalTitle: data.internalTitle,
    phase: data.phase,
    headline: data.headline,
    supportingText: data.supportingText || null,
    desktopImage: data.desktopImage,
    mobileImage: data.mobileImage,
    ctaLabel: data.ctaLabel || null,
    ctaUrl: data.ctaUrl || null,
    status: data.status,
    priority: data.priority,
    startAt: data.startAt || null,
    endAt: data.endAt || null,
    programId: data.programId || null,
  }
}

async function validatePublication(data: HomepageBannerInput) {
  if (data.phase !== 'AFTER' || !data.ctaUrl) return
  const match = /^\/publikasi\/([^/?#]+)$/.exec(data.ctaUrl)
  if (!match || !await prisma.post.findFirst({
    where: { slug: match[1], status: 'PUBLISHED', deletedAt: null, publishedAt: { lte: new Date() } },
    select: { id: true },
  })) throw new ValidationError('Banner setelah kegiatan harus menautkan publikasi yang sudah terbit.')
}

export const homepageBannerService = {
  async create(input: unknown, actorId: string) {
    const actor = await requireCmsUpdate(actorId)
    const data = homepageBannerSchema.parse(input)
    await validateProgram(data.programId)
    await validatePublication(data)
    const stored = storageData(data)

    return prisma.$transaction(async (tx) => {
      const banner = await tx.homepageBanner.create({ data: { ...stored, createdById: actor.id } })
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'HomepageBanner',
          entityId: banner.id,
          userId: actor.id,
          newData: JSON.stringify(stored),
        },
      })
      return banner
    })
  },

  async update(id: string, input: unknown, actorId: string) {
    const actor = await requireCmsUpdate(actorId)
    const data = homepageBannerSchema.parse(input)
    const current = await prisma.homepageBanner.findFirst({ where: { id, deletedAt: null } })
    if (!current) throw new NotFoundError('Banner campaign tidak ditemukan.')
    await validateProgram(data.programId)
    await validatePublication(data)
    const stored = storageData(data)

    return prisma.$transaction(async (tx) => {
      const banner = await tx.homepageBanner.update({ where: { id }, data: stored })
      await tx.auditLog.create({
        data: {
          action: data.status === 'PUBLISHED' && current.status !== 'PUBLISHED' ? 'PUBLISH' : 'UPDATE',
          entity: 'HomepageBanner',
          entityId: id,
          userId: actor.id,
          oldData: JSON.stringify(current),
          newData: JSON.stringify(stored),
        },
      })
      return banner
    })
  },

  async archive(id: string, actorId: string) {
    const actor = await requireCmsUpdate(actorId)
    const current = await prisma.homepageBanner.findFirst({ where: { id, deletedAt: null } })
    if (!current) throw new NotFoundError('Banner campaign tidak ditemukan.')

    await prisma.$transaction(async (tx) => {
      await tx.homepageBanner.update({ where: { id }, data: { status: 'ARCHIVED', deletedAt: new Date() } })
      await tx.auditLog.create({
        data: {
          action: 'ARCHIVE',
          entity: 'HomepageBanner',
          entityId: id,
          userId: actor.id,
          oldData: JSON.stringify(current),
        },
      })
    })
  },
}
