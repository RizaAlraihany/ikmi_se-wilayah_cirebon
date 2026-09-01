/** Canonical public URL for a published Post. */
export function publicationPath(slug: string) {
  return `/publikasi/${encodeURIComponent(slug)}`
}
