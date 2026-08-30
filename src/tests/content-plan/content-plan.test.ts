import { ContentPlanStatus, PamfletRequestStatus } from '@prisma/client'
import { ForbiddenError, ValidationError } from '@/core/errors/custom-errors'
import { requireContentPlanActor } from '@/features/content-plan/access'
import {
  contentPlanMonthRange,
  formatJakartaContentDatetime,
  isContentPlanOverdue,
  normalizeContentPlanMonth,
  parseJakartaContentDatetime,
  shiftContentPlanMonth,
} from '@/features/content-plan/domain'
import { contentPlanQueries, normalizeContentPlanFilters } from '@/features/content-plan/queries'
import { contentPlanCreateSchema } from '@/features/content-plan/schemas'
import { contentPlanService } from '@/features/content-plan/services'
import { prismaMock } from '../prisma-mock'

jest.mock('@/features/content-plan/access', () => ({ requireContentPlanActor: jest.fn() }))

const requireActorMock = jest.mocked(requireContentPlanActor)
const actor = { id: 'member_31_riza_alraihany', roleId: 'admin_komdigi', departmentId: 'komdigi', positionId: null }
const validInput = {
  title: 'Carousel Agenda Sapa Rasa',
  platform: 'Instagram',
  contentType: 'Carousel',
  programId: null,
  agendaId: null,
  notes: 'Siapkan materi utama.',
  assetUrl: 'https://res.cloudinary.com/demo/raw/upload/asset.pdf',
  publishedUrl: null,
  publishDate: new Date('2026-08-20T02:00:00.000Z'),
  status: ContentPlanStatus.PLANNED,
  authorId: actor.id,
  pamfletRequestId: null,
}

