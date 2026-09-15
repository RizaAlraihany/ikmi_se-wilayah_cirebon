import { mediaService } from '@/features/media/services'
import { storageService } from '@/core/storage/storage-service'
import { prismaMock } from '../prisma-mock'

jest.mock('@/features/cms/access', () => ({ requireCmsUpdate: jest.fn().mockResolvedValue({ id: 'admin' }) }))
jest.mock('@/features/media/queries', () => ({ mediaQueries: { getMediaAssetById: jest.fn().mockResolvedValue({ id: 'asset', publicId: 'ikmi/photo' }) } }))
jest.mock('@/core/storage/storage-service', () => ({ storageService: { deleteFile: jest.fn() } }))

it('archives a library entry without breaking embedded publication image URLs', async () => {
  prismaMock.$transaction.mockResolvedValue([{ id: 'asset' }] as never)
  await mediaService.deleteMedia('asset', 'admin')
  expect(prismaMock.mediaAsset.update).toHaveBeenCalledWith({ where: { id: 'asset' }, data: { deletedAt: expect.any(Date), updatedBy: 'admin' } })
  expect(storageService.deleteFile).not.toHaveBeenCalled()
  expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ARCHIVE' }) }))
})
