import { PostStatus } from '@prisma/client'
import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'
import { prisma } from '@/core/database/prisma'
import { ValidationError } from '@/core/errors/custom-errors'
import { serializeAuditData } from '@/features/audit/audit-data'
import { requirePublisher } from '@/features/cms/access'
import type { SessionUser } from '@/core/authorization/rbac'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'
import { MAX_IMAGE_SIZE, validateImageSignature } from '@/core/storage/file-validator'

const BLOGGER_SOURCE_PROVIDER = 'BLOGGER'
const MAX_IMPORT_POSTS = 100
const publicationCategorySlugs = ['berita', 'opini', 'artikel', 'kajian'] as const
const BLOGGER_IMAGE_HOSTS = ['blogger.googleusercontent.com', 'blogspot.com', 'bp.blogspot.com', 'ggpht.com']

const bloggerPostSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  content: z.string().optional().default(''),
  published: z.string().datetime({ offset: true }),
  updated: z.string().datetime({ offset: true }).optional(),
  url: z.string().url(),
  labels: z.array(z.string().trim().min(1)).optional().default([]),
  author: z.object({ displayName: z.string().trim().min(1) }).optional(),
})

const bloggerPostListSchema = z.object({
  items: z.array(z.unknown()).optional().default([]),
  nextPageToken: z.string().optional(),
})

const bloggerImportSelectionSchema = z.object({
  posts: z.array(z.object({
    sourcePostId: z.string().trim().min(1).max(120),
    categoryId: z.string().trim().min(1).max(80),
  })).min(1, 'Pilih minimal satu postingan Blogger.').max(MAX_IMPORT_POSTS),
})

type BloggerPost = z.infer<typeof bloggerPostSchema>
type BloggerImportSelection = z.infer<typeof bloggerImportSelectionSchema>
type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export type BloggerImportPreview = {
  sourcePostId: string
  title: string
  sourceUrl: string
  publishedAt: string
  authorName: string | null
  labels: string[]
  duplicate: boolean
}

function getBloggerConfig() {
  const apiKey = process.env.BLOGGER_IMPORT_API_KEY?.trim()
  const blogId = process.env.BLOGGER_IMPORT_BLOG_ID?.trim()
  if (!apiKey || !blogId) {
    throw new ValidationError('Import Blogger belum dikonfigurasi. Isi BLOGGER_IMPORT_API_KEY dan BLOGGER_IMPORT_BLOG_ID di environment server.')
  }
  return { apiKey, blogId }
}

async function fetchBloggerPosts() {
  const { apiKey, blogId } = getBloggerConfig()
  const posts: BloggerPost[] = []
  let pageToken: string | undefined

  do {
    const endpoint = new URL(`https://www.googleapis.com/blogger/v3/blogs/${encodeURIComponent(blogId)}/posts`)
    endpoint.searchParams.set('key', apiKey)
    endpoint.searchParams.set('maxResults', String(MAX_IMPORT_POSTS))
    endpoint.searchParams.set('fetchImages', 'true')
    if (pageToken) endpoint.searchParams.set('pageToken', pageToken)

    let response: Response
    try {
      response = await fetch(endpoint, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      })
    } catch {
      throw new ValidationError('Blogger tidak dapat dihubungi. Periksa koneksi lalu coba kembali.')
    }
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null) as { error?: { message?: string } } | null
      if (errorPayload?.error?.message?.toLowerCase().includes('api key not valid')) {
        throw new ValidationError('API key Blogger tidak valid. Buat atau salin ulang API key yang aktif, lalu perbarui BLOGGER_IMPORT_API_KEY di environment server.')
      }
      throw new ValidationError('Postingan Blogger tidak dapat diambil. Periksa konfigurasi Blogger API dan pembatasan API key.')
    }

    const payload = bloggerPostListSchema.parse(await response.json())
    for (const item of payload.items) {
      const parsed = bloggerPostSchema.safeParse(item)
      if (parsed.success) posts.push(parsed.data)
      if (posts.length >= MAX_IMPORT_POSTS) break
    }
    pageToken = payload.nextPageToken
  } while (pageToken && posts.length < MAX_IMPORT_POSTS)

  return posts
}

function toExcerpt(content: string) {
  const plainText = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plainText.length > 220 ? `${plainText.slice(0, 217).trimEnd()}...` : plainText
}

function toSlug(title: string) {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
  return slug || 'publikasi-blogger'
}

