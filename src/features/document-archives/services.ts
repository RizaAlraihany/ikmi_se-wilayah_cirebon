import { prisma } from '@/core/database/prisma'
import { NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import type { SessionUser } from '@/core/authorization/rbac'
import type { CreateDocumentArchiveInput, UpdateDocumentArchiveInput } from './schemas'

type StoredDocument = {
  fileUrl: string
  filePublicId: string
  fileName: string
  fileMimeType: string
  fileSize: number
}

export async function validateDocumentArchiveRelations(data: { organizationalUnitId?: string; periodId?: string; programId?: string }) {
  const [unit, period, program] = await Promise.all([
    data.organizationalUnitId ? prisma.department.findFirst({ where: { id: data.organizationalUnitId, deletedAt: null }, select: { id: true, periodId: true } }) : null,
    data.periodId ? prisma.period.findFirst({ where: { id: data.periodId, deletedAt: null }, select: { id: true } }) : null,
    data.programId ? prisma.program.findFirst({ where: { id: data.programId, deletedAt: null }, select: { id: true, periodId: true, departmentId: true } }) : null,
  ])
  if ((data.organizationalUnitId && !unit) || (data.periodId && !period) || (data.programId && !program)) {
    throw new ValidationError('Relasi unit, periode, atau program tidak tersedia.')
  }
  if (unit?.periodId && data.periodId && unit.periodId !== data.periodId) {
    throw new ValidationError('Unit organisasi tidak berada pada periode yang dipilih.')
  }
  if (program?.periodId && data.periodId && program.periodId !== data.periodId) {
    throw new ValidationError('Program tidak berada pada periode yang dipilih.')
  }
  if (program && unit && program.departmentId !== unit.id) {
    throw new ValidationError('Program tidak dimiliki oleh unit organisasi yang dipilih.')
  }
}

export const documentArchiveService = {
  async createDocument(data: CreateDocumentArchiveInput, storedFile: StoredDocument, user: SessionUser) {
    return prisma.$transaction(async (tx) => {
      const document = await tx.documentArchive.create({
        data: {
          title: data.title,
          category: data.category,
          description: data.description ?? null,
          archivedAt: data.archivedAt,
          organizationalUnitId: data.organizationalUnitId ?? null,
          periodId: data.periodId ?? null,
          programId: data.programId ?? null,
          visibility: data.visibility,
          fileUrl: storedFile.fileUrl,
          filePublicId: storedFile.filePublicId,
          fileName: storedFile.fileName,
          fileMimeType: storedFile.fileMimeType,
          fileSize: storedFile.fileSize,
          createdBy: user.id,
        },
      })
      await tx.auditLog.create({
        data: {
          action: 'CREATE', entity: 'DocumentArchive', entityId: document.id, userId: user.id,
          newData: JSON.stringify({ title: document.title, category: document.category, archivedAt: document.archivedAt, visibility: document.visibility }),
        },
      })
      return document
    })
  },

  async updateDocument(id: string, data: UpdateDocumentArchiveInput, user: SessionUser) {
    const document = await prisma.documentArchive.findFirst({ where: { id, deletedAt: null } })
    if (!document) throw new NotFoundError('Arsip dokumen tidak ditemukan.')
    return prisma.$transaction(async (tx) => {
      const updated = await tx.documentArchive.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.category !== undefined ? { category: data.category } : {}),
          ...(data.description !== undefined ? { description: data.description ?? null } : {}),
          ...(data.archivedAt !== undefined ? { archivedAt: data.archivedAt } : {}),
          ...(data.organizationalUnitId !== undefined ? { organizationalUnitId: data.organizationalUnitId ?? null } : {}),
          ...(data.periodId !== undefined ? { periodId: data.periodId ?? null } : {}),
          ...(data.programId !== undefined ? { programId: data.programId ?? null } : {}),
          ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
          updatedBy: user.id,
        },
      })
      await tx.auditLog.create({
        data: {
          action: 'UPDATE', entity: 'DocumentArchive', entityId: id, userId: user.id,
          oldData: JSON.stringify({ title: document.title, category: document.category, visibility: document.visibility }),
          newData: JSON.stringify(data),
        },
      })
      return updated
    })
  },

  async archiveDocument(id: string, user: SessionUser) {
    const document = await prisma.documentArchive.findFirst({ where: { id, deletedAt: null }, select: { id: true, title: true, category: true } })
    if (!document) throw new NotFoundError('Arsip dokumen tidak ditemukan.')
    await prisma.$transaction([
      prisma.documentArchive.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: user.id } }),
      prisma.auditLog.create({ data: { action: 'ARCHIVE', entity: 'DocumentArchive', entityId: id, userId: user.id, oldData: JSON.stringify(document) } }),
    ])
  },

  async authorizeDownload(id: string, user: SessionUser) {
    return prisma.$transaction(async (tx) => {
      const document = await tx.documentArchive.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, title: true, fileName: true, filePublicId: true },
      })
      if (!document?.filePublicId) throw new NotFoundError('File tidak ditemukan.')

      await tx.auditLog.create({
        data: {
          action: 'DOWNLOAD',
          entity: 'DocumentArchive',
          entityId: document.id,
          userId: user.id,
          newData: JSON.stringify({ title: document.title, fileName: document.fileName }),
        },
      })
      return { publicId: document.filePublicId, fileName: document.fileName }
    })
  },
}
