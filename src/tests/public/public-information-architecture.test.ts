import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('public PRD information architecture', () => {
  it('keeps the homepage editorial sequence on current public routes', () => {
    const home = source('src/app/(public)/page.tsx')

    expect(home).toContain('Akses cepat')
    expect(home).toContain('href="/tentang"')
    expect(home).toContain('Agenda dan Kegiatan Terdekat')
    expect(home).toContain('href="/kegiatan"')
    expect(home).toContain('Publikasi Terbaru')
    expect(home).toContain('href="/publikasi"')
    expect(home).not.toContain('Galeri dan dokumentasi')
    expect(home).not.toContain('className="home-gallery')
    expect(home).not.toContain('getPublicAlbums')
    expect(home).toContain('Pertanyaan yang Sering Ditanyakan')
    expect(home).toContain('id="faq"')
    expect(home).toContain('<details')
    expect(home).toContain('href="/gabung"')
    expect(home).toContain('getPublicAgendaOccurrences')
    expect(home).toContain('=== "AKAN_DATANG"')
    expect(home).toContain('=== "UPCOMING"')
    expect(home).toContain('.sort((left, right) =>')
    expect(home).toContain('.slice(0, 3)')
    expect(home).not.toContain('prisma.event.findMany')
  })

  it('maps the public navigation and sitemap to canonical PRD routes', () => {
    const navigation = source('src/app/(public)/_components/public-navbar.tsx')
    const sitemap = source('src/app/sitemap.ts')
    const nextConfig = source('next.config.ts')

    expect(navigation).toContain('{ label: "Beranda", href: "/" }')
    expect(navigation).toContain('{ label: "Tentang", href: "/tentang" }')
    expect(navigation).toContain('{ label: "Kontak", href: "/kontak" }')
    expect(navigation).toContain('{ label: "Publikasi", href: "/publikasi" }')
    expect(navigation).not.toContain('{ label: "Galeri", href: "/galeri" }')
    expect(navigation).toContain('Gabung Bersama Kami')
    expect(navigation).toContain('href="/gabung"')
    expect(navigation).not.toContain('href: "/program"')
    expect(navigation).not.toContain('href: "/agenda"')
    expect(navigation).not.toContain('href: "/kalender"')
    expect(sitemap).toContain("{ path: '/kegiatan'")
    expect(sitemap).toContain("{ path: '/tentang'")
    expect(sitemap).toContain("{ path: '/struktur'")
    expect(sitemap).not.toContain("{ path: '/galeri'")
    expect(sitemap).not.toContain('prisma.album.findMany')
    expect(sitemap).toContain("{ path: '/publikasi'")
    expect(sitemap).toContain("{ path: '/gabung'")
    expect(sitemap).not.toContain("{ path: '/blog'")
    expect(sitemap).not.toContain("{ path: '/event'")
    expect(nextConfig).toContain("source: '/agenda'")
    expect(nextConfig).toContain("destination: '/kegiatan'")
    expect(nextConfig).not.toContain("source: '/kegiatan'")
  })
})
