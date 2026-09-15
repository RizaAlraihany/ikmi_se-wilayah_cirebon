jest.mock('@/core/storage/cloudinary', () => ({ cloudinary: {
  url: jest.fn().mockReturnValue('https://res.cloudinary.com/test/image/upload/f_auto/photo.jpg'),
  uploader: { upload_stream: jest.fn() },
} }))

import { storageService } from '@/core/storage/storage-service'
const { cloudinary } = jest.requireMock('@/core/storage/cloudinary')

describe('HEIC delivery keeps storage access type', () => {
  const file = { name: 'camera.heic', type: 'image/heic', arrayBuffer: async () => new ArrayBuffer(20) } as File
  beforeEach(() => {
    cloudinary.uploader.upload_stream.mockImplementation((options: { type?: string }, callback: (error: null, result: unknown) => void) => ({
      end: () => callback(null, { public_id: 'ikmi/photo', secure_url: `https://res.cloudinary.com/test/image/${options.type || 'upload'}/photo.heic` }),
    }))
  })
  it('returns browser-compatible public images with a JPEG fallback', async () => {
    await storageService.uploadImage(file)
    expect(cloudinary.url).toHaveBeenCalledWith('ikmi/photo', expect.objectContaining({ format: 'jpg', transformation: [{ fetch_format: 'auto' }] }))
  })
  it('does not turn a private upload into an unsigned public URL', async () => {
    const result = await storageService.uploadPrivateImage(file)
    expect(result.secureUrl).toContain('/authenticated/')
    expect(cloudinary.url).not.toHaveBeenCalled()
  })
  it('signs image derivatives only when an authorized private URL is requested', () => {
    storageService.getPrivateFileUrl('ikmi/photo', 'image')
    expect(cloudinary.url).toHaveBeenCalledWith('ikmi/photo', expect.objectContaining({ type: 'authenticated', sign_url: true, format: 'jpg' }))
  })
})
