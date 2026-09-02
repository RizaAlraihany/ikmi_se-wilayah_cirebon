'use server'

import { createHash, randomBytes } from 'node:crypto'
import { KaryaTulisStatus, Prisma } from '@prisma/client'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { isKomdigiAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requirePermission } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'
import { rateLimit } from '@/core/security/rate-limiter'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'
import { validateDocumentSignature, validateImageSignature } from '@/core/storage/file-validator'
import { hasMeaningfulDirectWritingContent, submitKaryaTulisSchema } from './schemas'
import { nextSubmissionNumber, submissionPrefix } from './domain'
import { sanitizeArticleHtml } from '@/features/blog/article-html'

const revisionNotesSchema = z.string().trim().min(5, 'Catatan revisi minimal 5 karakter.').max(3000, 'Catatan revisi maksimal 3.000 karakter.')

function hashRevisionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function requireWritingReviewAccess() {
  const user = await requirePermission('post.publish')
  if (!isKomdigiAdminRole(user.roleId) && !isSuperAdminRole(user.roleId)) {
    throw new ForbiddenError('Karya Tulis hanya dapat dikelola oleh Admin Komdigi.')
  }
  return user
}

async function validateSubmissionFile(formData: FormData) {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'File dokumen wajib diunggah.' } as const
  }
  const validation = await validateDocumentSignature(file)
  if (!validation.valid) return { error: validation.error ?? 'File dokumen tidak valid.' } as const
  return { file } as const
}

export async function uploadWritingInlineImageAction(formData: FormData) {
  try {
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') || 'unknown-ip'
    await rateLimit(`kirim_tulisan_inline_image_${ip}`, 20, 3600)

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'File gambar wajib dipilih.' }
    }
    const validation = await validateImageSignature(file)
    if (!validation.valid) return { error: validation.error || 'File gambar tidak valid.' }

    const uploaded = await storageService.uploadImage(file, cloudinaryFolders.writingSubmissions)
    return { success: true, url: uploaded.secureUrl, publicId: uploaded.publicId }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    return { error: message.includes('Terlalu banyak') ? message : 'Gambar belum dapat diunggah. Silakan coba lagi.' }
  }
}