async function resolveUniqueSlug(tx: TxClient, candidate: string) {
  const existing = await tx.post.findMany({
    where: { OR: [{ slug: candidate }, { slug: { startsWith: `${candidate}-` } }] },
    select: { slug: true },
  })
  const used = new Set(existing.map((post) => post.slug))
  if (!used.has(candidate)) return candidate

  let suffix = 2
  while (used.has(`${candidate}-${suffix}`)) suffix += 1
  return `${candidate}-${suffix}`
}

function isPublicationCategory(category: { slug: string }) {
  return publicationCategorySlugs.includes(category.slug.toLowerCase() as (typeof publicationCategorySlugs)[number])
}

function isBloggerImageUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && BLOGGER_IMAGE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

function getContentImageUrls(content: string) {
  const urls = new Set<string>()
  const imageTagPattern = /<img\b[^>]*\bsrc\s*=\s*(['"])(.*?)\1[^>]*>/gi
  for (const match of content.matchAll(imageTagPattern)) {
    const source = match[2]?.trim()
    if (source && isBloggerImageUrl(source)) urls.add(source)
  }
  return [...urls]
}

function imageExtensionForMimeType(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return null
}

async function copyBloggerImage(sourceUrl: string, postId: string, imageIndex: number) {
  let response: Response
  try {
    response = await fetch(sourceUrl, {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    throw new ValidationError('Gambar Blogger tidak dapat diunduh.')
  }

  if (!response.ok) throw new ValidationError('Gambar Blogger tidak tersedia.')

  const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
  const extension = imageExtensionForMimeType(mimeType)
  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (!extension || (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_SIZE)) {
    throw new ValidationError('Format atau ukuran gambar Blogger tidak didukung.')
  }

  const bytes = await response.arrayBuffer()
  if (bytes.byteLength > MAX_IMAGE_SIZE) throw new ValidationError('Ukuran gambar Blogger melebihi batas 2 MB.')

  const file = new File([bytes], `blogger-${postId}-${imageIndex + 1}.${extension}`, { type: mimeType })
  const validation = await validateImageSignature(file)
  if (!validation.valid) throw new ValidationError(validation.error ?? 'Gambar Blogger tidak valid.')

  return storageService.uploadImage(file, cloudinaryFolders.blog)
}

function replaceImageUrls(content: string, replacements: Map<string, string>) {
  let result = content
  for (const [sourceUrl, cloudinaryUrl] of replacements) {
    result = result.split(sourceUrl).join(cloudinaryUrl)
  }
  return result
}

type BloggerImageMigrationPost = {
  id: string
  sourcePostId: string | null
  content: string
  thumbnailUrl: string | null
  thumbnailPublicId: string | null
  ogImageUrl: string | null
  ogImagePublicId: string | null
}

async function migratePostImages(post: BloggerImageMigrationPost, actorId: string) {
  const sourceImages = getContentImageUrls(post.content)
  if (!sourceImages.length) return { copied: 0, failed: 0, updated: false }

  const replacements = new Map<string, string>()
  let firstUpload: Awaited<ReturnType<typeof copyBloggerImage>> | null = null
  let failed = 0

  for (const [index, sourceUrl] of sourceImages.entries()) {
    try {
      const upload = await copyBloggerImage(sourceUrl, post.sourcePostId ?? post.id, index)
      replacements.set(sourceUrl, upload.secureUrl)
      if (!firstUpload) firstUpload = upload
    } catch {
      // One legacy image must not prevent the rest of the article archive from being restored.
      failed += 1
    }
  }

  if (!replacements.size) return { copied: 0, failed, updated: false }

  const updatedPost = await prisma.post.update({
    where: { id: post.id },
    data: {
      content: replaceImageUrls(post.content, replacements),
      thumbnailUrl: post.thumbnailUrl ?? firstUpload?.secureUrl ?? null,
      thumbnailPublicId: post.thumbnailPublicId ?? firstUpload?.publicId ?? null,
      ogImageUrl: post.ogImageUrl ?? firstUpload?.secureUrl ?? null,
      ogImagePublicId: post.ogImagePublicId ?? firstUpload?.publicId ?? null,
      updatedBy: actorId,
    },
    select: { id: true },
  })
  await prisma.auditLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Post',
      entityId: updatedPost.id,
      userId: actorId,
      newData: serializeAuditData({
        imageMigrationSource: BLOGGER_SOURCE_PROVIDER,
        copied: replacements.size,
        failed,
      }),
    },
  })

  return { copied: replacements.size, failed, updated: true }
}

export const bloggerImportService = {
  async getPreview(user: SessionUser): Promise<BloggerImportPreview[]> {
    await requirePublisher(user.id)
    const sourcePosts = await fetchBloggerPosts()
    const imported = await prisma.post.findMany({
      where: {
        sourceProvider: BLOGGER_SOURCE_PROVIDER,
        sourcePostId: { in: sourcePosts.map((post) => post.id) },
      },
      select: { sourcePostId: true },
    })
    const importedIds = new Set(imported.flatMap((post) => post.sourcePostId ? [post.sourcePostId] : []))

    return sourcePosts.map((post) => ({
      sourcePostId: post.id,
      title: post.title,
      sourceUrl: post.url,
      publishedAt: post.published,
      authorName: post.author?.displayName ?? null,
      labels: post.labels,
      duplicate: importedIds.has(post.id),
    }))
  },

  async importSelected(input: BloggerImportSelection, user: SessionUser) {
    const actor = await requirePublisher(user.id)
    const validated = bloggerImportSelectionSchema.parse(input)
    const sourcePosts = await fetchBloggerPosts()
    const sourceById = new Map(sourcePosts.map((post) => [post.id, post]))
    const requested = validated.posts.map((item) => ({ ...item, source: sourceById.get(item.sourcePostId) }))

    if (requested.some((item) => !item.source)) {
      throw new ValidationError('Satu atau beberapa postingan Blogger tidak lagi tersedia. Muat ulang preview sebelum mengimpor.')
    }

    const categories = await prisma.category.findMany({
      where: { id: { in: validated.posts.map((item) => item.categoryId) }, deletedAt: null },
      select: { id: true, slug: true },
    })
    const validCategoryIds = new Set(categories.filter(isPublicationCategory).map((category) => category.id))
    if (validated.posts.some((item) => !validCategoryIds.has(item.categoryId))) {
      throw new ValidationError('Kategori import harus berupa BERITA, OPINI, ARTIKEL, atau KAJIAN yang aktif.')
    }

    return prisma.$transaction(async (tx: TxClient) => {
      let imported = 0
      let skipped = 0

      for (const item of requested) {
        const source = item.source as BloggerPost
        const existing = await tx.post.findFirst({
          where: { sourceProvider: BLOGGER_SOURCE_PROVIDER, sourcePostId: source.id },
          select: { id: true },
        })
        if (existing) {
          skipped += 1
          continue
        }

        const publishedAt = new Date(source.published)
        if (Number.isNaN(publishedAt.getTime())) {
          skipped += 1
          continue
        }

        const content = DOMPurify.sanitize(source.content)
        const post = await tx.post.create({
          data: {
            title: source.title,
            slug: await resolveUniqueSlug(tx, toSlug(source.title)),
            content,
            excerpt: toExcerpt(content) || null,
            thumbnailUrl: null,
            thumbnailPublicId: null,
            ogImageUrl: null,
            ogImagePublicId: null,
            status: PostStatus.PUBLISHED,
            authorId: actor.id,
            authorName: source.author?.displayName ?? actor.name,
            categoryId: item.categoryId,
            publishedBy: actor.id,
            publishedAt,
            sourceProvider: BLOGGER_SOURCE_PROVIDER,
            sourcePostId: source.id,
            sourceUrl: source.url,
            createdAt: publishedAt,
            createdBy: actor.id,
            updatedBy: actor.id,
          },
          select: { id: true, slug: true },
        })
        await tx.auditLog.create({
          data: {
            action: 'CREATE',
            entity: 'Post',
            entityId: post.id,
            userId: actor.id,
            newData: serializeAuditData({
              importSource: BLOGGER_SOURCE_PROVIDER,
              sourcePostId: source.id,
              sourceUrl: source.url,
              title: source.title,
              slug: post.slug,
              publishedAt,
            }),
          },
        })
        imported += 1
      }

      return { imported, skipped }
    })
  },

  async migrateImages(user: SessionUser) {
    const actor = await requirePublisher(user.id)
    const posts = await prisma.post.findMany({
      where: {
        sourceProvider: BLOGGER_SOURCE_PROVIDER,
        deletedAt: null,
        content: { contains: '<img', mode: 'insensitive' },
      },
      select: {
        id: true,
        sourcePostId: true,
        content: true,
        thumbnailUrl: true,
        thumbnailPublicId: true,
        ogImageUrl: true,
        ogImagePublicId: true,
      },
    })

    let postsUpdated = 0
    let copied = 0
    let failed = 0
    for (const post of posts) {
      const result = await migratePostImages(post, actor.id)
      if (result.updated) postsUpdated += 1
      copied += result.copied
      failed += result.failed
    }

    return { postsScanned: posts.length, postsUpdated, copied, failed }
  },
}

export type BloggerImportSelectionInput = z.infer<typeof bloggerImportSelectionSchema>
