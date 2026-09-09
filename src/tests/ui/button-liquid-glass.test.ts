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

describe('IKMI blue actions', () => {
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

  it('keeps intended consumer-level blue actions on the shared material', () => {
    const button = source('src/components/ui/button.tsx')
    const home = source('src/app/(public)/page.tsx')
    const calendar = source('src/app/(public)/_components/calendar-ui.tsx')
    const dashboard = source('src/app/(dashboard)/dashboard-navigation.tsx')
    const notifications = source('src/app/(dashboard)/admin/notifications/page.tsx')
    const documents = source('src/app/(dashboard)/admin/documents/components/DocumentArchiveBoard.tsx')
    const letters = source('src/app/(dashboard)/admin/letters/components/LetterBoard.tsx')
    const contentPlan = source('src/app/(dashboard)/admin/cms/content-plan/components/ContentPlanCalendar.tsx')
    const editor = source('src/components/ui/editor.tsx')

    expect(button).toContain("primary: 'ikmi-button--primary'")
    expect(button).toContain('focus-visible:outline')
    expect(button).toContain('disabled:pointer-events-none')
    expect(home).toContain('className="quick-link"')
    expect(home).toContain('quickAccess.map(({ id, href, label, description, Icon })')
    expect(home).toContain('<Link key={id} href={href}')
    expect(home).toContain('className="hm-text-link"')
    expect(home).not.toContain('ikmi-liquid-blue')
    expect(calendar).toContain('aria-pressed={selectedType === type}')
    for (const consumer of [dashboard, notifications, documents, letters, contentPlan, editor]) {
      expect(consumer).toContain('ikmi-liquid-blue')
    }
    expect(editor).toContain('aria-label={label}')
  })
})
