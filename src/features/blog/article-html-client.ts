/**
 * Client-safe helpers for the article form contract.
 *
 * Keep this module free of DOM/server-only dependencies. It is imported by
 * the public submission form only to decide whether the editor has content.
 */
export function articleHtmlToText(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Detects content that would be lost by replacing the editor value. Images
 * are meaningful even when they do not contribute textContent.
 */
export function hasMeaningfulArticleContent(value: string | undefined) {
  const html = value || ''
  if (articleHtmlToText(html)) return true
  return /<img\b[^>]*\bsrc\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/i.test(html)
}
