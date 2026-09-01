import type { MetadataRoute } from 'next'
import { PostStatus } from '@prisma/client'
import { prisma } from '@/core/database/prisma'
import { siteUrl } from '@/core/seo/site'

export const revalidate = 3600

const staticRoutes = [
  { path: '/', priority: 1 },
  { path: '/tentang', priority: 0.9 },
  { path: '/struktur', priority: 0.8 },
  { path: '/kegiatan', priority: 0.8 },
  { path: '/publikasi', priority: 0.8 },
  { path: '/gabung', priority: 0.7 },
  { path: '/kontak', priority: 0.6 },
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticUrls: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route.priority,
  }))

  try {
    const posts = await prisma.post.findMany({
        where: {
          deletedAt: null,
          status: PostStatus.PUBLISHED,
          category: { deletedAt: null, slug: { in: ['berita', 'opini', 'artikel', 'kajian'] } },
        },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
          category: { select: { slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
      })

    return [
      ...staticUrls,
      ...posts.map((post) => ({
        url: `${siteUrl}/publikasi/${post.category.slug}/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ]
  } catch {
    return staticUrls
  }
}
