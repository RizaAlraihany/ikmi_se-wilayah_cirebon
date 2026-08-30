import { ForbiddenError, ValidationError } from '@/core/errors/custom-errors'
import { requireAuth } from '@/core/authorization/guards'
import { requireCmsUpdate, requireCmsView } from '@/features/cms/access'
import {
  deriveCampaignState,
  formatJakartaCampaignDatetime,
  parseJakartaCampaignDatetime,
} from '@/features/homepage-banner/domain'
import {
  activePublicBannerWhere,
  getActivePublicBanners,
  getCampaignProgramOptions,
  getHomepageBanners,
  publicHomepageBannerSelect,
} from '@/features/homepage-banner/queries'
import { homepageBannerSchema } from '@/features/homepage-banner/schema'
import { homepageBannerService } from '@/features/homepage-banner/services'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/authorization/guards', () => ({ requireAuth: jest.fn() }))
jest.mock('@/features/cms/access', () => ({
  requireCmsUpdate: jest.fn(),
  requireCmsView: jest.fn(),
}))

const requireAuthMock = jest.mocked(requireAuth)
const requireCmsUpdateMock = jest.mocked(requireCmsUpdate)
const requireCmsViewMock = jest.mocked(requireCmsView)
const actor = {
  id: 'admin-komdigi-1',
  roleId: 'admin_komdigi',
  departmentId: null,
  positionId: null,
}
const validInput = {
  programId: null,
  internalTitle: 'Campaign Agustus',
  phase: 'GENERAL',
  headline: 'Bersama bergerak untuk Indramayu',
  supportingText: 'Informasi campaign resmi IKMI Cirebon.',
  desktopImage: 'https://res.cloudinary.com/demo/image/upload/banner-desktop.webp',
  mobileImage: 'https://res.cloudinary.com/demo/image/upload/banner-mobile.webp',
  ctaLabel: 'Lihat kegiatan',
  ctaUrl: '/agenda',
  startAt: new Date('2026-08-12T02:00:00.000Z'),
  endAt: new Date('2026-08-20T10:00:00.000Z'),
  priority: 10,
  status: 'SCHEDULED',
}

