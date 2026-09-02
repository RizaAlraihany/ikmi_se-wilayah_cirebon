/* eslint-disable @typescript-eslint/no-explicit-any */
import { KaryaTulisStatus, Prisma } from '@prisma/client'
import { prismaMock } from '../prisma-mock'

jest.mock('next/headers', () => ({ headers: jest.fn(async () => new Headers({ 'x-forwarded-for': '127.0.0.1' })) }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/core/security/rate-limiter', () => ({ rateLimit: jest.fn() }))
jest.mock('@/core/storage/file-validator', () => ({ validateDocumentSignature: jest.fn(), validateImageSignature: jest.fn() }))
jest.mock('@/core/storage/storage-service', () => ({
  cloudinaryFolders: { writingSubmissions: 'writing-submissions' },
  storageService: { uploadPrivateDocument: jest.fn(), uploadImage: jest.fn(), deleteFile: jest.fn() },
}))
jest.mock('@/core/authorization/guards', () => ({ requirePermission: jest.fn() }))
jest.mock('@/core/auth/roles', () => ({ isKomdigiAdminRole: jest.fn(() => true), isSuperAdminRole: jest.fn(() => false) }))

import { createArticleDraftFromKaryaTulisAction, submitKaryaTulisAction, uploadWritingInlineImageAction } from '@/features/kirim-tulisan/actions'

const { rateLimit: mockRateLimit } = jest.requireMock('@/core/security/rate-limiter')
const { validateDocumentSignature: mockValidateDocumentSignature, validateImageSignature: mockValidateImageSignature } = jest.requireMock('@/core/storage/file-validator')
const { storageService: { uploadPrivateDocument: mockUploadPrivateDocument, uploadImage: mockUploadImage, deleteFile: mockDeleteFile } } = jest.requireMock('@/core/storage/storage-service')
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

describe('WritingSubmission action behavior', () => {
  beforeEach(() => {
    mockRateLimit.mockResolvedValue(undefined)
    mockValidateDocumentSignature.mockResolvedValue({ valid: true })
    mockValidateImageSignature.mockResolvedValue({ valid: true })
    mockUploadPrivateDocument.mockResolvedValue({ publicId: 'writing/submission-1' })
    mockUploadImage.mockResolvedValue({ secureUrl: 'https://res.cloudinary.com/ikmi/image/upload/article.png', publicId: 'writing/image-1' })
    mockDeleteFile.mockResolvedValue(undefined)
    mockRequirePermission.mockResolvedValue({ id: 'editor-1', roleId: 'admin_komdigi' })
    prismaMock.$transaction.mockImplementation(async (callback: any) => Array.isArray(callback) ? Promise.all(callback) : callback(prismaMock))
    prismaMock.karyaTulis.findFirst.mockResolvedValue(null as any)
    prismaMock.karyaTulis.create.mockResolvedValue({ id: 'submission-1', submissionNumber: 'IKMI-KT-2026-0001' } as any)
    prismaMock.karyaTulisVersion.create.mockResolvedValue({} as any)
    prismaMock.auditLog.create.mockResolvedValue({} as any)
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
