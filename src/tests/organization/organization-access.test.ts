import { requirePermission } from '@/core/authorization/guards'
import { prismaMock } from '../prisma-mock'
import { updateCabinetAction, updateOrganizationalUnitAction, archiveOrganizationalPositionAction } from '@/features/organization/actions'
import { revalidatePath } from 'next/cache'

jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

beforeEach(() => {
  jest.mocked(requirePermission).mockResolvedValue({ id: 'dev-organization', roleId: 'admin_organization', departmentId: 'dev-a', positionId: null })
  prismaMock.$transaction.mockImplementation((async (callback: unknown) => (callback as (tx: typeof prismaMock) => unknown)(prismaMock)) as never)
})

const cabinet = { tagline: 'Development', description: '', vision: 'Development vision', missions: ['Development mission'], logoUrl: '' }

it('denies Komdigi cabinet mutation despite an old organization permission', async () => {
  jest.mocked(requirePermission).mockResolvedValue({ id: 'dev-komdigi', roleId: 'admin_komdigi', departmentId: null, positionId: null })
  expect(await updateCabinetAction('dev-period', cabinet)).toHaveProperty('error')
  expect(prismaMock.period.findFirst).not.toHaveBeenCalled()
  expect(prismaMock.webConfig.upsert).not.toHaveBeenCalled()
})

it('persists cabinet under its period and refreshes public consumers', async () => {
  prismaMock.period.findFirst.mockResolvedValue({ id: 'dev-period' } as never)
  expect(await updateCabinetAction('dev-period', cabinet)).toEqual({ success: true })
  expect(prismaMock.webConfig.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { key: 'cabinet:dev-period' }, create: { key: 'cabinet:dev-period', valueJson: JSON.stringify(cabinet) } }))
  expect(revalidatePath).toHaveBeenCalledWith('/tentang')
  expect(revalidatePath).toHaveBeenCalledWith('/struktur')
})

it('rejects updating another unit using trusted database identity', async () => {
  prismaMock.department.findFirst.mockResolvedValue({ id: 'dev-b' } as never)
  expect(await updateOrganizationalUnitAction('dev-b', { name: 'Development B', code: 'DEV-B', status: 'ACTIVE', unitType: 'DEPARTMENT' })).toHaveProperty('error')
  expect(prismaMock.department.update).not.toHaveBeenCalled()
})

it('keeps a position used by Member structure assignments', async () => {
  prismaMock.position.findFirst.mockResolvedValue({ id: 'dev-position', departmentId: 'dev-a', _count: { users: 0 } } as never)
  prismaMock.structureAssignment.count.mockResolvedValue(1)
  expect(await archiveOrganizationalPositionAction('dev-position')).toHaveProperty('error')
  expect(prismaMock.position.update).not.toHaveBeenCalled()
})
