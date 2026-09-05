import { z } from 'zod'
import { articleHtmlToText } from '@/features/blog/article-html-client'
import { isAllowedArticleImageUrl } from '@/features/blog/article-media-policy'

export const submitKaryaTulisSchema = z.object({
  title: z.string().min(5, 'Judul tulisan minimal 5 karakter').max(150, 'Judul terlalu panjang'),
  category: z.enum(['Opini', 'Artikel', 'Kajian'], { required_error: 'Kategori tulisan harus dipilih' }),
  topic: z.string().trim().max(120, 'Topik maksimal 120 karakter').optional(),
  summary: z.string().max(500, 'Ringkasan maksimal 500 karakter').optional(),
  // The action establishes the content-or-file rule after signature
  // validation. This schema intentionally permits an empty editor for the
  // still-supported DOCX/PDF-first submission flow.
  content: z.string().optional(),

  // Identitas
  authorName: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  authorEmail: z.string().email('Format email tidak valid'),
  authorWhatsapp: z.string().min(9, 'Nomor WhatsApp tidak valid').max(20),
  authorStatus: z.enum(['Anggota', 'Pengurus'], { required_error: 'Status IKMI harus dipilih' }),
  authorUnit: z.string().trim().max(120, 'Unit maksimal 120 karakter').optional(),
  consent: z.literal('on', { errorMap: () => ({ message: 'Persetujuan pengiriman wajib dicentang.' }) }),

  // Lampiran tetap opsional; PUB-003 akan menangani import DOCX ke editor.
  fileUrl: z.string().optional(),
  filePublicId: z.string().optional(),
}).superRefine((data, context) => {
  if (data.authorStatus === 'Pengurus' && !data.authorUnit) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['authorUnit'], message: 'Unit / Departemen wajib diisi untuk Pengurus.' })
  }
})

export type SubmitKaryaTulisInput = z.infer<typeof submitKaryaTulisSchema>

export function hasMeaningfulDirectWritingContent(value: string | undefined) {
  const html = value || ''
  const meaningfulText = articleHtmlToText(html).length >= 10

  if (meaningfulText) return true

  const imagePattern = /<img\b([^>]*)>/gi
  for (const match of html.matchAll(imagePattern)) {
    const attributes = match[1] || ''
    const sourceMatch = attributes.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
    const altMatch = attributes.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
    const source = sourceMatch?.[1] || sourceMatch?.[2] || sourceMatch?.[3] || ''
    const alt = (altMatch?.[1] || altMatch?.[2] || altMatch?.[3] || '').trim()
    if (alt && isAllowedArticleImageUrl(source)) return true
  }

  return false
}
