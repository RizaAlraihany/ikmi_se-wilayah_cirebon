import { HomepageBannerStatus, type Prisma } from '@prisma/client'
import { requireAuth } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { requireCmsView } from '@/features/cms/access'
import { isSafeCampaignCtaUrl, isSafeCampaignImageUrl } from './domain'

async function requireCampaignViewer() {
  const actor = await requireAuth()
  await requireCmsView(actor.id)
  return actor
}

export async function getHomepageBanners(params?: {
  status?: HomepageBannerStatus
  phase?: 'BEFORE' | 'PRA' | 'AFTER' | 'GENERAL'
}) {
  await requireCampaignViewer()
  const where: Prisma.HomepageBannerWhereInput = { deletedAt: null }
  if (params?.status) where.status = params.status
  if (params?.phase) where.phase = params.phase

  return prisma.homepageBanner.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    include: { program: { select: { id: true, name: true, campaignEnabled: true, visibility: true } } },
  })
}

export async function getHomepageBannerById(id: string) {
  await requireCampaignViewer()
  return prisma.homepageBanner.findFirst({
    where: { id, deletedAt: null },
    include: { program: { select: { id: true, name: true, campaignEnabled: true, visibility: true } } },
  })
}

export async function getCampaignProgramOptions() {
  await requireCampaignViewer()
  return prisma.program.findMany({
    where: {
      deletedAt: null,
      campaignEnabled: true,
      visibility: 'PUBLIC',
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export const publicHomepageBannerSelect = {
  id: true,
  phase: true,
  headline: true,
  supportingText: true,
  desktopImage: true,
  mobileImage: true,
  ctaLabel: true,
  ctaUrl: true,
  priority: true,
  program: { select: { name: true, slug: true } },
} satisfies Prisma.HomepageBannerSelect

export function activePublicBannerWhere(now: Date): Prisma.HomepageBannerWhereInput {
  return {
    deletedAt: null,
    desktopImage: { not: null },
    mobileImage: { not: null },
    AND: [
      {
        OR: [
          { programId: null },
          {
            program: {
              is: {
                campaignEnabled: true,
                visibility: 'PUBLIC',
                deletedAt: null,
              },
            },
          },
        ],
      },
      {
        OR: [
          {
            status: HomepageBannerStatus.PUBLISHED,
            AND: [
              { OR: [{ startAt: null }, { startAt: { lte: now } }] },
              { OR: [{ endAt: null }, { endAt: { gte: now } }] },
            ],
          },
          {
            status: HomepageBannerStatus.SCHEDULED,
            startAt: { not: null, lte: now },
            OR: [{ endAt: null }, { endAt: { gte: now } }],
          },
        ],
      },
    ],
  }
}

export async function getActivePublicBanners(now = new Date()) {
  const banners = await prisma.homepageBanner.findMany({
    where: activePublicBannerWhere(now),
    select: publicHomepageBannerSelect,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  })

  // Legacy rows may predate schema validation; omit unsafe images instead of crashing Next Image.
  return banners
    .filter((banner) => (
      isSafeCampaignImageUrl(banner.desktopImage) && isSafeCampaignImageUrl(banner.mobileImage)
    ))
    .map((banner) => {
      const safeCta = Boolean(banner.ctaLabel) && isSafeCampaignCtaUrl(banner.ctaUrl)
      return {
        ...banner,
        ctaLabel: safeCta ? banner.ctaLabel : null,
        ctaUrl: safeCta ? banner.ctaUrl : null,
      }
    })
}

export async function getActivePublicBanner(now = new Date()) {
  return (await getActivePublicBanners(now))[0] ?? null
}
