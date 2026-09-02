import { nextSubmissionNumber, submissionPrefix } from '@/features/kirim-tulisan/domain'
import { submitKaryaTulisSchema } from '@/features/kirim-tulisan/schemas'

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
})
