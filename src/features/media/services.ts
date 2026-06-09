import type { UploadApiResponse } from 'cloudinary'
import { cloudinary } from '@/core/storage/cloudinary'
import { validateImage } from '@/core/storage/file-validator'
import { prisma } from '@/core/database/prisma'
import { ValidationError, NotFoundError } from '@/core/errors/custom-errors'
import { mediaQueries } from './queries'
import { requireCmsUpdate } from '@/features/cms/access'

function uploadToCloudinary(file: File, folder: string): Promise<UploadApiResponse> {
  return file.arrayBuffer().then((arrayBuffer) => new Promise((resolve, reject) => {
    const buffer = Buffer.from(arrayBuffer)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error)
        else if (result) resolve(result)
        else reject(new Error('Upload Cloudinary gagal.'))
      },
    )

    uploadStream.end(buffer)
  }))
}

export const mediaService = {
  async uploadMedia(file: File, userId: string) {
    await requireCmsUpdate(userId)

    const validation = validateImage(file)
    if (!validation.valid) {
      throw new ValidationError(validation.error || 'File tidak valid.')
    }

    const folder = 'ikmi-cirebon/cms'
    const uploaded = await uploadToCloudinary(file, folder)

    const [asset] = await prisma.$transaction([
      prisma.mediaAsset.create({
        data: {
          publicId: uploaded.public_id,
          url: uploaded.url,
          secureUrl: uploaded.secure_url,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          width: uploaded.width,
          height: uploaded.height,
          folder,
          uploadedBy: userId,
          createdBy: userId,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'MediaAsset',
          entityId: uploaded.public_id,
          newData: JSON.stringify({ filename: file.name, url: uploaded.secure_url }),
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

    await cloudinary.uploader.destroy(asset.publicId, { resource_type: 'image' })

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
