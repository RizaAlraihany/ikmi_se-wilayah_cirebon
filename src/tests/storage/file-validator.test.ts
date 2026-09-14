import { MAX_IMAGE_SIZE, validateDocument, validateDocumentSignature, validateImage, validateImageSignature } from '@/core/storage/file-validator'

function signatureFile(name: string, type: string, bytes: number[]): File {
  return {
    name,
    type,
    size: bytes.length,
    slice: () => ({ arrayBuffer: async () => Uint8Array.from(bytes).buffer }),
  } as unknown as File
}

describe('file validator allow-lists', () => {
  it('requires an allowed document MIME type and extension', () => {
    expect(validateDocument(new File(['%PDF-'], 'notulen.pdf', { type: 'application/pdf' })).valid).toBe(true)
    expect(validateDocument(new File(['%PDF-'], 'notulen.doc', { type: 'application/pdf' })).valid).toBe(false)
    expect(validateDocument(new File(['%PDF-'], 'notulen.pdf', { type: 'application/msword' })).valid).toBe(false)
    expect(validateDocument(new File(['%PDF-'], 'notulen.docx', { type: 'application/pdf' })).valid).toBe(false)
  })

  it('requires an allowed image MIME type and extension', () => {
    expect(validateImage(new File(['image'], 'dokumentasi.webp', { type: 'image/webp' })).valid).toBe(true)
    expect(validateImage(new File(['image'], 'dokumentasi.heic', { type: 'image/heic' })).valid).toBe(true)
    expect(validateImage(new File(['image'], 'dokumentasi.heif', { type: 'image/heif' })).valid).toBe(true)
    expect(validateImage(new File(['image'], 'dokumentasi.svg', { type: 'image/webp' })).valid).toBe(false)
    expect(validateImage(new File(['image'], 'dokumentasi.png', { type: 'image/jpeg' })).valid).toBe(false)
  })

  it('validates HEIC/HEIF ISO-BMFF signatures', async () => {
    const heicSignature = [
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
      0x68, 0x65, 0x69, 0x63, 0x00, 0x00, 0x00, 0x00,
      0x6d, 0x69, 0x66, 0x31,
    ]
    await expect(validateImageSignature(signatureFile('foto.heic', 'image/heic', heicSignature))).resolves.toEqual({ valid: true })
    await expect(validateImageSignature(signatureFile('foto.heif', 'image/heif', heicSignature))).resolves.toEqual({ valid: true })
    await expect(validateImageSignature(signatureFile('foto.heic', 'image/heic', [0x00, 0x00, 0x00, 0x08, 0x6e, 0x6f, 0x70, 0x65]))).resolves.toEqual(expect.objectContaining({ valid: false }))
  })

  it('accepts dashboard photos up to 10 MB and rejects larger files', () => {
    expect(validateImage({ name: 'dokumentasi.jpg', type: 'image/jpeg', size: MAX_IMAGE_SIZE } as File)).toEqual({ valid: true })
    expect(validateImage({ name: 'dokumentasi.jpg', type: 'image/jpeg', size: MAX_IMAGE_SIZE + 1 } as File)).toEqual({ valid: false, error: 'Ukuran gambar maksimal 10 MB.' })
  })

  it('rejects a document whose magic bytes do not match its declared type', async () => {
    await expect(validateDocumentSignature(signatureFile('notulen.pdf', 'application/pdf', [0x62, 0x75, 0x6b, 0x61]))).resolves.toEqual(expect.objectContaining({ valid: false }))
    await expect(validateDocumentSignature(signatureFile('notulen.pdf', 'application/pdf', [0x25, 0x50, 0x44, 0x46]))).resolves.toEqual({ valid: true })
    await expect(validateDocumentSignature(signatureFile('kajian.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', [0x50, 0x4b, 0x03, 0x04]))).resolves.toEqual({ valid: true })
    await expect(validateDocumentSignature(signatureFile('virus.pdf', 'application/pdf', [0x4d, 0x5a, 0x90, 0x00]))).resolves.toEqual(expect.objectContaining({ valid: false }))
  })

  it('rejects documents larger than 10 MB', () => {
    const oversized = { name: 'kajian.pdf', type: 'application/pdf', size: 10 * 1024 * 1024 + 1 } as File
    expect(validateDocument(oversized)).toEqual(expect.objectContaining({ valid: false, error: 'Ukuran dokumen maksimal 10 MB.' }))
  })
})
