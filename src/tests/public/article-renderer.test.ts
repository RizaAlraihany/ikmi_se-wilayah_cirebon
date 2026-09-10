import {
  suppressLeadingDuplicateCoverImage,
  suppressLeadingDuplicateTitleH1,
} from '@/app/(public)/_components/article-renderer'

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

describe('ArticleRenderer cover-image normalization', () => {
  it('removes a duplicated Blogger cover image but keeps later images', () => {
    const cover = 'https://blogger.googleusercontent.com/img/b/post/s1600/foto-utama.jpg'
    const content = `<div class="separator"><a href="${cover}"><img src="https://blogger.googleusercontent.com/img/b/post/w320-h240/foto-utama.jpg"></a></div><p>Isi artikel.</p><img src="https://blogger.googleusercontent.com/img/b/post/s320/foto-kedua.jpg">`

    expect(suppressLeadingDuplicateCoverImage(content, cover))
      .toBe('<p>Isi artikel.</p><img src="https://blogger.googleusercontent.com/img/b/post/s320/foto-kedua.jpg">')
  })

  it('keeps the first image when it is not the cover image', () => {
    const content = '<p>Pembuka.</p><img src="https://example.com/foto-isi.jpg">'

    expect(suppressLeadingDuplicateCoverImage(content, 'https://example.com/foto-cover.jpg'))
      .toBe(content)
  })
})
