export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || 'https://ikmicirebon.web.id'
)

function normalizeSiteUrl(value: string) {
  try {
    const url = new URL(value)
    return url.origin
  } catch {
    return 'https://ikmicirebon.web.id'
  }
}
