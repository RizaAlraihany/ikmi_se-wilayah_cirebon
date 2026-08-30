import { documentArchiveQueries } from '@/features/document-archives/queries'
import { createDocumentArchiveSchema } from '@/features/document-archives/schemas'
import { documentArchiveService, validateDocumentArchiveRelations } from '@/features/document-archives/services'
import { NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { prismaMock } from '../prisma-mock'

const actor = { id: 'admin-organization-1', roleId: 'admin_organization', departmentId: null, positionId: null }

describe('document archive privacy rules', () => {
  it('defaults new archives to INTERNAL and rejects client file URLs', () => {
    const valid = createDocumentArchiveSchema.safeParse({ title: 'Notulen Rapat Kerja', category: 'Notulen', archivedAt: '2026-08-10' })
    expect(valid.success).toBe(true)
    if (valid.success) expect(valid.data.visibility).toBe('INTERNAL')

    expect(createDocumentArchiveSchema.safeParse({
      title: 'Notulen Rapat Kerja', category: 'Notulen', archivedAt: '2026-08-10', fileUrl: 'https://untrusted.example/file.pdf',
    }).success).toBe(false)
    expect(createDocumentArchiveSchema.safeParse({
      title: 'Notulen Rapat Kerja', category: 'Notulen', archivedAt: '2026-08-10', visibility: 'PUBLIC',
    }).success).toBe(false)
  })

  it('does not send storage URLs or public IDs to the document board', async () => {
    prismaMock.documentArchive.findMany.mockResolvedValueOnce([])
    await documentArchiveQueries.getDocuments('Notulen', 'rapat')

    expect(prismaMock.documentArchive.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ deletedAt: null, category: 'Notulen' }),
      select: expect.not.objectContaining({ fileUrl: expect.anything(), filePublicId: expect.anything() }),
    }))
  })

  it('rejects relations that cross period or organizational-unit boundaries', async () => {
    prismaMock.department.findFirst.mockResolvedValueOnce({ id: 'unit-1', periodId: 'period-other' } as never)
    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1' } as never)
    prismaMock.program.findFirst.mockResolvedValueOnce({ id: 'program-1', periodId: 'period-1', departmentId: 'unit-1' } as never)

    await expect(validateDocumentArchiveRelations({
      organizationalUnitId: 'unit-1',
      periodId: 'period-1',
      programId: 'program-1',
    })).rejects.toBeInstanceOf(ValidationError)
  })

  it('audits an authorized download without logging its private storage identifier', async () => {
    prismaMock.documentArchive.findFirst.mockResolvedValueOnce({
      id: 'document-1',
      title: 'Notulen Rapat Kerja',
      fileName: 'notulen-raker.pdf',
      filePublicId: 'documents/private-random-key',
    } as never)
    prismaMock.auditLog.create.mockResolvedValueOnce({ id: 'audit-download' } as never)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    const file = await documentArchiveService.authorizeDownload('document-1', actor)

    expect(file).toEqual({ publicId: 'documents/private-random-key', fileName: 'notulen-raker.pdf' })
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'DOWNLOAD', entity: 'DocumentArchive', entityId: 'document-1', userId: actor.id }),
    })
    const auditData = prismaMock.auditLog.create.mock.calls[0]?.[0].data.newData
    expect(auditData).not.toContain('private-random-key')
  })

  it('does not audit or issue access for a missing file', async () => {
    prismaMock.documentArchive.findFirst.mockResolvedValueOnce(null)
    prismaMock.$transaction.mockImplementation((async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected interactive transaction')
      return callback(prismaMock)
    }) as never)

    await expect(documentArchiveService.authorizeDownload('missing-document', actor)).rejects.toBeInstanceOf(NotFoundError)
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled()
  })
})
