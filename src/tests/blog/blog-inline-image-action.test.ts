jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn() }))
jest.mock('@/core/security/rate-limiter', () => ({ rateLimit: jest.fn() }))
jest.mock('@/core/storage/file-validator', () => ({ validateImageSignature: jest.fn() }))
jest.mock('@/core/storage/storage-service', () => ({
  cloudinaryFolders: { blog: 'blog' },
  storageService: { uploadImage: jest.fn() },
}))
jest.mock('@/features/blog/services', () => ({ blogService: {} }))

import { uploadPostInlineImageAction } from '@/features/blog/actions'

const { requirePermission: mockRequirePermission } = jest.requireMock('@/core/authorization/guards')
const { rateLimit: mockRateLimit } = jest.requireMock('@/core/security/rate-limiter')
const { validateImageSignature: mockValidateImageSignature } = jest.requireMock('@/core/storage/file-validator')
const { storageService: { uploadImage: mockUploadImage } } = jest.requireMock('@/core/storage/storage-service')

describe('CMS inline image upload boundary', () => {
  beforeEach(() => {
    mockRequirePermission.mockResolvedValue({ id: 'komdigi-1' })
    mockRateLimit.mockResolvedValue(undefined)
    mockValidateImageSignature.mockResolvedValue({ valid: true })
    mockUploadImage.mockResolvedValue({ secureUrl: 'https://res.cloudinary.com/ikmi/image/upload/cms.png', publicId: 'blog/cms-image' })
  })

  it('requires CMS permission, rate-limits, validates the file, and returns a stable URL', async () => {
    const formData = new FormData()
    formData.append('file', new File(['image'], 'cms.png', { type: 'image/png' }))

    await expect(uploadPostInlineImageAction(formData)).resolves.toEqual({ success: true, url: 'https://res.cloudinary.com/ikmi/image/upload/cms.png', publicId: 'blog/cms-image' })
    expect(mockRequirePermission).toHaveBeenCalledWith('post.create')
    expect(mockRateLimit).toHaveBeenCalledWith('cms:post:inline-image:komdigi-1', 60, 3600)
    expect(mockValidateImageSignature).toHaveBeenCalledWith(expect.any(File))
    expect(mockUploadImage).toHaveBeenCalledWith(expect.any(File), 'blog')
  })

  it('does not upload a file that fails signature validation', async () => {
    mockValidateImageSignature.mockResolvedValueOnce({ valid: false, error: 'Signature gambar tidak valid.' })
    const formData = new FormData()
    formData.append('file', new File(['bad'], 'bad.png', { type: 'image/png' }))

    await expect(uploadPostInlineImageAction(formData)).resolves.toEqual({ error: 'Signature gambar tidak valid.' })
    expect(mockUploadImage).not.toHaveBeenCalled()
  })
})
