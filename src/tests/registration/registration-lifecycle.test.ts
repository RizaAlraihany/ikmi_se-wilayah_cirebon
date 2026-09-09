import { registrationService } from '@/features/registration/services'
import { registrationCreateSchema } from '@/features/registration/schemas'
import { requirePermissionForUser } from '@/core/authorization/guards'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/authorization/guards', () => ({ requirePermissionForUser: jest.fn() }))

const applicant = { id: 'dev-reg', fullName: 'Development Applicant', registrationNumber: 'REG-2026-0001', semester: '3', status: 'PASSED', deletedAt: null }

beforeEach(() => {
  jest.mocked(requirePermissionForUser).mockResolvedValue({ id: 'dev-admin', roleId: 'admin_organization', departmentId: 'dev-unit', positionId: null })
  prismaMock.$transaction.mockImplementation((async (callback: unknown) => (callback as (tx: typeof prismaMock) => unknown)(prismaMock)) as never)
})

it('serializes reviews before reading status and treats duplicate acceptance as idempotent', async () => {
  prismaMock.registration.findFirst.mockResolvedValue({ ...applicant, status: 'ACTIVE_MEMBER' } as never)
  await expect(registrationService.updateStatus(applicant.id, 'ACTIVE_MEMBER', 'dev-admin')).resolves.toMatchObject({ status: 'ACTIVE_MEMBER' })
  expect(prismaMock.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(prismaMock.registration.findFirst.mock.invocationCallOrder[0])
  expect(prismaMock.registration.update).not.toHaveBeenCalled()
  expect(prismaMock.member.upsert).not.toHaveBeenCalled()
})

it.each(['INACTIVE', 'ALUMNI'] as const)('synchronizes membership on %s', async (status) => {
  prismaMock.registration.findFirst.mockResolvedValue({ ...applicant, status: 'ACTIVE_MEMBER' } as never)
  prismaMock.registration.update.mockResolvedValue({ ...applicant, status } as never)
  await registrationService.updateStatus(applicant.id, status, 'dev-admin')
  expect(prismaMock.member.updateMany).toHaveBeenCalledWith({ where: { registrationId: applicant.id, deletedAt: null }, data: { membershipStatus: status } })
})

it('rejects skipped review transitions before persistence', async () => {
  prismaMock.registration.findFirst.mockResolvedValue({ ...applicant, status: 'NEW' } as never)
  await expect(registrationService.updateStatus(applicant.id, 'ACTIVE_MEMBER', 'dev-admin')).rejects.toThrow('Transisi')
  expect(prismaMock.member.upsert).not.toHaveBeenCalled()
  expect(prismaMock.registration.update).not.toHaveBeenCalled()
})

it('denies Komdigi even when legacy review permission is granted', async () => {
  jest.mocked(requirePermissionForUser).mockResolvedValue({ id: 'dev-komdigi', roleId: 'admin_komdigi', departmentId: null, positionId: null })
  await expect(registrationService.updateStatus(applicant.id, 'ACTIVE_MEMBER', 'dev-komdigi')).rejects.toThrow('Admin Organisasi')
  expect(prismaMock.$transaction).not.toHaveBeenCalled()
})

it('continues registration numbering beyond four digits', async () => {
  prismaMock.registration.findMany.mockResolvedValue([{ registrationNumber: 'REG-2026-9999' }, { registrationNumber: 'REG-2026-10000' }] as never)
  prismaMock.registration.create.mockResolvedValue({ ...applicant } as never)
  await registrationService.submitRegistration({ fullName: 'Development Applicant' } as never)
  expect(prismaMock.registration.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ registrationNumber: expect.stringMatching(/-10001$/) }) }))
})

it('bounds public PII input and rejects non-phone text', () => {
  const data = { fullName: 'Development Applicant', email: 'dev@example.test', campus: 'Test Campus', major: 'Test Study', semester: '3', entryYear: 2026, district: 'Test District', village: 'Test Village', address: 'Development address only', whatsapp: '081234567890', reasons: 'Development registration validation', consent: true }
  expect(registrationCreateSchema.safeParse(data).success).toBe(true)
  expect(registrationCreateSchema.safeParse({ ...data, whatsapp: 'abcdefghijk' }).success).toBe(false)
  expect(registrationCreateSchema.safeParse({ ...data, reasons: 'x'.repeat(2001) }).success).toBe(false)
})
