const leadingH1Pattern = /^(?:\s|<!--[\s\S]*?-->)*<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }

  return value
    .replace(/&#(x[0-9a-f]+|\d+);?/gi, (_, code: string) => {
      const numeric = code.toLowerCase().startsWith('x')
        ? Number.parseInt(code.slice(1), 16)
        : Number.parseInt(code, 10)
      return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : _
    })
    .replace(/&([a-z]+);?/gi, (match, name: string) => named[name.toLowerCase()] ?? match)
}

export function normalizeArticleText(value: string) {
  return decodeEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('id-ID')
}

/**
 * Removes only a first meaningful H1 when it repeats the page-owned title.
 * Later headings and every H2/H3 remain part of the stored article body.
 */
export function suppressLeadingDuplicateTitleH1(content: string, title: string) {
  const match = content.match(leadingH1Pattern)
  if (!match || normalizeArticleText(match[1]) !== normalizeArticleText(title)) {
    return content
  }

  return content.slice(match[0].length)
}

export function ArticleRenderer({ content, title }: { content: string; title: string }) {
  // Current CMS creation and Blogger import flows sanitize stored HTML before
  // persistence. Keep the established public trust model here rather than
  // introducing a browser-only sanitizer dependency into the server route.
  const normalizedContent = suppressLeadingDuplicateTitleH1(content, title)

  return (
    <div
      className="publication-article-content prose prose-sm max-w-none leading-relaxed text-text-secondary md:prose-base lg:prose-lg
        prose-headings:font-heading prose-headings:font-extrabold prose-headings:text-primary
        prose-p:my-4 prose-p:text-text-secondary prose-a:text-accent hover:prose-a:text-primary
        prose-strong:text-primary prose-blockquote:border-l-primary prose-blockquote:bg-surface-alt prose-blockquote:text-primary
        prose-li:text-text-secondary prose-img:rounded-lg [&>*:first-child]:mt-0
        [&_.article-figure]:my-8 [&_.article-figure_img]:mx-auto [&_.article-figure_img]:w-full [&_.article-figure_img]:rounded-lg
        [&_.article-figure-caption]:mt-3 [&_.article-figure-caption]:text-center [&_.article-figure-caption]:text-sm [&_.article-figure-caption]:italic [&_.article-figure-caption]:text-muted"
      dangerouslySetInnerHTML={{ __html: normalizedContent }}
    />
  )
}
