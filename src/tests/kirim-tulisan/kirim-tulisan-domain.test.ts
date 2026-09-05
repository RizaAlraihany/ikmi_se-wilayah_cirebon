import { nextSubmissionNumber, submissionPrefix } from '@/features/kirim-tulisan/domain'
import { hasMeaningfulDirectWritingContent, submitKaryaTulisSchema } from '@/features/kirim-tulisan/schemas'

const valid = {
  title: 'Kajian Organisasi Mahasiswa',
  category: 'Kajian',
  authorName: 'Penulis IKMI',
  authorEmail: 'penulis@example.test',
  authorWhatsapp: '081234567890',
  authorStatus: 'Anggota',
  consent: 'on',
  content: '<p>Isi tulisan yang cukup untuk dikirim.</p>',
}

describe('Kirim Tulisan public domain', () => {
  it('creates sequential annual submission numbers in Asia/Jakarta', () => {
    expect(submissionPrefix(new Date('2025-12-31T18:00:00.000Z'))).toBe('IKMI-KT-2026')
    expect(nextSubmissionNumber('IKMI-KT-2026')).toBe('IKMI-KT-2026-0001')
    expect(nextSubmissionNumber('IKMI-KT-2026', 'IKMI-KT-2026-0012')).toBe('IKMI-KT-2026-0013')
  })

  it('requires consent and an organizational unit only for Pengurus', () => {
    expect(submitKaryaTulisSchema.safeParse(valid).success).toBe(true)
    expect(submitKaryaTulisSchema.safeParse({ ...valid, consent: undefined }).success).toBe(false)
    expect(submitKaryaTulisSchema.safeParse({ ...valid, authorStatus: 'Pengurus' }).success).toBe(false)
    expect(submitKaryaTulisSchema.safeParse({ ...valid, authorStatus: 'Pengurus', authorUnit: 'Komdigi' }).success).toBe(true)
    expect(submitKaryaTulisSchema.safeParse({ ...valid, category: 'Berita' }).success).toBe(false)
  })

  it('keeps schema metadata validation independent from the content-or-file action rule', () => {
    expect(submitKaryaTulisSchema.safeParse({ ...valid, content: '<p></p>' }).success).toBe(true)
    expect(submitKaryaTulisSchema.safeParse({ ...valid, content: undefined }).success).toBe(true)
  })

  it.each([
    ['one character', '<p>x</p>'],
    ['nine characters', '<p>abcdefghi</p>'],
    ['whitespace only', '<p>   </p><h2></h2><p><br /></p>'],
    ['invalid image only', '<p><img src="data:image/png;base64,AAAA" alt="Gambar" /></p>'],
    ['unsafe image only', '<p><img src="https://unsafe.example/image.png" alt="Gambar" /></p>'],
  ])('rejects %s as direct-writing content', (_label, content) => {
    expect(hasMeaningfulDirectWritingContent(content)).toBe(false)
  })

  it.each([
    ['ten characters', '<p>abcdefghij</p>'],
    ['heading text', '<h2>Bagian artikel yang bermakna</h2>'],
    ['valid image only', '<figure><img src="https://res.cloudinary.com/ikmi/image/upload/v1/article.png" alt="Dokumentasi" /></figure>'],
    ['valid image with short text', '<p>x</p><img src="https://res.cloudinary.com/ikmi/image/upload/v1/article.png" alt="Dokumentasi" />'],
  ])('accepts %s as meaningful direct-writing content', (_label, content) => {
    expect(hasMeaningfulDirectWritingContent(content)).toBe(true)
  })
})
