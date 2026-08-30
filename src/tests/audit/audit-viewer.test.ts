import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { AuditAction } from '@prisma/client'
import { requirePermission } from '@/core/authorization/guards'
import { ForbiddenError } from '@/core/errors/custom-errors'
import { parseAuditData, serializeAuditData } from '@/features/audit/audit-data'
import { auditQueries } from '@/features/audit/queries'
import { prismaMock } from '../prisma-mock'

jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn() }))

const requirePermissionMock = jest.mocked(requirePermission)

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('Phase 23 — Audit Log Viewer', () => {
  beforeEach(() => {
    requirePermissionMock.mockResolvedValue({
      id: 'super-1',
      roleId: 'super_admin',
      departmentId: null,
      positionId: null,
    })
  })

  it('redacts nested credentials, session data, and private storage identifiers', () => {
    const serialized = serializeAuditData({
      title: 'Catatan aman',
      passwordHash: 'bcrypt-secret',
      nested: JSON.stringify({ authorization: 'Bearer secret', filePublicId: 'private-file' }),
    })
    const parsed = parseAuditData(serialized) as Record<string, unknown>

    expect(parsed.title).toBe('Catatan aman')
    expect(parsed.passwordHash).toBe('[REDACTED]')
    expect(parsed.nested).toEqual({ authorization: '[REDACTED]', filePublicId: '[REDACTED]' })
    expect(serialized).not.toContain('bcrypt-secret')
    expect(serialized).not.toContain('Bearer secret')
    expect(serialized).not.toContain('private-file')
  })

  it('refuses to render unstructured historical payloads', () => {
    expect(parseAuditData('password=legacy-secret')).toBe('[UNSTRUCTURED_DATA_REDACTED]')
  })

  it('enforces the Super Admin boundary in the data query', async () => {
    requirePermissionMock.mockResolvedValueOnce({
      id: 'organization-1',
      roleId: 'admin_organization',
      departmentId: 'department-1',
      positionId: null,
    })

    await expect(auditQueries.getAuditLogPage({ page: 1 })).rejects.toBeInstanceOf(ForbiddenError)
    expect(prismaMock.auditLog.count).not.toHaveBeenCalled()
  })

  it('applies filters, paginates, limits actor data, and returns redacted context', async () => {
    const createdAt = new Date('2026-08-13T03:00:00.000Z')
    prismaMock.auditLog.count.mockResolvedValueOnce(1)
    prismaMock.auditLog.findMany
      .mockResolvedValueOnce([{
        id: 'audit-1',
        action: AuditAction.ROLE_CHANGE,
        entity: 'User',
        entityId: 'user-1',
        oldData: JSON.stringify({ roleId: 'admin_organization', token: 'unsafe' }),
        newData: JSON.stringify({ roleId: 'admin_komdigi' }),
        createdAt,
        user: { id: 'super-1', name: 'Super Admin' },
      }] as never)
      .mockResolvedValueOnce([{ user: { id: 'super-1', name: 'Super Admin' } }] as never)
      .mockResolvedValueOnce([{ entity: 'User' }] as never)

    const dateFrom = new Date('2026-08-12T17:00:00.000Z')
    const dateToExclusive = new Date('2026-08-13T17:00:00.000Z')
    const result = await auditQueries.getAuditLogPage({
      page: 1,
      userId: 'super-1',
      action: AuditAction.ROLE_CHANGE,
      entity: 'User',
      dateFrom,
      dateToExclusive,
    })

    expect(requirePermissionMock).toHaveBeenCalledWith('audit.view')
    expect(prismaMock.auditLog.count).toHaveBeenCalledWith({
      where: {
        userId: 'super-1',
        action: AuditAction.ROLE_CHANGE,
        entity: 'User',
        createdAt: { gte: dateFrom, lt: dateToExclusive },
      },
    })
    const pageQuery = prismaMock.auditLog.findMany.mock.calls[0]?.[0]
    expect(pageQuery?.select?.user).toEqual({ select: { id: true, name: true } })
    expect(JSON.stringify(pageQuery)).not.toContain('email')
    expect(result.logs[0]?.oldData).toEqual({ roleId: 'admin_organization', token: '[REDACTED]' })
    expect(result.actors).toEqual([{ id: 'super-1', name: 'Super Admin' }])
    expect(result.entities).toEqual(['User'])
  })

  it('provides every required filter and separate mobile and desktop records', () => {
    const page = readSource('src/app/(dashboard)/admin/system/audit-logs/page.tsx')
    for (const field of ['name="userId"', 'name="action"', 'name="entity"', 'name="dateFrom"', 'name="dateTo"']) {
      expect(page).toContain(field)
    }
    expect(page).toContain('md:hidden')
    expect(page).toContain('hidden overflow-hidden md:block')
    expect(page).toContain('Konteks')
    expect(page).toContain('Paginasi audit log')
  })

  it('covers the required domain and security event families', () => {
    const sources = [
      readSource('src/features/programs/services.ts'),
      readSource('src/features/agendas/services.ts'),
      readSource('src/features/blog/services.ts'),
      readSource('src/features/request-pamflet/admin-actions.ts'),
      readSource('src/features/kirim-tulisan/actions.ts'),
      readSource('src/features/users/services.ts'),
      readSource('src/features/web-config/services.ts'),
      readSource('src/features/auth/services.ts'),
      readSource('src/core/authorization/guards.ts'),
    ].join('\n')

    for (const entity of ["entity: 'Program'", "entity: 'Agenda'", "entity: 'Post'", "entity: 'PamfletRequest'", "entity: 'KaryaTulis'"]) {
      expect(sources).toContain(entity)
    }
    for (const action of ['ROLE_CHANGE', 'SECURITY_SETTING_CHANGE', 'LOGIN_FAILED', 'AUTHORIZATION_FAILED', 'STATUS_CHANGE']) {
      expect(sources).toContain(action)
    }
  })
})