describe('Homepage Campaign lifecycle and security', () => {
  beforeEach(() => {
    requireAuthMock.mockResolvedValue(actor as never)
    requireCmsUpdateMock.mockResolvedValue(actor as never)
    requireCmsViewMock.mockResolvedValue(actor as never)
  })

  it('derives scheduled, active, expired, and paused states without cron mutation', () => {
    const now = new Date('2026-08-12T03:00:00.000Z')
    expect(deriveCampaignState({ status: 'SCHEDULED', startAt: new Date('2026-08-13T00:00:00.000Z'), endAt: null }, now)).toBe('SCHEDULED')
    expect(deriveCampaignState({ status: 'SCHEDULED', startAt: new Date('2026-08-12T02:00:00.000Z'), endAt: null }, now)).toBe('ACTIVE')
    expect(deriveCampaignState({ status: 'PUBLISHED', startAt: null, endAt: new Date('2026-08-12T02:59:00.000Z') }, now)).toBe('EXPIRED')
    expect(deriveCampaignState({ status: 'PAUSED', startAt: null, endAt: null }, now)).toBe('PAUSED')
  })

  it('round-trips datetime-local values in Asia/Jakarta', () => {
    const parsed = parseJakartaCampaignDatetime('2026-08-12T09:30')
    expect(parsed).toEqual(new Date('2026-08-12T02:30:00.000Z'))
    expect(formatJakartaCampaignDatetime(parsed)).toBe('2026-08-12T09:30')
    expect(() => parseJakartaCampaignDatetime('2026-02-30T09:00')).toThrow(ValidationError)
  })

  it('requires paired CTA fields, valid schedule order, and safe images', () => {
    expect(homepageBannerSchema.safeParse({ ...validInput, ctaUrl: null }).success).toBe(false)
    expect(homepageBannerSchema.safeParse({ ...validInput, endAt: validInput.startAt }).success).toBe(false)
    expect(homepageBannerSchema.safeParse({ ...validInput, desktopImage: 'https://example.test/banner.webp' }).success).toBe(false)
    expect(homepageBannerSchema.safeParse(validInput).success).toBe(true)
  })

  it('supports every approved phase and the paused state', () => {
    for (const phase of ['BEFORE', 'PRA', 'AFTER', 'GENERAL']) {
      expect(homepageBannerSchema.safeParse({ ...validInput, phase }).success).toBe(true)
    }
    expect(homepageBannerSchema.safeParse({ ...validInput, status: 'PAUSED' }).success).toBe(true)
  })

  it('authorizes before parsing or looking up a mutation target', async () => {
    requireCmsUpdateMock.mockRejectedValueOnce(new ForbiddenError())
    await expect(homepageBannerService.update('missing', {}, actor.id)).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.homepageBanner.findFirst).not.toHaveBeenCalled()
  })

  it('does not force a Program with campaign disabled into a public campaign', async () => {
    prismaMock.program.findFirst.mockResolvedValueOnce(null)
    await expect(homepageBannerService.create({ ...validInput, programId: 'program-disabled' }, actor.id)).rejects.toBeInstanceOf(ValidationError)
    expect(prismaMock.homepageBanner.create).not.toHaveBeenCalled()
  })

  it('creates a banner and its audit record in one transaction', async () => {
    prismaMock.homepageBanner.create.mockResolvedValueOnce({ id: 'banner-1' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-1' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await expect(homepageBannerService.create(validInput, actor.id)).resolves.toEqual(expect.objectContaining({ id: 'banner-1' }))
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'CREATE', entity: 'HomepageBanner', userId: actor.id }),
    }))
  })

  it('updates an existing banner and audits the first publication', async () => {
    prismaMock.homepageBanner.findFirst.mockResolvedValueOnce({ id: 'banner-1', status: 'DRAFT', deletedAt: null } as never)
    prismaMock.homepageBanner.update.mockResolvedValueOnce({ id: 'banner-1', status: 'PUBLISHED' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-publish' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await homepageBannerService.update('banner-1', { ...validInput, status: 'PUBLISHED' }, actor.id)

    expect(prismaMock.homepageBanner.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'banner-1' } }))
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'PUBLISH', entity: 'HomepageBanner', entityId: 'banner-1' }),
    }))
  })

  it('soft-archives a banner and records the action', async () => {
    prismaMock.homepageBanner.findFirst.mockResolvedValueOnce({ id: 'banner-1', status: 'PUBLISHED' } as never)
    prismaMock.homepageBanner.update.mockResolvedValueOnce({ id: 'banner-1' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-archive' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await homepageBannerService.archive('banner-1', actor.id)
    expect(prismaMock.homepageBanner.update).toHaveBeenCalledWith({
      where: { id: 'banner-1' },
      data: { status: 'ARCHIVED', deletedAt: expect.any(Date) },
    })
    expect(prismaMock.homepageBanner.delete).not.toHaveBeenCalled()
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ARCHIVE' }) }))
  })

  it('guards admin reads before database access', async () => {
    requireAuthMock.mockRejectedValueOnce(new ForbiddenError())
    await expect(getHomepageBanners()).rejects.toBeInstanceOf(ForbiddenError)
    expect(requireCmsViewMock).not.toHaveBeenCalled()
    expect(prismaMock.homepageBanner.findMany).not.toHaveBeenCalled()
  })

  it('only offers public campaign-enabled Programs in the form', async () => {
    prismaMock.program.findMany.mockResolvedValueOnce([])
    await getCampaignProgramOptions()
    expect(prismaMock.program.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null, campaignEnabled: true, visibility: 'PUBLIC' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  })

  it('uses an explicit public DTO, schedule window, priority, and safe CTA fallback', async () => {
    const now = new Date('2026-08-12T03:00:00.000Z')
    prismaMock.homepageBanner.findMany.mockResolvedValueOnce([{
      id: 'banner-public',
      phase: 'GENERAL',
      headline: 'Campaign publik',
      supportingText: null,
      desktopImage: validInput.desktopImage,
      mobileImage: validInput.mobileImage,
      ctaLabel: 'Buka',
      ctaUrl: 'javascript:alert(1)',
      priority: 5,
      program: null,
    }] as never)

    const result = await getActivePublicBanners(now)
    expect(prismaMock.homepageBanner.findMany).toHaveBeenCalledWith({
      where: activePublicBannerWhere(now),
      select: publicHomepageBannerSelect,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
    expect(JSON.stringify(publicHomepageBannerSelect)).not.toMatch(/internalTitle|createdBy|deletedAt/i)
    expect(result[0]).toEqual(expect.objectContaining({ ctaLabel: null, ctaUrl: null }))
    expect(JSON.stringify(activePublicBannerWhere(now))).toContain('campaignEnabled')
    expect(JSON.stringify(activePublicBannerWhere(now))).toContain('PUBLIC')
    expect(JSON.stringify(activePublicBannerWhere(now))).not.toContain('PAUSED')
  })
})
