import { storageService } from '@/core/storage/storage-service'
import { validateImage } from '@/core/storage/file-validator'
import { prisma } from '@/core/database/prisma'
import { ValidationError, NotFoundError } from '@/core/errors/custom-errors'
import { mediaQueries } from './queries'
import { requireCmsUpdate } from '@/features/cms/access'

export const mediaService = {
  async uploadMedia(file: File, userId: string) {
    await requireCmsUpdate(userId)

    const validation = validateImage(file)
    if (!validation.valid) {
      throw new ValidationError(validation.error || 'File tidak valid.')
    }

    const folder = 'media-library'
    const uploaded = await storageService.uploadImage(file, folder)

    const [asset] = await prisma.$transaction([
      prisma.mediaAsset.create({
        data: {
          publicId: uploaded.publicId,
          url: uploaded.url,
          secureUrl: uploaded.secureUrl,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          width: uploaded.width,
          height: uploaded.height,
          folder: `ikmi/${folder}`,
          uploadedBy: userId,
          createdBy: userId,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'MediaAsset',
          entityId: uploaded.publicId,
          newData: JSON.stringify({ filename: file.name, url: uploaded.secureUrl }),
          userId,
        },
      }),
    ])

    return asset
  },

  async deleteMedia(id: string, userId: string) {
    await requireCmsUpdate(userId)

    const asset = await mediaQueries.getMediaAssetById(id)
    if (!asset) throw new NotFoundError('Media tidak ditemukan.')

    await storageService.deleteFile(asset.publicId)

    const [deletedAsset] = await prisma.$transaction([
      prisma.mediaAsset.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: userId,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'MediaAsset',
          entityId: id,
          oldData: JSON.stringify(asset),
          userId,
        },
      }),
    ])

    return deletedAsset
  },
}
