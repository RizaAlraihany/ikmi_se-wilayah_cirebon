import type { MetadataRoute } from 'next'
import { EventStatus, PostStatus } from '@prisma/client'
import { prisma } from '@/core/database/prisma'
import { siteUrl } from '@/core/seo/site'

export const revalidate = 3600

const staticRoutes = [
  { path: '/', priority: 1 },
  { path: '/tentang-kami', priority: 0.9 },
  { path: '/struktur', priority: 0.8 },
  { path: '/event', priority: 0.8 },
  { path: '/blog', priority: 0.8 },
  { path: '/gabung', priority: 0.7 },
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
    const [posts, events] = await Promise.all([
      prisma.post.findMany({
        where: {
          deletedAt: null,
          status: PostStatus.PUBLISHED,
        },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.event.findMany({
        where: {
          deletedAt: null,
          status: {
            in: [EventStatus.UPCOMING, EventStatus.ONGOING, EventStatus.COMPLETED],
          },
        },
        select: {
          id: true,
          updatedAt: true,
          startDate: true,
        },
        orderBy: { startDate: 'desc' },
      }),
    ])

    return [
      ...staticUrls,
      ...posts.map((post) => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
      ...events.map((event) => ({
        url: `${siteUrl}/event/${event.id}`,
        lastModified: event.updatedAt || event.startDate || now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ]
  } catch {
    return staticUrls
  }
}
