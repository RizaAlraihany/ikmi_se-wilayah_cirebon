import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function relativeLuminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? []
  const [red = 0, green = 0, blue = 0] = channels.map((value) => (
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ))
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
}

function contrastRatio(first: string, second: string) {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05)
}

function cssToken(source: string, name: string) {
  const value = new RegExp(`--${name}:\\s*(#[a-f\\d]{6})`, 'i').exec(source)?.[1]
  if (!value) throw new Error(`Token --${name} tidak ditemukan.`)
  return value
}

describe('Phase 21 — Performance and accessibility', () => {
  it('keeps small muted text at WCAG AA contrast on canvas and surface', () => {
    const css = readSource('src/app/globals.css')
    const muted = cssToken(css, 'text-muted')
    const canvas = cssToken(css, 'color-base-white')

    expect(contrastRatio(muted, canvas)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(muted, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('provides a keyboard skip link and a stable focus target', () => {
    const layout = readSource('src/app/layout.tsx')
    const css = readSource('src/app/globals.css')

    expect(layout).toContain('href="#main-content"')
    expect(layout).toContain('id="main-content"')
    expect(layout).toContain('tabIndex={-1}')
    expect(css).toContain('.skip-link:focus-visible')
  })

  it('honours reduced motion and does not block page zoom', () => {
    const css = readSource('src/app/globals.css')
    const layout = readSource('src/app/layout.tsx')

    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('scroll-behavior: auto !important')
    expect(layout).not.toMatch(/maximumScale|userScalable/i)
  })

  it('keeps content-first public routes as server components', () => {
    const serverPages = [
      'src/app/(public)/page.tsx',
      'src/app/(public)/program/[slug]/page.tsx',
      'src/app/(public)/agenda/[slug]/page.tsx',
      'src/app/(public)/publikasi/[category]/[slug]/page.tsx',
    ]

    for (const page of serverPages) {
      expect(readSource(page).trimStart()).not.toMatch(/^['"]use client['"]/)
    }
  })

  it('reserves responsive image space and gives fill images explicit sizes', () => {
    const homepage = readSource('src/app/(public)/page.tsx')
    const program = readSource('src/app/(public)/program/[slug]/page.tsx')
    const article = readSource('src/app/(public)/publikasi/[category]/[slug]/page.tsx')
    const hero = readSource('src/app/(public)/_components/hero-slideshow.tsx')

    expect(homepage).toContain('sizes=')
    expect(program).toContain('sizes=')
    expect(program).toContain('<picture>')
    expect(program).not.toContain('sm:hidden" />')
    expect(article).toContain('sizes=')
    expect(hero).toContain('sizes="100vw"')
    expect(hero).toContain('<picture>')
  })

  it('uses two self-hosted font families with a bounded weight set', () => {
    const layout = readSource('src/app/layout.tsx')

    expect(layout).toContain('Montserrat')
    expect(layout).toContain('Poppins')
    expect(layout).toContain('weight: ["600", "700"]')
    expect(layout).toContain('weight: ["400", "500", "600", "700"]')
  })
})
