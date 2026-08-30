import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function cssRule(css: string, selector: string) {
  const selectorIndex = css.indexOf(selector)
  const openingBrace = css.indexOf('{', selectorIndex)
  const closingBrace = css.indexOf('}', openingBrace)

  return css.slice(openingBrace + 1, closingBrace)
}

describe('IKMI blue liquid-glass actions', () => {
  it('uses translucent component tokens without the previous 3D gradient or lift', () => {
    const css = source('src/app/globals.css')
    const primaryRule = cssRule(css, '.ikmi-button--primary {')

    expect(css).toContain('--button-glass-bg: rgba(')
    expect(css).toContain('--button-glass-blur: 16px')
    expect(primaryRule).toContain('background: var(--button-glass-bg)')
    expect(primaryRule).toContain('box-shadow: var(--button-glass-shadow)')
    expect(primaryRule).not.toContain('linear-gradient')
    expect(css).toContain('backdrop-filter: blur(var(--button-glass-blur))')
    expect(css).toContain('transform: none !important')
  })

  it('routes custom blue controls through the shared liquid material', () => {
    for (const path of [
      'src/app/(public)/page.tsx',
      'src/app/(public)/_components/calendar-ui.tsx',
      'src/app/(dashboard)/dashboard-navigation.tsx',
      'src/app/(dashboard)/admin/notifications/page.tsx',
      'src/app/(dashboard)/admin/documents/components/DocumentArchiveBoard.tsx',
      'src/app/(dashboard)/admin/letters/components/LetterBoard.tsx',
      'src/components/ui/editor.tsx',
    ]) {
      expect(source(path)).toContain('ikmi-liquid-blue')
    }
  })
})
