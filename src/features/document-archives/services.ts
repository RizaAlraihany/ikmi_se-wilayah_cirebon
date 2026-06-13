import { prisma } from '@/core/database/prisma'
import { can, type SessionUser } from '@/core/authorization/rbac'
import { ForbiddenError } from '@/core/errors/custom-errors'
import type { CreateDocumentArchiveInput, UpdateDocumentArchiveInput } from './schemas'

export const documentArchiveService = {
  async createDocument(data: CreateDocumentArchiveInput, user: SessionUser) {
    const isAuthorized = await can('letter.create', user)
    if (!isAuthorized) throw new ForbiddenError('Akses ditolak: tidak dapat membuat arsip dokumen')

    return prisma.$transaction(async (tx) => {
      const document = await tx.documentArchive.create({
        data: {
          title: data.title,
          category: data.category,
          description: data.description || null,
          fileUrl: data.fileUrl,
          filePublicId: data.filePublicId || null,
          archivedAt: data.archivedAt,
          createdBy: user.id,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'DocumentArchive',
          entityId: document.id,
          newData: JSON.stringify(document),
          userId: user.id,
        },
      })

      return document
    })
  },

  async updateDocument(id: string, data: UpdateDocumentArchiveInput, user: SessionUser) {
    const isAuthorized = await can('letter.update', user)
    if (!isAuthorized) throw new ForbiddenError('Akses ditolak: tidak dapat mengubah arsip dokumen')

    const document = await prisma.documentArchive.findFirst({ where: { id, deletedAt: null } })
    if (!document) throw new Error('Arsip dokumen tidak ditemukan')

    return prisma.$transaction(async (tx) => {
      const updated = await tx.documentArchive.update({
        where: { id },
        data: {
          ...data,
          description: data.description ?? document.description,
          filePublicId: data.filePublicId ?? document.filePublicId,
          updatedBy: user.id,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'DocumentArchive',
          entityId: id,
          oldData: JSON.stringify(document),
          newData: JSON.stringify(updated),
          userId: user.id,
        },
      })

      return updated
    })
  },

  async deleteDocument(id: string, user: SessionUser) {
    const isAuthorized = await can('letter.delete', user)
    if (!isAuthorized) throw new ForbiddenError('Akses ditolak: tidak dapat menghapus arsip dokumen')

    const document = await prisma.documentArchive.findFirst({ where: { id, deletedAt: null } })
    if (!document) throw new Error('Arsip dokumen tidak ditemukan')

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.documentArchive.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: user.id,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'DocumentArchive',
          entityId: id,
          oldData: JSON.stringify(document),
          userId: user.id,
        },
      })

      return deleted
    })
  },
}
