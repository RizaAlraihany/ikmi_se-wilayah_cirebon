/* eslint-disable @typescript-eslint/no-explicit-any */
import { KaryaTulisStatus, Prisma } from '@prisma/client'
import { cache } from '@/core/cache/cache'
import { prismaMock } from '../prisma-mock'

jest.mock('next/headers', () => ({ headers: jest.fn(async () => new Headers({ 'x-forwarded-for': '127.0.0.1' })) }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/core/security/rate-limiter', () => ({ rateLimit: jest.fn() }))
jest.mock('@/core/storage/file-validator', () => ({ validateDocumentSignature: jest.fn(), validateImageSignature: jest.fn() }))
jest.mock('@/core/storage/storage-service', () => ({
  cloudinaryFolders: { writingSubmissions: 'writing-submissions' },
  DOCX_IMPORT_ROOT: 'writing-submissions/docx-imports',
  isDocxImportSessionId: jest.fn(() => true),
  getDocxImportPublicIdFromUrl: jest.fn((url: string, sessionId: string) => {
    const match = url.match(/docx-imports\/([^/]+)\/([^/]+)\.(?:jpe?g|png|webp)(?:\?|$)/i)
    return match && match[1] === sessionId ? `ikmi/writing-submissions/docx-imports/${match[1]}/${match[2]}` : null
  }),
  getDocxImportSessionIdFromUrl: jest.fn((url: string) => url.match(/docx-imports\/([^/]+)\//)?.[1] || null),
  isDocxImportTemporaryUrl: jest.fn(() => true),
  isOwnedDocxImportPublicId: jest.fn(() => true),
  storageService: {
    uploadPrivateDocument: jest.fn(),
    uploadImage: jest.fn(),
    deleteFile: jest.fn(),
    deleteDocxImportAssets: jest.fn(),
    cleanupStaleDocxImportAssets: jest.fn(),
  },
}))
jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn() }))
jest.mock('@/core/auth/roles', () => ({ isKomdigiAdminRole: jest.fn(() => true), isSuperAdminRole: jest.fn(() => false) }))

import { createArticleDraftFromKaryaTulisAction, discardWritingDocxImportAction, importWritingDocxAction, submitKaryaTulisAction, uploadWritingInlineImageAction } from '@/features/kirim-tulisan/actions'
import { createDocxImportAssetManifest } from '@/features/kirim-tulisan/docx-import'

const { rateLimit: mockRateLimit } = jest.requireMock('@/core/security/rate-limiter')
const { validateDocumentSignature: mockValidateDocumentSignature, validateImageSignature: mockValidateImageSignature } = jest.requireMock('@/core/storage/file-validator')
const { storageService: { uploadPrivateDocument: mockUploadPrivateDocument, uploadImage: mockUploadImage, deleteFile: mockDeleteFile, deleteDocxImportAssets: mockDeleteDocxImportAssets, cleanupStaleDocxImportAssets: mockCleanupStaleDocxImportAssets } } = jest.requireMock('@/core/storage/storage-service')
const { requirePermission: mockRequirePermission } = jest.requireMock('@/core/authorization/guards')

const metadata = {
  title: 'Kajian Organisasi Mahasiswa',
  category: 'Kajian',
  authorName: 'Penulis IKMI',
  authorEmail: 'penulis@example.test',
  authorWhatsapp: '081234567890',
  authorStatus: 'Anggota',
  consent: 'on',
}

function submissionForm(content = '') {
  const formData = new FormData()
  for (const [key, value] of Object.entries(metadata)) formData.append(key, value)
  formData.append('content', content)
  return formData
}

function validDocument(name = 'naskah.pdf') {
  return new File(['dokumen'], name, { type: name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

function importedImageFields(sessionId: string, filename = 'image-1.png') {
  const publicId = `ikmi/writing-submissions/docx-imports/${sessionId}/${filename.replace(/\.[^.]+$/, '')}`
  const url = `https://res.cloudinary.com/ikmi/image/upload/v1/${publicId}.${filename.split('.').pop()}`
  return { publicId, url, manifest: createDocxImportAssetManifest(sessionId, [{ publicId, url }]) }
}

describe('WritingSubmission action behavior', () => {
  beforeEach(async () => {
    const storageMock = jest.requireMock('@/core/storage/storage-service') as {
      getDocxImportPublicIdFromUrl: jest.Mock
      getDocxImportSessionIdFromUrl: jest.Mock
    }
    storageMock.getDocxImportSessionIdFromUrl.mockImplementation((url: string) => url.match(/docx-imports\/([^/]+)\//)?.[1] || null)
    storageMock.getDocxImportPublicIdFromUrl.mockImplementation((url: string, sessionId: string) => {
      const match = url.match(/docx-imports\/([^/]+)\/([^/]+)\.(?:jpe?g|png|webp)(?:\?|$)/i)
      return match && match[1] === sessionId ? `ikmi/writing-submissions/docx-imports/${match[1]}/${match[2]}` : null
    })
    mockRateLimit.mockResolvedValue(undefined)
    mockValidateDocumentSignature.mockResolvedValue({ valid: true })
    mockValidateImageSignature.mockResolvedValue({ valid: true })
    mockUploadPrivateDocument.mockResolvedValue({ publicId: 'writing/submission-1' })
    mockUploadImage.mockResolvedValue({ secureUrl: 'https://res.cloudinary.com/ikmi/image/upload/article.png', publicId: 'writing/image-1' })
    mockDeleteFile.mockResolvedValue(undefined)
    mockDeleteDocxImportAssets.mockResolvedValue(undefined)
    mockRequirePermission.mockResolvedValue({ id: 'editor-1', roleId: 'admin_komdigi' })
    prismaMock.$transaction.mockImplementation(async (callback: any) => Array.isArray(callback) ? Promise.all(callback) : callback(prismaMock))
    prismaMock.karyaTulis.findFirst.mockResolvedValue(null as any)
    prismaMock.karyaTulis.create.mockResolvedValue({ id: 'submission-1', submissionNumber: 'IKMI-KT-2026-0001' } as any)
    prismaMock.karyaTulisVersion.create.mockResolvedValue({} as any)
    prismaMock.auditLog.create.mockResolvedValue({} as any)
    await cache.clear()
  })

  it('persists sanitized direct-writing HTML without an attachment', async () => {
    const result = await submitKaryaTulisAction(submissionForm('<h1>Judul body</h1><p onclick="alert(1)">Isi tulisan yang cukup aman.</p><img src="data:image/png;base64,AAAA" alt="Tidak boleh">'))

    expect(result).toEqual(expect.objectContaining({ success: true }))
    const persisted = prismaMock.karyaTulis.create.mock.calls[0][0].data.content
    expect(persisted).toContain('<h2>Judul body</h2>')
    expect(persisted).not.toMatch(/data:image|onclick|<img/i)
    expect(prismaMock.karyaTulis.create.mock.calls[0][0].data.filePublicId).toBeNull()
  })

  it('accepts a valid file-only submission without fabricating article content', async () => {
    const formData = submissionForm()
    formData.append('file', validDocument())

    const result = await submitKaryaTulisAction(formData)

    expect(result).toEqual(expect.objectContaining({ success: true }))
    expect(mockValidateDocumentSignature).toHaveBeenCalledWith(expect.any(File))
    expect(mockUploadPrivateDocument).toHaveBeenCalledWith(expect.any(File), 'writing-submissions')
    expect(prismaMock.karyaTulis.create.mock.calls[0][0].data.content).toBeNull()
    expect(prismaMock.karyaTulisVersion.create).toHaveBeenCalled()
  })

  it('accepts content plus a valid source document', async () => {
    const formData = submissionForm('<p>Isi tulisan yang cukup untuk dikirim.</p>')
    formData.append('file', validDocument('naskah.docx'))

    await expect(submitKaryaTulisAction(formData)).resolves.toEqual(expect.objectContaining({ success: true }))
    expect(prismaMock.karyaTulis.create.mock.calls[0][0].data.content).toContain('Isi tulisan')
    expect(prismaMock.karyaTulis.create.mock.calls[0][0].data.filePublicId).toBe('writing/submission-1')
  })

  it('persists valid image-only imported content and finalizes its exact asset', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000010'
    const image = importedImageFields(sessionId)
    const formData = submissionForm(`<figure><img src="${image.url}" alt="Dokumentasi" /></figure>`)
    formData.append('docxImportSessionId', sessionId)
    formData.append('docxImportManifest', image.manifest)

    await expect(submitKaryaTulisAction(formData)).resolves.toEqual(expect.objectContaining({ success: true }))
    expect(prismaMock.karyaTulis.create.mock.calls[0][0].data.content).toContain(image.url)
    expect(mockDeleteDocxImportAssets).toHaveBeenCalledWith(sessionId, [image.publicId])
  })

  it('rejects invalid image-only content after the server sanitizer removes it', async () => {
    const result = await submitKaryaTulisAction(submissionForm('<figure><img src="data:image/png;base64,AAAA" alt="Tidak boleh" /></figure>'))

    expect(result).toEqual({ success: false, error: 'Isi tulisan atau dokumen wajib dikirim.' })
    expect(prismaMock.karyaTulis.create).not.toHaveBeenCalled()
  })

  it('retries finalization after a transient storage failure without failing the durable submission', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000011'
    const image = importedImageFields(sessionId, 'image-2.jpeg')
    mockDeleteDocxImportAssets.mockRejectedValueOnce(new Error('temporary Cloudinary failure')).mockResolvedValueOnce(undefined)
    const formData = submissionForm(`<p>Artikel dengan gambar.</p><img src="${image.url}" alt="Dokumentasi" />`)
    formData.append('docxImportSessionId', sessionId)
    formData.append('docxImportManifest', image.manifest)

    await expect(submitKaryaTulisAction(formData)).resolves.toEqual(expect.objectContaining({ success: true }))
    expect(mockDeleteDocxImportAssets).toHaveBeenCalledTimes(2)
  })

  it('protects a persisted image during a later stale sweep when finalization remains unavailable', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000014'
    const image = importedImageFields(sessionId, 'image-3.png')
    mockDeleteDocxImportAssets.mockRejectedValue(new Error('Cloudinary unavailable'))
    const formData = submissionForm(`<p>Artikel tersimpan.</p><img src="${image.url}" alt="Dokumentasi" />`)
    formData.append('docxImportSessionId', sessionId)
    formData.append('docxImportManifest', image.manifest)

    await expect(submitKaryaTulisAction(formData)).resolves.toEqual(expect.objectContaining({ success: true }))
    expect(mockDeleteDocxImportAssets).toHaveBeenCalledTimes(3)

    const storageMock = jest.requireMock('@/core/storage/storage-service') as {
      getDocxImportSessionIdFromUrl: jest.Mock
      getDocxImportPublicIdFromUrl: jest.Mock
    }
    storageMock.getDocxImportSessionIdFromUrl.mockImplementation((url: string) => url.match(/docx-imports\/([^/]+)\//)?.[1] || null)
    storageMock.getDocxImportPublicIdFromUrl.mockReturnValue(image.publicId)
    prismaMock.karyaTulis.findMany.mockResolvedValue([{ content: `<img src="${image.url}" alt="Dokumentasi" />` }] as any)
    prismaMock.post.findMany.mockResolvedValue([] as any)
    const invalidImport = new FormData()
    invalidImport.append('file', new File(['not-a-docx'], 'retry.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))

    await importWritingDocxAction(invalidImport)

    expect(mockCleanupStaleDocxImportAssets).toHaveBeenCalledWith(expect.any(Date), [image.publicId])
  })

  it('does not finalize temporary images when database persistence fails', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000012'
    const image = importedImageFields(sessionId)
    prismaMock.$transaction.mockRejectedValueOnce(new Error('database unavailable'))
    const formData = submissionForm(`<p>Artikel yang cukup panjang.</p><img src="${image.url}" alt="Dokumentasi" />`)
    formData.append('docxImportSessionId', sessionId)
    formData.append('docxImportManifest', image.manifest)

    await expect(submitKaryaTulisAction(formData)).resolves.toEqual(expect.objectContaining({ success: false }))
    expect(mockDeleteDocxImportAssets).not.toHaveBeenCalled()
  })

  it('passes persisted DOCX image references to the fail-closed stale sweep', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000013'
    const image = importedImageFields(sessionId)
    const storageMock = jest.requireMock('@/core/storage/storage-service') as {
      getDocxImportSessionIdFromUrl: jest.Mock
      getDocxImportPublicIdFromUrl: jest.Mock
      storageService: { cleanupStaleDocxImportAssets: jest.Mock }
    }
    storageMock.getDocxImportSessionIdFromUrl.mockImplementation((url: string) => url.match(/docx-imports\/([^/]+)\//)?.[1] || null)
    storageMock.getDocxImportPublicIdFromUrl.mockReturnValue(image.publicId)
    prismaMock.karyaTulis.findMany.mockResolvedValue([{ content: `<img src="${image.url}" alt="Dokumentasi" />` }] as any)
    prismaMock.post.findMany.mockResolvedValue([] as any)

    const importForm = new FormData()
    importForm.append('file', new File(['not-a-docx'], 'invalid.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
    await importWritingDocxAction(importForm)

    expect(storageMock.storageService.cleanupStaleDocxImportAssets).toHaveBeenCalledWith(expect.any(Date), [image.publicId])
  })

  it('removes imported images edited out before submit', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000001'
    const formData = submissionForm('<p>Isi artikel setelah gambar dihapus.</p>')
    formData.append('docxImportSessionId', sessionId)
    formData.append('docxImportManifest', createDocxImportAssetManifest(sessionId, []))

    await expect(submitKaryaTulisAction(formData)).resolves.toEqual(expect.objectContaining({ success: true }))
    expect(mockDeleteDocxImportAssets).toHaveBeenCalledWith(sessionId, [])
  })

  it('requires the signed manifest to match the session before discarding DOCX assets', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000015'
    const otherSessionId = '00000000-0000-4000-8000-000000000016'
    const current = importedImageFields(sessionId)
    const other = importedImageFields(otherSessionId)

    await expect(discardWritingDocxImportAction(sessionId, current.manifest)).resolves.toEqual({ success: true })
    expect(mockDeleteDocxImportAssets).toHaveBeenCalledWith(sessionId, [])

    mockDeleteDocxImportAssets.mockClear()
    await expect(discardWritingDocxImportAction(sessionId, other.manifest)).resolves.toEqual({ success: false, error: 'Sesi impor DOCX tidak valid atau sudah kedaluwarsa.' })
    expect(mockDeleteDocxImportAssets).not.toHaveBeenCalled()
    expect(mockDeleteFile).not.toHaveBeenCalled()
  })

  it('keeps a temporary asset referenced by persisted KaryaTulis content', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000026'
    const image = importedImageFields(sessionId)
    prismaMock.karyaTulis.findMany.mockResolvedValue([{ content: `<p>Tulisan tersimpan.</p><img src="${image.url}" alt="Foto" />` }] as any)
    prismaMock.post.findMany.mockResolvedValue([] as any)

    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: true })

    expect(mockDeleteDocxImportAssets).toHaveBeenCalledWith(sessionId, [image.publicId])
  })

  it('keeps a temporary asset referenced by the linked persisted Post', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000027'
    const image = importedImageFields(sessionId)
    prismaMock.karyaTulis.findMany.mockResolvedValue([] as any)
    prismaMock.post.findMany.mockResolvedValue([{
      content: `<p>Artikel draft.</p><figure><img src="${image.url}" /></figure>`,
      writingSubmissionId: 'submission-1',
    }] as any)

    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: true })

    expect(mockDeleteDocxImportAssets).toHaveBeenCalledWith(sessionId, [image.publicId])
  })

  it('does not let another session reference protect the current session asset', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000028'
    const otherSessionId = '00000000-0000-4000-8000-000000000029'
    const current = importedImageFields(sessionId)
    const other = importedImageFields(otherSessionId)
    prismaMock.karyaTulis.findMany.mockResolvedValue([{ content: `<img src="${other.url}" alt="Sesi lain" />` }] as any)
    prismaMock.post.findMany.mockResolvedValue([] as any)

    await expect(discardWritingDocxImportAction(sessionId, current.manifest)).resolves.toEqual({ success: true })

    expect(mockDeleteDocxImportAssets).toHaveBeenCalledWith(sessionId, [])
  })

  it('does not let unrelated Post media claim a DOCX import asset', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000030'
    const image = importedImageFields(sessionId)
    prismaMock.karyaTulis.findMany.mockResolvedValue([] as any)
    prismaMock.post.findMany.mockResolvedValue([{
      content: `<img src="${image.url}" alt="Media manual" />`,
      writingSubmissionId: null,
    }] as any)

    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: true })

    expect(mockDeleteDocxImportAssets).toHaveBeenCalledWith(sessionId, [])
  })

  it('does not repeat cleanup when the same verified manifest is replayed', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000017'
    const image = importedImageFields(sessionId)

    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: true })
    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: true, alreadyDiscarded: true })
    expect(mockDeleteDocxImportAssets).toHaveBeenCalledTimes(1)
  })

  it('does not repeat cleanup or reference lookup when a protected discard is replayed', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000031'
    const image = importedImageFields(sessionId)
    prismaMock.karyaTulis.findMany.mockResolvedValue([{ content: `<img src="${image.url}" alt="Persisten" />` }] as any)
    prismaMock.post.findMany.mockResolvedValue([] as any)

    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: true })
    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: true, alreadyDiscarded: true })

    expect(mockDeleteDocxImportAssets).toHaveBeenCalledTimes(1)
    expect(prismaMock.karyaTulis.findMany).toHaveBeenCalledTimes(1)
    expect(prismaMock.post.findMany).toHaveBeenCalledTimes(1)
  })

  it('prevents concurrent cleanup for the same verified manifest', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000018'
    const image = importedImageFields(sessionId)
    let resolveCleanup!: () => void
    let resolveStarted!: () => void
    const cleanupStarted = new Promise<void>((resolve) => { resolveStarted = resolve })
    mockDeleteDocxImportAssets.mockImplementationOnce(async () => {
      resolveStarted()
      await new Promise<void>((resolve) => { resolveCleanup = resolve })
    })

    const first = discardWritingDocxImportAction(sessionId, image.manifest)
    await cleanupStarted
    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: false, error: 'Pembersihan gambar sementara sedang diproses. Silakan coba lagi.' })
    resolveCleanup()
    await expect(first).resolves.toEqual({ success: true })
    expect(mockDeleteDocxImportAssets).toHaveBeenCalledTimes(1)
  })

  it('keeps different verified sessions independently usable', async () => {
    const first = importedImageFields('00000000-0000-4000-8000-000000000019')
    const second = importedImageFields('00000000-0000-4000-8000-000000000020')

    await expect(discardWritingDocxImportAction('00000000-0000-4000-8000-000000000019', first.manifest)).resolves.toEqual({ success: true })
    await expect(discardWritingDocxImportAction('00000000-0000-4000-8000-000000000020', second.manifest)).resolves.toEqual({ success: true })
    expect(mockDeleteDocxImportAssets).toHaveBeenNthCalledWith(1, '00000000-0000-4000-8000-000000000019', [])
    expect(mockDeleteDocxImportAssets).toHaveBeenNthCalledWith(2, '00000000-0000-4000-8000-000000000020', [])
  })

  it('leaves a failed cleanup retryable and consumes only after success', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000021'
    const image = importedImageFields(sessionId)
    mockDeleteDocxImportAssets.mockRejectedValueOnce(new Error('temporary Cloudinary failure')).mockResolvedValueOnce(undefined)

    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: false, error: 'Gambar sementara belum dapat dibersihkan.' })
    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: true })
    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: true, alreadyDiscarded: true })
    expect(mockDeleteDocxImportAssets).toHaveBeenCalledTimes(2)
  })

  it('rejects malformed, tampered, expired, and cross-session manifests before cleanup', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000022'
    const otherSessionId = '00000000-0000-4000-8000-000000000023'
    const image = importedImageFields(sessionId)
    const other = importedImageFields(otherSessionId)

    await expect(discardWritingDocxImportAction(sessionId, 'not-a-manifest')).resolves.toEqual({ success: false, error: 'Sesi impor DOCX tidak valid atau sudah kedaluwarsa.' })
    await expect(discardWritingDocxImportAction(sessionId, image.manifest + '.extra')).resolves.toEqual({ success: false, error: 'Sesi impor DOCX tidak valid atau sudah kedaluwarsa.' })
    const [payload, signature] = image.manifest.split('.')
    const tamperedPayload = payload.slice(0, -1) + (payload.endsWith('A') ? 'B' : 'A')
    await expect(discardWritingDocxImportAction(sessionId, `${tamperedPayload}.${signature}`)).resolves.toEqual({ success: false, error: 'Sesi impor DOCX tidak valid atau sudah kedaluwarsa.' })
    const now = Date.now()
    const expiredManifest = createDocxImportAssetManifest(sessionId, [{ publicId: image.publicId, url: image.url }])
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(now + 8 * 24 * 60 * 60 * 1000)
    await expect(discardWritingDocxImportAction(sessionId, expiredManifest)).resolves.toEqual({ success: false, error: 'Sesi impor DOCX tidak valid atau sudah kedaluwarsa.' })
    dateSpy.mockReturnValue(now)
    await expect(discardWritingDocxImportAction(sessionId, other.manifest)).resolves.toEqual({ success: false, error: 'Sesi impor DOCX tidak valid atau sudah kedaluwarsa.' })
    dateSpy.mockRestore()
    expect(mockDeleteDocxImportAssets).not.toHaveBeenCalled()
  })

  it('rate-limits a valid discard before any Cloudinary operation', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000024'
    const image = importedImageFields(sessionId)
    mockRateLimit.mockRejectedValueOnce(new Error('Terlalu banyak permintaan. Silakan coba lagi nanti.'))

    await expect(discardWritingDocxImportAction(sessionId, image.manifest)).resolves.toEqual({ success: false, error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' })
    expect(mockDeleteDocxImportAssets).not.toHaveBeenCalled()
    expect(prismaMock.karyaTulis.findMany).not.toHaveBeenCalled()
    expect(prismaMock.post.findMany).not.toHaveBeenCalled()
  })

  it('rejects a signed manifest for a non-DOCX asset namespace', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000025'
    const storageMock = jest.requireMock('@/core/storage/storage-service') as { isOwnedDocxImportPublicId: jest.Mock }
    storageMock.isOwnedDocxImportPublicId.mockReturnValueOnce(false)
    const manifest = createDocxImportAssetManifest(sessionId, [{
      publicId: 'ikmi/blog/committed-image',
      url: 'https://res.cloudinary.com/ikmi/image/upload/v1/ikmi/blog/committed-image.png',
    }])

    await expect(discardWritingDocxImportAction(sessionId, manifest)).resolves.toEqual({ success: false, error: 'Sesi impor DOCX tidak valid atau sudah kedaluwarsa.' })
    expect(mockDeleteDocxImportAssets).not.toHaveBeenCalled()
  })

  it('keeps an imported image that remains referenced after submit', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000002'
    const image = importedImageFields(sessionId)
    const retainedPublicId = image.publicId
    const formData = submissionForm(`<p>Isi artikel.</p><figure><img src="${image.url}" alt="Foto" /></figure>`)
    formData.append('docxImportSessionId', sessionId)
    formData.append('docxImportManifest', image.manifest)

    await expect(submitKaryaTulisAction(formData)).resolves.toEqual(expect.objectContaining({ success: true }))
    expect(mockDeleteDocxImportAssets).toHaveBeenCalledWith(sessionId, [retainedPublicId])
  })

  it('rejects a submission with neither meaningful content nor a file', async () => {
    await expect(submitKaryaTulisAction(submissionForm('<p></p>'))).resolves.toEqual({ success: false, error: 'Isi tulisan atau dokumen wajib dikirim.' })
    expect(prismaMock.karyaTulis.create).not.toHaveBeenCalled()
  })

  it('rejects an invalid file before persistence', async () => {
    mockValidateDocumentSignature.mockResolvedValueOnce({ valid: false, error: 'Signature PDF tidak valid.' })
    const formData = submissionForm()
    formData.append('file', validDocument())

    await expect(submitKaryaTulisAction(formData)).resolves.toEqual({ success: false, error: 'Signature PDF tidak valid.' })
    expect(mockUploadPrivateDocument).not.toHaveBeenCalled()
    expect(prismaMock.karyaTulis.create).not.toHaveBeenCalled()
  })

  it('rate-limits and validates public inline image uploads before storing a stable URL', async () => {
    const formData = new FormData()
    formData.append('file', new File(['image'], 'artikel.png', { type: 'image/png' }))

    await expect(uploadWritingInlineImageAction(formData)).resolves.toEqual(expect.objectContaining({ success: true, url: 'https://res.cloudinary.com/ikmi/image/upload/article.png' }))
    expect(mockRateLimit).toHaveBeenCalledWith('kirim_tulisan_inline_image_127.0.0.1', 20, 3600)
    expect(mockValidateImageSignature).toHaveBeenCalledWith(expect.any(File))
    expect(mockUploadImage).toHaveBeenCalledWith(expect.any(File), 'writing-submissions')
  })

  it('returns the existing draft on repeat conversion and on a unique-race conflict', async () => {
    const approved = { id: 'submission-1', submissionNumber: 'IKMI-KT-2026-0001', title: 'Judul Kiriman', content: '<p>Isi yang disetujui.</p>', category: 'Kajian', summary: null, authorName: 'Penulis IKMI', status: KaryaTulisStatus.APPROVED, articleDraft: null }
    prismaMock.karyaTulis.findFirst.mockResolvedValueOnce(approved as any)
    prismaMock.category.findFirst.mockResolvedValueOnce({ id: 'category-1' } as any)
    prismaMock.post.create.mockResolvedValueOnce({ id: 'post-1' } as any)
    prismaMock.karyaTulis.update.mockResolvedValue({} as any)

    await expect(createArticleDraftFromKaryaTulisAction('submission-1')).resolves.toEqual({ success: true, postId: 'post-1', existing: false })
    expect(prismaMock.post.create.mock.calls[0][0].data).toEqual(expect.objectContaining({ content: '<p>Isi yang disetujui.</p>', status: 'DRAFT', writingSubmissionId: 'submission-1' }))

    prismaMock.karyaTulis.findFirst.mockResolvedValueOnce({ ...approved, articleDraft: { id: 'post-1' } } as any)
    await expect(createArticleDraftFromKaryaTulisAction('submission-1')).resolves.toEqual({ success: true, postId: 'post-1', existing: true })

    prismaMock.karyaTulis.findFirst.mockResolvedValueOnce(approved as any)
    prismaMock.category.findFirst.mockResolvedValueOnce({ id: 'category-1' } as any)
    prismaMock.$transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Unique race', { code: 'P2002', clientVersion: '6.4.0' }))
    prismaMock.post.findFirst.mockResolvedValueOnce({ id: 'post-1' } as any)
    await expect(createArticleDraftFromKaryaTulisAction('submission-1')).resolves.toEqual({ success: true, postId: 'post-1', existing: true })
  })
})
