import { suppressLeadingDuplicateTitleH1 } from '@/app/(public)/_components/article-renderer'

describe('ArticleRenderer leading-title normalization', () => {
  const title = 'Peran Mahasiswa dalam Menjaga Budaya Indramayu'

  it('removes only a first meaningful H1 that repeats the page title', () => {
    expect(suppressLeadingDuplicateTitleH1(`<!-- imported --><h1>  PERAN Mahasiswa dalam menjaga budaya Indramayu </h1><p>Isi artikel.</p>`, title))
      .toBe('<p>Isi artikel.</p>')
  })

  it('keeps a leading H2/H3 and a later matching H1 intact', () => {
    expect(suppressLeadingDuplicateTitleH1(`<h2>${title}</h2><p>Isi artikel.</p>`, title))
      .toBe(`<h2>${title}</h2><p>Isi artikel.</p>`)
    expect(suppressLeadingDuplicateTitleH1(`<p>Pembuka.</p><h1>${title}</h1>`, title))
      .toBe(`<p>Pembuka.</p><h1>${title}</h1>`)
  })

  it('keeps a different leading H1 intact', () => {
    expect(suppressLeadingDuplicateTitleH1('<h1>Subjudul penting</h1><p>Isi artikel.</p>', title))
      .toBe('<h1>Subjudul penting</h1><p>Isi artikel.</p>')
  })
})
