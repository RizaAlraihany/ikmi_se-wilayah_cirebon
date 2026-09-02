/**
 * Persisted article images are either same-origin paths or images served by
 * the application's configured external media providers. Keep this list
 * static and environment-safe so next.config and the server sanitizer share
 * the same contract.
 *
 * Blogger's other legacy source hosts are accepted by the import downloader,
 * which migrates them to Cloudinary before persistence. Only the
 * blogger.googleusercontent.com host is part of the deployed article render
 * contract today.
 */
export const ARTICLE_MEDIA_EXTERNAL_HOSTS = [
  'res.cloudinary.com',
  'blogger.googleusercontent.com',
] as const

const configuredSiteOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ikmicirebon.web.id').origin
  } catch {
    return 'https://ikmicirebon.web.id'
  }
})()

export const ARTICLE_MEDIA_CSP_SOURCES = ARTICLE_MEDIA_EXTERNAL_HOSTS.map((host) => `https://${host}`)

export function isAllowedArticleImageUrl(value: string) {
  const candidate = value.trim()
  if (!candidate || candidate.startsWith('//')) return false

  // A relative path is rendered by the same application origin.
  if (candidate.startsWith('/')) return true

  try {
    const url = new URL(candidate)
    if (url.origin === configuredSiteOrigin) return url.protocol === 'http:' || url.protocol === 'https:'
    if (url.protocol !== 'https:') return false
    return ARTICLE_MEDIA_EXTERNAL_HOSTS.includes(url.hostname as (typeof ARTICLE_MEDIA_EXTERNAL_HOSTS)[number])
  } catch {
    return false
  }
}