describe('Content Plan calendar domain and workflow', () => {
  beforeEach(() => {
    requireActorMock.mockResolvedValue(actor as never)
  })

  it('normalizes month input and calculates Asia/Jakarta month boundaries', () => {
    const now = new Date('2026-08-12T01:00:00.000Z')
    expect(normalizeContentPlanMonth('bad', now)).toBe('2026-08')
    expect(normalizeContentPlanMonth('2026-13', now)).toBe('2026-08')
    expect(shiftContentPlanMonth('2026-01', -1)).toBe('2025-12')
    expect(contentPlanMonthRange('2026-08')).toEqual(expect.objectContaining({
      start: new Date('2026-07-31T17:00:00.000Z'),
      end: new Date('2026-08-31T17:00:00.000Z'),
    }))
  })

  it('round-trips datetime-local values in Asia/Jakarta', () => {
    const parsed = parseJakartaContentDatetime('2026-08-20T09:00')
    expect(parsed).toEqual(new Date('2026-08-20T02:00:00.000Z'))
    expect(formatJakartaContentDatetime(parsed)).toBe('2026-08-20T09:00')
    expect(parseJakartaContentDatetime('2026-02-30T09:00').getTime()).toBeNaN()
  })

  it('shows overdue as an indicator without changing status', () => {
    const now = new Date('2026-08-21T00:00:00.000Z')
    const plan = { publishDate: validInput.publishDate, status: ContentPlanStatus.PLANNED }
    expect(isContentPlanOverdue(plan, now)).toBe(true)
    expect(plan.status).toBe(ContentPlanStatus.PLANNED)
    expect(isContentPlanOverdue({ ...plan, status: ContentPlanStatus.PUBLISHED }, now)).toBe(false)
    expect(isContentPlanOverdue({ ...plan, status: ContentPlanStatus.CANCELLED }, now)).toBe(false)
  })

  it('allows only approved platform/type values and requires a URL for Published', () => {
    expect(contentPlanCreateSchema.safeParse(validInput).success).toBe(true)
    expect(contentPlanCreateSchema.safeParse({ ...validInput, platform: 'Friendster' }).success).toBe(false)
    expect(contentPlanCreateSchema.safeParse({ ...validInput, contentType: 'Thread' }).success).toBe(false)
    expect(contentPlanCreateSchema.safeParse({ ...validInput, status: 'PUBLISHED' }).success).toBe(false)
  })

  it('normalizes unsafe filters before building a database query', () => {
    expect(normalizeContentPlanFilters({ month: '9999-99', status: 'HACKED', platform: 'Unknown' }, new Date('2026-08-12T00:00:00.000Z'))).toEqual({
      month: '2026-08',
      platform: undefined,
      contentType: undefined,
      authorId: undefined,
      status: undefined,
      programId: undefined,
      agendaId: undefined,
    })
  })

  it('authorizes before parsing or looking up a mutation target', async () => {
    requireActorMock.mockRejectedValueOnce(new ForbiddenError())
    await expect(contentPlanService.updatePlan({}, actor.id)).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.contentPlan.findFirst).not.toHaveBeenCalled()
  })

  it('creates a plan and audit record with asset and publication fields', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: actor.id } as never)
    prismaMock.contentPlan.create.mockResolvedValueOnce({ id: 'content-1' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-1' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await contentPlanService.createPlan(validInput, actor.id)

    expect(prismaMock.contentPlan.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      assetUrl: validInput.assetUrl,
      publishedUrl: null,
      status: 'PLANNED',
    }) })
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'CREATE', entity: 'ContentPlan' }) }))
  })

  it('converts a valid Request using only server-owned source fields and a private attachment route', async () => {
    prismaMock.pamfletRequest.findFirst.mockResolvedValueOnce({
      id: 'request-13',
      requestNumber: 'REQ-PAMFLET-2026-0013',
      status: PamfletRequestStatus.DITERIMA,
      activityName: 'Pamflet PRABUMI',
      programId: 'program-prabumi',
      agendaId: null,
      deadline: new Date('2026-08-21T17:00:00.000Z'),
      description: 'Cantumkan waktu dan lokasi kegiatan.',
      referenceLink: 'https://example.test/referensi',
      attachmentPublicId: 'private/request-13/reference',
      requesterNotes: 'Gunakan dokumentasi resmi.',
      notes: 'Sudah diverifikasi.',
    } as never)
    prismaMock.contentPlan.findFirst.mockResolvedValueOnce(null)
    prismaMock.user.findFirst.mockResolvedValueOnce({ id: actor.id } as never)
    prismaMock.program.findFirst.mockResolvedValueOnce({ id: 'program-prabumi' } as never)
    prismaMock.contentPlan.create.mockResolvedValueOnce({ id: 'content-from-request' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-conversion' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await contentPlanService.createPlan({
      ...validInput,
      title: 'Judul browser yang tidak boleh dipercaya',
      programId: 'program-browser',
      assetUrl: 'https://example.test/untrusted-asset',
      pamfletRequestId: 'request-13',
    }, actor.id)

    expect(prismaMock.contentPlan.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Pamflet PRABUMI',
        programId: 'program-prabumi',
        agendaId: null,
        assetUrl: '/api/private/pamflet-requests/request-13',
        pamfletRequestId: 'request-13',
        notes: expect.stringContaining('Catatan pengaju: Gunakan dokumentasi resmi.'),
      }),
    })
  })

  it('rejects invalid or duplicate Request conversion before creating a plan', async () => {
    prismaMock.pamfletRequest.findFirst.mockResolvedValueOnce({
      id: 'request-new',
      requestNumber: 'REQ-PAMFLET-2026-0014',
      status: PamfletRequestStatus.BARU,
      activityName: 'Request Baru',
      programId: null,
      agendaId: null,
      deadline: new Date('2026-08-22T17:00:00.000Z'),
      description: 'Informasi kegiatan.',
      referenceLink: null,
      attachmentPublicId: null,
      requesterNotes: null,
      notes: null,
    } as never)

    await expect(contentPlanService.createPlan({ ...validInput, pamfletRequestId: 'request-new' }, actor.id)).rejects.toBeInstanceOf(ValidationError)

    prismaMock.pamfletRequest.findFirst.mockResolvedValueOnce({
      id: 'request-duplicate',
      requestNumber: 'REQ-PAMFLET-2026-0015',
      status: PamfletRequestStatus.DIKERJAKAN,
      activityName: 'Request Duplikat',
      programId: null,
      agendaId: null,
      deadline: new Date('2026-08-23T17:00:00.000Z'),
      description: 'Informasi kegiatan.',
      referenceLink: null,
      attachmentPublicId: null,
      requesterNotes: null,
      notes: null,
    } as never)
    prismaMock.contentPlan.findFirst.mockResolvedValueOnce({ id: 'existing-content-plan' } as never)

    await expect(contentPlanService.createPlan({ ...validInput, pamfletRequestId: 'request-duplicate' }, actor.id)).rejects.toBeInstanceOf(ValidationError)
    expect(prismaMock.contentPlan.create).not.toHaveBeenCalled()
  })

  it('blocks a direct publish from Planned and requires a publication URL', async () => {
    prismaMock.contentPlan.findFirst.mockResolvedValueOnce({ id: 'content-1', status: 'PLANNED', publishedUrl: null } as never)
    await expect(contentPlanService.updatePlan({ id: 'content-1', status: 'PUBLISHED', publishedUrl: 'https://example.test/post' }, actor.id)).rejects.toBeInstanceOf(ValidationError)

    prismaMock.contentPlan.findFirst.mockResolvedValueOnce({ id: 'content-2', status: 'READY', publishedUrl: null } as never)
    await expect(contentPlanService.updatePlan({ id: 'content-2', status: 'PUBLISHED' }, actor.id)).rejects.toBeInstanceOf(ValidationError)
    expect(prismaMock.contentPlan.update).not.toHaveBeenCalled()
  })

  it('publishes Ready content transactionally and permits clearing stale relations', async () => {
    prismaMock.contentPlan.findFirst.mockResolvedValueOnce({ id: 'content-ready', status: 'READY', publishedUrl: null } as never)
    prismaMock.contentPlan.update.mockResolvedValueOnce({ id: 'content-ready', status: 'PUBLISHED' } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-publish' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await contentPlanService.updatePlan({ id: 'content-ready', status: 'PUBLISHED', publishedUrl: 'https://ikmicirebon.web.id/blog/konten' }, actor.id)
    expect(prismaMock.contentPlan.update).toHaveBeenCalledWith({
      where: { id: 'content-ready' },
      data: expect.objectContaining({ status: 'PUBLISHED', publishedUrl: 'https://ikmicirebon.web.id/blog/konten' }),
    })
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PUBLISH' }) }))

    prismaMock.contentPlan.findFirst.mockResolvedValueOnce({ id: 'content-clear', status: 'PLANNED', publishedUrl: null, programId: 'old-program' } as never)
    prismaMock.contentPlan.update.mockResolvedValueOnce({ id: 'content-clear' } as never)
    await contentPlanService.updatePlan({ id: 'content-clear', programId: null }, actor.id)
    expect(prismaMock.contentPlan.update).toHaveBeenLastCalledWith({
      where: { id: 'content-clear' },
      data: { programId: null, updatedBy: actor.id },
    })
  })

  it('guards admin calendar reads and uses Jakarta range in the query', async () => {
    requireActorMock.mockRejectedValueOnce(new ForbiddenError())
    await expect(contentPlanQueries.getPlans({ month: '2026-08' })).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.contentPlan.findMany).not.toHaveBeenCalled()

    requireActorMock.mockResolvedValueOnce(actor as never)
    prismaMock.contentPlan.findMany.mockResolvedValueOnce([])
    await contentPlanQueries.getPlans({ month: '2026-08' })
    expect(prismaMock.contentPlan.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        deletedAt: null,
        publishDate: { gte: new Date('2026-07-31T17:00:00.000Z'), lt: new Date('2026-08-31T17:00:00.000Z') },
      }),
    }))
  })
})
