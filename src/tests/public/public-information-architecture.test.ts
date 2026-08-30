import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('public PRD information architecture', () => {
  it('keeps the homepage editorial sequence and reads Agenda rather than legacy Event data', () => {
    const home = source('src/app/(public)/page.tsx')

    expect(home).toContain('Akses cepat')
    expect(home).toContain('Profil &amp; Identitas')
    expect(home).toContain('href="/tentang-kami"')
    expect(home).toContain('Pelajari Selengkapnya Tentang Kami')
    expect(home).toContain('Kegiatan Terdekat')
    expect(home).toContain('Agenda dan Program')
    expect(home).toContain('Indeks Publikasi')
    expect(home).not.toContain('Galeri dan dokumentasi')
    expect(home).not.toContain('className="home-gallery')
    expect(home).not.toContain('getPublicAlbums')
    expect(home).toContain('Sering Ditanyakan (FAQ)')
    expect(home).toContain('id="faq"')
    expect(home).toContain('<details')
    expect(home).not.toContain('Mari Bertumbuh Bersama IKMI Cirebon')
    expect(home).toContain('getPublicAgendaOccurrences')
    expect(home).toContain('=== "AKAN_DATANG"')
    expect(home).toContain('=== "UPCOMING"')
    expect(home).toContain('.sort((left, right) =>')
    expect(home).toContain('.slice(0, 3)')
    expect(home).toContain('home-program-icon')
    expect(home).toContain('href="/agenda"')
    expect(home).toContain('href="/program"')
    expect(home).not.toContain('prisma.event.findMany')
  })

  it('maps the public navigation and sitemap to real PRD routes', () => {
    const navigation = source('src/app/(public)/_components/public-navbar.tsx')
    const sitemap = source('src/app/sitemap.ts')
    const nextConfig = source('next.config.ts')

    expect(navigation).toContain('{ label: "Kontak", href: "/kontak" }')
    expect(navigation).toContain('{ label: "Publikasi", href: "/publikasi" }')
    expect(navigation).not.toContain('{ label: "Galeri", href: "/galeri" }')
    expect(navigation).toContain('Gabung Bersama Kami')
    expect(navigation).toContain('href="/gabung"')
    expect(navigation).toContain('children:')
    expect(navigation).toContain('desktop-dropdown')
    expect(navigation).toContain('DropdownLink')
    expect(navigation).not.toContain("label: 'Keanggotaan'")
    expect(navigation).toContain('href: "/publikasi"')
    expect(navigation).not.toContain('href: "/kegiatan"')
    expect(navigation).toContain('label: "Kegiatan"')
    expect(sitemap).not.toContain("{ path: '/kegiatan'")
    expect(sitemap).not.toContain("{ path: '/galeri'")
    expect(sitemap).not.toContain('prisma.album.findMany')
    expect(sitemap).toContain("{ path: '/publikasi'")
    expect(sitemap).toContain("{ path: '/gabung'")
    expect(sitemap).toContain('...agendas.map')
    expect(sitemap).not.toContain("{ path: '/blog'")
    expect(sitemap).not.toContain("{ path: '/event'")
    expect(nextConfig).not.toContain("source: '/gabung'")
  })
})
