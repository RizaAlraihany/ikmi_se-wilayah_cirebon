import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { TextDecoder, TextEncoder } from 'node:util'
import JSZip from 'jszip'
import * as parse5 from 'parse5'
import { cleanupStaleDocxImportAssets, createDocxImportAssetManifest, discardDocxImportAssets, finalizeDocxImportAssets, importDocxSubmission, sanitizeDocxImportHtml, DocxImportError } from '../docx-import'

Object.assign(globalThis, { TextDecoder, TextEncoder })

jest.mock('@/core/storage/storage-service', () => ({
  cloudinaryFolders: { writingSubmissions: 'writing-submissions' },
  isDocxImportSessionId: jest.fn(() => true),
  getDocxImportPublicIdFromUrl: jest.fn((url: string, sessionId: string) => {
    const filename = url.match(/\/([^/]+)\.(?:jpe?g|png|webp)(?:\?|$)/i)?.[1]
    return filename ? `ikmi/writing-submissions/docx-imports/${sessionId}/${filename}` : null
  }),
  getDocxImportSessionIdFromUrl: jest.fn(() => '00000000-0000-4000-8000-000000000001'),
  isDocxImportTemporaryUrl: jest.fn(() => true),
  isOwnedDocxImportPublicId: jest.fn(() => true),
  storageService: {
    uploadDocxImportImage: jest.fn(),
    deleteDocxImportAssets: jest.fn(),
    deleteFile: jest.fn(),
    cleanupStaleDocxImportAssets: jest.fn(),
  },
}))

jest.mock('@/core/storage/file-validator', () => ({
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGE_SIZE: 2 * 1024 * 1024,
  validateDocumentSignature: jest.fn().mockResolvedValue({ valid: true }),
  validateImageSignature: jest.fn().mockResolvedValue({ valid: true }),
}))

const { storageService } = jest.requireMock('@/core/storage/storage-service') as {
  storageService: { uploadDocxImportImage: jest.Mock; deleteDocxImportAssets: jest.Mock; deleteFile: jest.Mock; cleanupStaleDocxImportAssets: jest.Mock }
}

function fileLike(name: string, bytes: Buffer, type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  return {
    name,
    type,
    size: bytes.byteLength,
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
    slice: (start = 0, end = bytes.byteLength) => ({
      arrayBuffer: async () => new Uint8Array(bytes.subarray(start, end)).buffer,
    }),
  } as unknown as File
}

function fixture(name: string, type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  return fileLike(name, readFileSync(path.resolve(process.cwd(), 'src/tests/fixtures/docx', name)), type)
}

function runRealImport(name: string) {
  const script = 'const fs = require("node:fs"); const Module = require("node:module"); const load = Module._load; Module._load = function(request, parent, isMain) { if (request === "server-only") return {}; return load.call(this, request, parent, isMain); }; const { importDocxSubmission } = require("./src/features/kirim-tulisan/docx-import.ts"); const file = new File([fs.readFileSync("./src/tests/fixtures/docx/' + name + '")], "' + name + '", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }); importDocxSubmission(file).then((result) => { console.log(JSON.stringify(result)); process.exit(0); }).catch((error) => { console.error(error); process.exit(1); });'
  return JSON.parse(execFileSync(process.execPath, ['-r', 'tsx/cjs', '--eval', script], {
    cwd: path.resolve(__dirname, '../../../..'),
    encoding: 'utf8',
  }).trim()) as { html: string; warnings: string[] }
}