export async function submitKaryaTulisAction(formData: FormData) {
  try {
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') || 'unknown-ip'
    await rateLimit(`kirim_tulisan_${ip}`, 5, 3600)
    if (formData.get('bot_field')) return { success: false, error: 'Spam terdeteksi.' }

    const parsed = submitKaryaTulisSchema.safeParse({
      title: formData.get('title'),
      category: formData.get('category'),
      topic: formData.get('topic') || undefined,
      summary: formData.get('summary') || undefined,
      content: formData.get('content'),
      authorName: formData.get('authorName'),
      authorEmail: formData.get('authorEmail'),
      authorWhatsapp: formData.get('authorWhatsapp'),
      authorStatus: formData.get('authorStatus'),
      authorUnit: formData.get('authorUnit') || undefined,
      consent: formData.get('consent'),
    })
    if (!parsed.success) return { success: false, error: 'Validasi form gagal', fieldErrors: parsed.error.flatten().fieldErrors }

    const suppliedFile = formData.get('file')
    const hasAttachment = suppliedFile instanceof File && suppliedFile.size > 0
    const validatedFile = hasAttachment ? await validateSubmissionFile(formData) : null
    if (validatedFile && 'error' in validatedFile) return { success: false, error: validatedFile.error }
    const hasDirectWriting = hasMeaningfulDirectWritingContent(parsed.data.content)
    if (!hasDirectWriting && !validatedFile) {
      return { success: false, error: 'Isi tulisan atau dokumen wajib dikirim.' }
    }
    const upload = validatedFile && 'file' in validatedFile
      ? await storageService.uploadPrivateDocument(validatedFile.file, cloudinaryFolders.writingSubmissions)
      : null
    const data = parsed.data

    try {
      const created = await prisma.$transaction(async (tx) => {
        const prefix = submissionPrefix()
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`
        const latest = await tx.karyaTulis.findFirst({ where: { submissionNumber: { startsWith: `${prefix}-` } }, orderBy: { submissionNumber: 'desc' }, select: { submissionNumber: true } })
        const submission = await tx.karyaTulis.create({
          data: {
            submissionNumber: nextSubmissionNumber(prefix, latest?.submissionNumber),
            title: data.title,
            category: data.category,
            topic: data.topic || null,
            summary: data.summary || null,
            authorName: data.authorName,
            authorEmail: data.authorEmail,
            authorWhatsapp: data.authorWhatsapp,
            authorStatus: data.authorStatus,
            authorUnit: data.authorUnit || null,
            consentAt: new Date(),
            content: hasDirectWriting ? sanitizeArticleHtml(data.content || '', { normalizeHeadingOne: true }) : null,
            fileUrl: null,
            filePublicId: upload?.publicId || null,
            status: KaryaTulisStatus.SUBMITTED,
          },
          select: { id: true, submissionNumber: true },
        })
        if (upload && validatedFile && 'file' in validatedFile) {
          await tx.karyaTulisVersion.create({
            data: {
              karyaTulisId: submission.id,
              versionNumber: 1,
              originalFilename: validatedFile.file.name,
              filePublicId: upload.publicId,
            },
          })
        }
        return submission
      })
      return { success: true, id: created.id, submissionNumber: created.submissionNumber }
    } catch (error) {
      if (upload) await storageService.deleteFile(upload.publicId, 'raw', 'authenticated').catch(() => undefined)
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem. Silakan coba lagi.'
    if (message.includes('Terlalu banyak')) return { success: false, error: message }
    console.error('Submit Kirim Tulisan error:', error)
    return { success: false, error: 'Terjadi kesalahan sistem. Silakan coba lagi.' }
  }
}

export async function getKaryaTulisQueue() {
  await requireWritingReviewAccess()
  return prisma.karyaTulis.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, submissionNumber: true, title: true, category: true, status: true, authorName: true, createdAt: true, reviewNotes: true,
      articleDraft: { select: { id: true } },
      versions: { select: { versionNumber: true, originalFilename: true }, orderBy: { versionNumber: 'desc' } },
    },
  })
}

export async function requestKaryaTulisRevisionAction(id: string, notes: string) {
  const user = await requireWritingReviewAccess()
  const parsedNotes = revisionNotesSchema.parse(notes)
  const submission = await prisma.karyaTulis.findFirst({ where: { id, deletedAt: null }, select: { id: true, status: true } })
  if (!submission) throw new NotFoundError('Karya Tulis tidak ditemukan.')
  const revisionEligible: KaryaTulisStatus[] = [KaryaTulisStatus.SUBMITTED, KaryaTulisStatus.UNDER_REVIEW, KaryaTulisStatus.RESUBMITTED]
  if (!revisionEligible.includes(submission.status)) {
    throw new ForbiddenError('Status Karya Tulis tidak dapat dikembalikan untuk revisi.')
  }

  const rawToken = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  await prisma.$transaction([
    prisma.karyaTulis.update({
      where: { id },
      data: {
        status: KaryaTulisStatus.REVISION_REQUIRED,
        reviewNotes: parsedNotes,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        revisionTokenHash: hashRevisionToken(rawToken),
        revisionTokenExpiresAt: expiresAt,
      },
    }),
    prisma.auditLog.create({
      data: { action: 'STATUS_CHANGE', entity: 'KaryaTulis', entityId: id, newData: JSON.stringify({ status: 'REVISION_REQUIRED' }), userId: user.id },
    }),
  ])
  revalidatePath('/admin/kirim-tulisan')
  return { success: true, revisionPath: `/kirim-tulisan/revisi/${rawToken}`, expiresAt: expiresAt.toISOString() }
}

export async function setKaryaTulisReviewStatusAction(id: string, status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED', notes?: string) {
  const user = await requireWritingReviewAccess()
  const reviewNotes = notes?.trim().slice(0, 3000) || null
  const submission = await prisma.karyaTulis.findFirst({ where: { id, deletedAt: null }, select: { id: true, status: true } })
  if (!submission) throw new NotFoundError('Karya Tulis tidak ditemukan.')
  const reviewEligible: KaryaTulisStatus[] = [KaryaTulisStatus.SUBMITTED, KaryaTulisStatus.RESUBMITTED]
  const allowed = status === 'UNDER_REVIEW'
    ? reviewEligible.includes(submission.status)
    : submission.status === KaryaTulisStatus.UNDER_REVIEW
  if (!allowed) throw new ForbiddenError('Transisi status Karya Tulis tidak valid.')
  const nextStatus = status === 'UNDER_REVIEW' ? KaryaTulisStatus.UNDER_REVIEW : status === 'APPROVED' ? KaryaTulisStatus.APPROVED : KaryaTulisStatus.REJECTED
  await prisma.$transaction([
    prisma.karyaTulis.update({
      where: { id },
      data: { status: nextStatus, reviewNotes, reviewedBy: user.id, reviewedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: { action: 'STATUS_CHANGE', entity: 'KaryaTulis', entityId: id, newData: JSON.stringify({ status }), userId: user.id },
    }),
  ])
  revalidatePath('/admin/kirim-tulisan')
  return { success: true }
}

export async function createArticleDraftFromKaryaTulisAction(id: string) {
  const user = await requireWritingReviewAccess()
  const submission = await prisma.karyaTulis.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, submissionNumber: true, title: true, content: true, category: true, summary: true, authorName: true, status: true, articleDraft: { select: { id: true } } },
  })
  if (!submission) throw new NotFoundError('Karya Tulis tidak ditemukan.')
  if (submission.articleDraft) return { success: true, postId: submission.articleDraft.id, existing: true }
  if (submission.status !== KaryaTulisStatus.APPROVED) throw new ForbiddenError('Hanya Karya Tulis APPROVED yang dapat dibuat menjadi draft.')
  const categorySlug = submission.category?.trim().toLowerCase()
  const category = await prisma.category.findFirst({ where: { slug: categorySlug, deletedAt: null }, select: { id: true } })
  if (!category) throw new NotFoundError('Kategori publikasi tujuan tidak ditemukan.')
  const baseSlug = submission.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 130) || 'draft-tulisan'
  const slug = `${baseSlug}-${submission.submissionNumber.toLowerCase()}`
  let result: { id: string }
  try {
    result = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({ data: { title: submission.title, slug, content: sanitizeArticleHtml(submission.content || ''), excerpt: submission.summary, thumbnailUrl: '', status: 'DRAFT', authorId: user.id, authorName: submission.authorName, categoryId: category.id, writingSubmissionId: submission.id, createdBy: user.id }, select: { id: true } })
      await tx.karyaTulis.update({ where: { id: submission.id }, data: { status: KaryaTulisStatus.ARTICLE_DRAFT_CREATED, updatedBy: user.id } })
      await tx.auditLog.create({ data: { action: 'CREATE', entity: 'Post', entityId: post.id, userId: user.id, newData: JSON.stringify({ writingSubmissionId: submission.id, status: 'DRAFT' }) } })
      return post
    })
  } catch (error) {
    // The unique writingSubmissionId is the final concurrency guard. A
    // competing approval may create the draft after our first lookup; return
    // that same draft instead of surfacing a P2002 to the reviewer.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error
    const existing = await prisma.post.findFirst({ where: { writingSubmissionId: submission.id }, select: { id: true } })
    if (!existing) throw error
    revalidatePath('/admin/kirim-tulisan')
    revalidatePath('/admin/cms/posts')
    return { success: true, postId: existing.id, existing: true }
  }
  revalidatePath('/admin/kirim-tulisan')
  revalidatePath('/admin/cms/posts')
  return { success: true, postId: result.id, existing: false }
}

export async function getKaryaTulisRevisionTokenState(token: string) {
  if (!/^[A-Za-z0-9_-]{30,}$/.test(token)) return null
  return prisma.karyaTulis.findFirst({
    where: {
      revisionTokenHash: hashRevisionToken(token),
      revisionTokenExpiresAt: { gt: new Date() },
      status: KaryaTulisStatus.REVISION_REQUIRED,
      deletedAt: null,
    },
    select: { id: true, title: true, reviewNotes: true, revisionTokenExpiresAt: true },
  })
}

export async function submitKaryaTulisRevisionAction(token: string, formData: FormData) {
  try {
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') || 'unknown-ip'
    await rateLimit(`kirim_tulisan_revisi_${ip}`, 5, 3600)
    if (formData.get('bot_field')) return { success: false, error: 'Spam terdeteksi.' }

    const submission = await getKaryaTulisRevisionTokenState(token)
    if (!submission) return { success: false, error: 'Tautan revisi tidak valid atau sudah kedaluwarsa.' }
    const validatedFile = await validateSubmissionFile(formData)
    if ('error' in validatedFile) return { success: false, error: validatedFile.error }
    const upload = await storageService.uploadPrivateDocument(validatedFile.file, cloudinaryFolders.writingSubmissions)

    try {
      await prisma.$transaction(async (tx) => {
        const previous = await tx.karyaTulisVersion.aggregate({ where: { karyaTulisId: submission.id }, _max: { versionNumber: true } })
        await tx.karyaTulisVersion.create({
          data: {
            karyaTulisId: submission.id,
            versionNumber: (previous._max.versionNumber ?? 0) + 1,
            originalFilename: validatedFile.file.name,
            filePublicId: upload.publicId,
          },
        })
        await tx.karyaTulis.update({
          where: { id: submission.id },
          data: {
            fileUrl: null,
            filePublicId: upload.publicId,
            status: KaryaTulisStatus.RESUBMITTED,
            revisionTokenHash: null,
            revisionTokenExpiresAt: null,
          },
        })
      })
      return { success: true }
    } catch (error) {
      await storageService.deleteFile(upload.publicId, 'raw').catch(() => undefined)
      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.'
    if (message.includes('Terlalu banyak')) return { success: false, error: message }
    console.error('Submit Kirim Tulisan revision error:', error)
    return { success: false, error: 'Terjadi kesalahan sistem. Silakan coba lagi.' }
  }
}
