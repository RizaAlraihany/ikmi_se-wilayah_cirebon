import type { MetadataRoute } from 'next'
import { siteUrl } from '@/core/seo/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/dashboard/',
          '/login',
          '/request-pamflet',
          '/request-pamflet/',
          '/api/',
          '/kirim-tulisan/revisi/',
          '/_design-system',
          '/design-system',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