describe('DOCX writing import', () => {
  beforeEach(() => {
    storageService.uploadDocxImportImage.mockReset().mockResolvedValue({
      secureUrl: 'https://res.cloudinary.com/ikmi/image/upload/v1/docx-image.png',
      publicId: 'writing-submissions/docx-image',
    })
    storageService.deleteDocxImportAssets.mockReset().mockResolvedValue(undefined)
    storageService.deleteFile.mockReset().mockResolvedValue(undefined)
    storageService.cleanupStaleDocxImportAssets.mockReset().mockResolvedValue(undefined)
  })

  it('extracts a Word Title into the separate title and keeps the body semantic', async () => {
    const result = await importDocxSubmission(fixture('title-style.docx'))

    expect(result.title).toBe('Digitalisasi Mahasiswa')
    expect(result.excerpt).toContain('Pembuka artikel')
    expect(result.html).not.toContain('Digitalisasi Mahasiswa')
    expect(result.html).toContain('<p>Pembuka artikel yang menjadi sumber ringkasan.</p>')
    expect(result.html).toContain('<strong><em>Tebal dan miring</em></strong>')
    expect(result.html).not.toContain('<h1')
  })

  it('consumes the first Heading 1 as title and normalizes the remaining hierarchy', async () => {
    const result = await importDocxSubmission(fixture('heading-hierarchy.docx'))

    expect(result.title).toBe('Judul dari Heading 1')
    expect(result.html).toContain('<h2>Pendahuluan</h2>')
    expect(result.html).toContain('<h3>Konteks</h3>')
    expect(result.html).not.toContain('<h1')
    expect(result.html).toContain('<ul>')
    expect(result.html).toContain('<ol>')
    expect(result.html).toContain('href="https://example.com/aman"')
  })

  it('normalizes a style-name Heading 2 fallback to H3', async () => {
    const zip = await JSZip.loadAsync(readFileSync(path.resolve(process.cwd(), 'src/tests/fixtures/docx/heading-hierarchy.docx')))
    const documentXml = (await zip.file('word/document.xml')?.async('string'))?.replaceAll('w:val="Heading2"', 'w:val="CustomHeading2"')
    const stylesXml = (await zip.file('word/styles.xml')?.async('string'))?.replace('</w:styles>', '<w:style w:type="paragraph" w:styleId="CustomHeading2"><w:name w:val="Heading 2"/></w:style></w:styles>')
    if (!documentXml || !stylesXml) throw new Error('DOCX fixture is missing required XML parts.')
    zip.file('word/document.xml', documentXml)
    zip.file('word/styles.xml', stylesXml)

    const result = await importDocxSubmission(fileLike('style-name-heading-2.docx', await zip.generateAsync({ type: 'nodebuffer' })))

    expect(result.title).toBe('Judul dari Heading 1')
    expect(result.html).toContain('<h2>Pendahuluan</h2>')
    expect(result.html).toContain('<h3>Konteks</h3>')
    expect(result.html).not.toContain('<h1')
  })

  it('passes generated HTML through the real server sanitizer before returning it', () => {
    const result = runRealImport('heading-hierarchy.docx')

    expect(result.html).toContain('href="https://example.com/aman"')
    expect(result.html).not.toContain('javascript:')
  })

  it('uses the first meaningful paragraph as title without duplicating it in the body', async () => {
    const result = await importDocxSubmission(fixture('paragraph-only.docx'))

    expect(result.title).toBe('Judul paragraf pertama')
    expect(result.html).toBe('<p>Isi paragraf kedua untuk artikel.</p>')
    expect(result.excerpt).toBe('Isi paragraf kedua untuk artikel.')
  })

  it('never uses a paired image caption as the generated excerpt', async () => {
    const result = await importDocxSubmission(fixture('caption-excerpt.docx'))

    expect(result.excerpt).toBe('Paragraf isi yang menjadi sumber ringkasan.')
    expect(result.excerpt).not.toContain('Keterangan')
  })

  it('skips an orphan Caption-style paragraph when generating the excerpt', async () => {
    const result = await importDocxSubmission(fixture('orphan-caption.docx'))

    expect(result.excerpt).toBe('Paragraf isi setelah caption.')
    expect(result.excerpt).not.toContain('Keterangan yatim')
  })

  it('does not fabricate an excerpt from a caption-only document', async () => {
    const result = await importDocxSubmission(fixture('caption-only.docx'))

    expect(result.excerpt).toBeUndefined()
  })

  it('prefers body prose over captions after headings', async () => {
    const result = await importDocxSubmission(fixture('heading-caption-body.docx'))

    expect(result.excerpt).toBe('Prosa artikel yang menjadi sumber ringkasan.')
  })

  it('removes only the consumed title node when the document repeats the title', async () => {
    const result = await importDocxSubmission(fixture('title-duplicate.docx'))

    expect(result.title).toBe('Judul asli')
    expect(result.html).toContain('<p>Judul asli</p>')
    expect(result.html).toContain('<p>Isi setelah judul.</p>')
  })

  it('uploads supported embedded images as stable URLs and preserves captions/order', async () => {
    storageService.uploadDocxImportImage
      .mockReset()
      .mockResolvedValueOnce({
        secureUrl: 'https://res.cloudinary.com/ikmi/image/upload/v1/docx-image-1.png',
        publicId: 'writing-submissions/docx-image-1',
      })
      .mockResolvedValueOnce({
        secureUrl: 'https://res.cloudinary.com/ikmi/image/upload/v1/docx-image-2.png',
        publicId: 'writing-submissions/docx-image-2',
      })
    const result = await importDocxSubmission(fixture('images-and-caption.docx'))

    expect(storageService.uploadDocxImportImage).toHaveBeenCalledTimes(2)
    expect(result.html).toContain('src="https://res.cloudinary.com/ikmi/image/upload/v1/docx-image-1.png"')
    expect(result.html).toContain('src="https://res.cloudinary.com/ikmi/image/upload/v1/docx-image-2.png"')
    expect(result.html.indexOf('docx-image-1.png')).toBeLessThan(result.html.indexOf('docx-image-2.png'))
    expect(result.html).toContain('alt="Pemandangan kampus"')
    expect(result.html).toContain('<figcaption>Keterangan foto</figcaption>')
    expect(result.html).not.toContain('data:image')
    expect(result.html).not.toContain('base64')
    expect(result.warnings.some((warning) => warning.includes('tidak memiliki teks alternatif'))).toBe(true)
  })

  it('returns a warning instead of failing text import when image upload fails', async () => {
    storageService.uploadDocxImportImage.mockRejectedValueOnce(new Error('storage unavailable'))
    const result = await importDocxSubmission(fixture('images-and-caption.docx'))

    expect(result.title).toBe('Artikel bergambar.')
    expect(result.html).toContain('alt="Gambar ketiga"')
    expect(result.html).not.toContain('data:image')
    expect(result.warnings.some((warning) => warning.includes('gagal diunggah'))).toBe(true)
  })

  it('rolls back images already uploaded when a later normalization step fails', async () => {
    storageService.uploadDocxImportImage
      .mockReset()
      .mockResolvedValueOnce({ secureUrl: 'https://res.cloudinary.com/ikmi/image/upload/v1/docx-image-1.png', publicId: 'writing-submissions/docx-image-1' })
      .mockResolvedValueOnce({ secureUrl: 'https://res.cloudinary.com/ikmi/image/upload/v1/docx-image-2.png', publicId: 'writing-submissions/docx-image-2' })
    const parseFragmentSpy = jest.spyOn(parse5, 'parseFragment').mockImplementation(() => {
      throw new Error('normalization failure')
    })

    try {
      await expect(importDocxSubmission(fixture('images-and-caption.docx'))).rejects.toThrow('normalization failure')
      expect(storageService.uploadDocxImportImage).toHaveBeenCalledTimes(2)
      expect(storageService.deleteDocxImportAssets).toHaveBeenCalledTimes(1)
    } finally {
      parseFragmentSpy.mockRestore()
    }
  })

  it('finalizes only imported image URLs still present in submitted HTML', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000001'
    const publicId = `ikmi/writing-submissions/docx-imports/${sessionId}/docx-image-1`
    const url = `https://res.cloudinary.com/ikmi/image/upload/v1/${publicId}.png`
    const manifest = createDocxImportAssetManifest(sessionId, [{ publicId, url }])
    await finalizeDocxImportAssets(manifest, `<figure><img src="${url}" alt="Foto" /></figure>`)

    expect(storageService.deleteDocxImportAssets).toHaveBeenCalledWith(
      sessionId,
      [publicId],
    )
  })

  it.each([
    ['png', 'image-1.png'],
    ['jpeg', 'image-2.jpeg'],
    ['webp', 'image-3.webp'],
  ])('correlates a retained %s URL to the exact extensionless upload publicId', (_format, filename) => {
    const sessionId = '00000000-0000-4000-8000-000000000001'
    const publicId = `ikmi/writing-submissions/docx-imports/${sessionId}/${filename.replace(/\.[^.]+$/, '')}`
    const url = `https://res.cloudinary.com/ikmi/image/upload/v1/${publicId}.${filename.split('.').pop()}`
    const manifest = createDocxImportAssetManifest(sessionId, [{ publicId, url }])

    return finalizeDocxImportAssets(manifest, `<p>Artikel.</p><img src="${url}" alt="Foto" />`).then(() => {
      expect(storageService.deleteDocxImportAssets).toHaveBeenCalledWith(sessionId, [publicId])
    })
  })

  it('does not let a forged temporary URL from another session become persisted content', () => {
    const sessionId = '00000000-0000-4000-8000-000000000001'
    const issued = `https://res.cloudinary.com/ikmi/image/upload/v1/ikmi/writing-submissions/docx-imports/${sessionId}/docx-image-1.png`
    const forged = 'https://res.cloudinary.com/ikmi/image/upload/v1/ikmi/writing-submissions/docx-imports/00000000-0000-4000-8000-000000000099/docx-image-1.png'
    const manifest = createDocxImportAssetManifest(sessionId, [{ publicId: 'ikmi/writing-submissions/docx-imports/' + sessionId + '/docx-image-1', url: issued }])

    const sanitized = sanitizeDocxImportHtml(`<p>Artikel.</p><img src="${issued}" alt="A" /><img src="${forged}" alt="B" />`, manifest)

    expect(sanitized).toContain(issued)
    expect(sanitized).not.toContain(forged)
  })

  it('uses the reserved server cleanup boundary for stale and discarded sessions', async () => {
    await cleanupStaleDocxImportAssets()
    expect(storageService.cleanupStaleDocxImportAssets).toHaveBeenCalledWith(expect.any(Date), [])

    await discardDocxImportAssets('00000000-0000-4000-8000-000000000001')
    expect(storageService.deleteDocxImportAssets).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001', [])
  })

  it('handles title-only and rejects empty or corrupt packages safely', async () => {
    const titleOnly = await importDocxSubmission(fixture('only-title.docx'))
    expect(titleOnly.title).toBe('Hanya Judul')
    expect(titleOnly.html).toBe('')

    await expect(importDocxSubmission(fixture('empty.docx'))).rejects.toBeInstanceOf(DocxImportError)
    await expect(importDocxSubmission(fixture('corrupt.docx'))).rejects.toBeInstanceOf(DocxImportError)
  })

  it('requires a DOCX file rather than trusting a filename alone', async () => {
    await expect(importDocxSubmission(fixture('title-style.docx', 'application/pdf'))).rejects.toThrow('Pilih file DOCX')
    await expect(importDocxSubmission(fileLike('fake.docx', Buffer.from('PK\u0003\u0004')))).rejects.toBeInstanceOf(DocxImportError)
  })
})
