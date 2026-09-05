jest.mock('@/core/config/env', () => ({
  env: {
    CLOUDINARY_CLOUD_NAME: 'ikmi',
    CLOUDINARY_API_KEY: 'test-key',
    CLOUDINARY_API_SECRET: 'test-secret',
  },
}))

jest.mock('@/core/storage/cloudinary', () => ({
  cloudinary: {
    api: { resources: jest.fn() },
    uploader: {
      remove_tag: jest.fn((_tag: string, _ids: string[], _options: unknown, callback: (error?: Error | null) => void) => callback(null)),
      destroy: jest.fn((_id: string, _options: unknown, callback: (error?: Error | null) => void) => callback(null)),
    },
  },
}))

import {
  DOCX_IMPORT_TEMP_TAG,
  getDocxImportPublicIdFromUrl,
  storageService,
} from '@/core/storage/storage-service'

const { cloudinary } = jest.requireMock('@/core/storage/cloudinary') as {
  cloudinary: {
    api: { resources: jest.Mock }
    uploader: { remove_tag: jest.Mock; destroy: jest.Mock }
  }
}

describe('DOCX import storage ownership', () => {
  const sessionId = '00000000-0000-4000-8000-000000000021'
  const otherSessionId = '00000000-0000-4000-8000-000000000022'

  beforeEach(() => {
    cloudinary.api.resources.mockReset().mockResolvedValue({ resources: [] })
    cloudinary.uploader.remove_tag.mockClear()
    cloudinary.uploader.destroy.mockClear()
  })

  it.each([
    ['png', 'image-1.png'],
    ['jpeg', 'image-2.jpeg'],
    ['webp', 'image-3.webp'],
  ])('maps a versioned Cloudinary %s URL to its extensionless publicId', (_format, filename) => {
    const publicId = `ikmi/writing-submissions/docx-imports/${sessionId}/${filename.replace(/\.[^.]+$/, '')}`
    const url = `https://res.cloudinary.com/ikmi/image/upload/v123/${publicId}.${filename.split('.').pop()}`

    expect(getDocxImportPublicIdFromUrl(url, sessionId)).toBe(publicId)
  })

  it('transitions only current-session retained assets and deletes abandoned assets', async () => {
    const retained = `ikmi/writing-submissions/docx-imports/${sessionId}/image-1`
    const abandoned = `ikmi/writing-submissions/docx-imports/${sessionId}/image-2`
    const other = `ikmi/writing-submissions/docx-imports/${otherSessionId}/image-3`
    const committed = `ikmi/writing-submissions/docx-imports/${sessionId}/image-4`
    cloudinary.api.resources.mockResolvedValue({
      resources: [
        { public_id: retained, tags: [DOCX_IMPORT_TEMP_TAG] },
        { public_id: abandoned, tags: [DOCX_IMPORT_TEMP_TAG] },
        { public_id: other, tags: [DOCX_IMPORT_TEMP_TAG] },
        { public_id: committed, tags: [] },
      ],
    })

    await storageService.deleteDocxImportAssets(sessionId, [retained])

    expect(cloudinary.uploader.remove_tag).toHaveBeenCalledWith(DOCX_IMPORT_TEMP_TAG, [retained], expect.any(Object), expect.any(Function))
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(abandoned, { resource_type: 'image', type: 'upload' }, expect.any(Function))
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalledWith(other, expect.any(Object), expect.any(Function))
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalledWith(committed, expect.any(Object), expect.any(Function))
  })

  it('protects a stale persisted reference and deletes only an unreferenced temporary asset', async () => {
    const retained = `ikmi/writing-submissions/docx-imports/${sessionId}/image-1`
    const abandoned = `ikmi/writing-submissions/docx-imports/${sessionId}/image-2`
    const old = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    cloudinary.api.resources.mockResolvedValue({
      resources: [
        { public_id: retained, created_at: old, tags: [DOCX_IMPORT_TEMP_TAG] },
        { public_id: abandoned, created_at: old, tags: [DOCX_IMPORT_TEMP_TAG] },
      ],
    })

    await storageService.cleanupStaleDocxImportAssets(new Date(Date.now() - 24 * 60 * 60 * 1000), [retained])

    expect(cloudinary.uploader.remove_tag).toHaveBeenCalledWith(DOCX_IMPORT_TEMP_TAG, [retained], expect.any(Object), expect.any(Function))
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(abandoned, { resource_type: 'image', type: 'upload' }, expect.any(Function))
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalledWith(retained, expect.any(Object), expect.any(Function))
  })
})
