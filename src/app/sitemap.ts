import type { MetadataRoute } from 'next'
import { PostStatus } from '@prisma/client'
import { prisma } from '@/core/database/prisma'
import { siteUrl } from '@/core/seo/site'

export const revalidate = 3600

const staticRoutes = [
  { path: '/', priority: 1 },
  { path: '/tentang-kami', priority: 0.9 },
  { path: '/struktur', priority: 0.8 },
  { path: '/program', priority: 0.8 },
  { path: '/agenda', priority: 0.8 },
  { path: '/kalender', priority: 0.8 },
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
    const [posts, programs, agendas] = await Promise.all([
      prisma.post.findMany({
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
      }),
      prisma.program.findMany({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          slug: { not: null },
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.agenda.findMany({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          status: { notIn: ['DRAFT', 'ARCHIVED'] },
        },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    return [
      ...staticUrls,
      ...posts.map((post) => ({
        url: `${siteUrl}/publikasi/${post.category.slug}/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
      ...programs.map((program) => ({
        url: `${siteUrl}/program/${program.slug}`,
        lastModified: program.updatedAt || now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
      ...agendas.map((agenda) => ({
        url: `${siteUrl}/agenda/${agenda.slug}`,
        lastModified: agenda.updatedAt || now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ]
  } catch {
    return staticUrls
  }
}
