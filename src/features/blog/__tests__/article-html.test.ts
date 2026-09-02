import { execFileSync } from 'node:child_process'
import path from 'node:path'

function runRealSanitizer(inputs: Array<{ input: string; normalizeHeadingOne?: boolean }>) {
  const script = 'const Module = require("node:module"); const load = Module._load; Module._load = function(request, parent, isMain) { if (request === "server-only") return {}; return load.call(this, request, parent, isMain); }; const { sanitizeArticleHtml } = require("./src/features/blog/article-html.ts"); const cases = ' + JSON.stringify(inputs) + '; console.log(JSON.stringify(cases.map(({ input, normalizeHeadingOne }) => sanitizeArticleHtml(input, { normalizeHeadingOne })))); process.exit(0)'
  return JSON.parse(execFileSync(process.execPath, ['-r', 'tsx/cjs', '--eval', script], {
    cwd: path.resolve(__dirname, '../../../..'),
    encoding: 'utf8',
  }).trim()) as string[]
}

describe('article HTML server sanitization', () => {
  const [unsafeHtml, figureHtml, sameOriginHtml, bloggerHtml, unknownHostHtml, newHtml, legacyHtml] = runRealSanitizer([
    { input: '<p>Awal</p><img src="data:image/png;base64,AAAA" alt="Data"><img src="javascript:alert(1)" alt="Script"><img src="blob:https://example.test/1" alt="Blob"><img src="https://example-other.test/ok.png" alt="Tidak dipercaya" onerror="alert(1)"><script>alert(1)</script>' },
    { input: '<figure class="article-figure"><img src="https://res.cloudinary.com/ikmi/image/upload/v1/article.png" alt="Dokumentasi kegiatan" onerror="alert(1)"><figcaption class="article-figure-caption">Keterangan gambar</figcaption></figure>' },
    { input: '<img src="/media/article.png" alt="Gambar lokal">' },
    { input: '<img src="https://blogger.googleusercontent.com/img/a/legacy.png" alt="Gambar Blogger">' },
    { input: '<img src="https://example-other.test/ok.png" alt="Tidak dipercaya">' },
    { input: '<h1>Judul baru</h1><p>Isi</p>', normalizeHeadingOne: true },
    { input: '<h1>Judul lama</h1><h4>Bagian lama</h4><p>Isi</p>' },
  ])

  it('removes executable and non-persistent image sources plus script/event markup', () => {
    const html = unsafeHtml

    expect(html).toContain('<p>Awal</p>')
    expect(html).not.toMatch(/data:image|javascript:|blob:|onerror|<script/i)
    expect(html).not.toContain('<img')
  })

  it('preserves stable image URLs, meaningful alt text, and optional captions', () => {
    const html = figureHtml

    expect(html).toContain('src="https://res.cloudinary.com/ikmi/image/upload/v1/article.png"')
    expect(html).toContain('alt="Dokumentasi kegiatan"')
    expect(html).toContain('<figcaption class="article-figure-caption">Keterangan gambar</figcaption>')
    expect(html).not.toContain('onerror')
  })

  it('preserves same-origin and configured legacy media URLs only', () => {
    expect(sameOriginHtml).toContain('src="/media/article.png"')
    expect(bloggerHtml).toContain('src="https://blogger.googleusercontent.com/img/a/legacy.png"')
    expect(unknownHostHtml).not.toContain('<img')
  })

  it('normalizes H1 only for new article content, not legacy edit content', () => {
    expect(newHtml).toContain('<h2>Judul baru</h2>')
    expect(legacyHtml).toContain('<h1>Judul lama</h1><h4>Bagian lama</h4>')
  })
})
