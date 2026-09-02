import 'server-only'
import DOMPurify from 'isomorphic-dompurify'
import { isAllowedArticleImageUrl } from './article-media-policy'

export type ArticleHtmlSanitizationOptions = {
  /**
   * New article bodies use the page-owned title as their only H1. Existing
   * article edits opt out so that legitimate historical headings round-trip.
   */
  normalizeHeadingOne?: boolean
}

/**
 * Applies the server-side HTML contract shared by CMS posts and direct
 * writing submissions. Image nodes must refer to a durable HTTP(S) URL and
 * have non-empty alternative text; otherwise the whole figure/image is
 * dropped rather than retaining a broken or unsafe source.
 */
export function sanitizeArticleHtml(value: string, options: ArticleHtmlSanitizationOptions = {}) {
  const sanitized = DOMPurify.sanitize(value, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'base', 'meta'],
    RETURN_DOM_FRAGMENT: true,
  }) as unknown as DocumentFragment | string
  const fragment = typeof sanitized === 'string' ? null : sanitized
  const document = fragment?.ownerDocument || new DOMParser().parseFromString(
    typeof sanitized === 'string' ? sanitized : '',
    'text/html',
  )
  const root: ParentNode = fragment || document.body

  for (const element of Array.from(root.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.toLowerCase().startsWith('on')) element.removeAttribute(attribute.name)
    }
  }

  for (const image of Array.from(root.querySelectorAll('img'))) {
    const src = image.getAttribute('src')?.trim() || ''
    const alt = image.getAttribute('alt')?.trim() || ''
    if (isAllowedArticleImageUrl(src) && alt) continue

    const figure = image.closest('figure')
    if (figure) figure.remove()
    else image.remove()
  }

  if (options.normalizeHeadingOne) {
    for (const heading of Array.from(root.querySelectorAll('h1'))) {
      const replacement = document.createElement('h2')
      for (const attribute of Array.from(heading.attributes)) {
        replacement.setAttribute(attribute.name, attribute.value)
      }
      replacement.replaceChildren(...Array.from(heading.childNodes))
      heading.replaceWith(replacement)
    }
  }

  if (!fragment) return document.body.innerHTML
  const container = document.createElement('div')
  container.append(fragment)
  return container.innerHTML
}
