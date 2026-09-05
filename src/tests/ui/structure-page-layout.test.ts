import { readFileSync } from 'node:fs'
import path from 'node:path'

function readSource(filePath: string) {
  return readFileSync(path.join(process.cwd(), filePath), 'utf8')
}

describe('public structure page layout', () => {
  const pageSource = readSource('src/app/(public)/struktur/page.tsx')
  const gridSource = readSource(
    'src/app/(public)/struktur/department-grid.tsx',
  )
  const cardSource = readSource(
    'src/app/(public)/struktur/struktur-card.tsx',
  )
  const cssSource = readSource('src/app/globals.css')

  it('keeps the original public structure information', () => {
    expect(pageSource).toContain('<h1>Struktur Pengurus</h1>')
    expect(pageSource).toContain(
      'Kenali orang-orang di balik gerak IKMI Se-Wilayah Cirebon.',
    )
    expect(pageSource).toContain('structure-summary')
    expect(pageSource).toMatch(/period\?\.name \?\? ['"]Belum ditetapkan['"]/)
    expect(pageSource).toContain('sortedGroups.length')
    expect(pageSource).toContain('totalOfficerCount')
    expect(cardSource).toContain('<span>{member.unitName}</span>')
  })

  it('keeps the existing organizational diagram structure', () => {
    expect(gridSource).toContain('structure-chart-lead')
    expect(gridSource).toContain('structure-chart-departments--connected')
    expect(gridSource).toContain('structure-chart-node')
    expect(gridSource).toContain('<UnitButton')
  })

  it('keeps the interaction hint visible without overlapping the diagram', () => {
    expect(pageSource).toContain('Lihat detail setiap divisi')
    expect(pageSource).toContain(
      'Pilih foto divisi untuk membuka susunan pengurusnya.',
    )
    expect(pageSource).toContain('className="structure-hint-icon"')
    expect(pageSource).toContain('className="structure-hint-copy"')
    expect(pageSource.indexOf('className="structure-hint-copy"')).toBeLessThan(
      pageSource.indexOf('className="structure-summary"'),
    )
    expect(pageSource.indexOf('className="structure-summary"')).toBeLessThan(
      pageSource.indexOf('className="structure-content"'),
    )
    expect(cssSource).toContain('background: transparent')
    expect(cssSource).toContain('box-shadow: none')
    expect(cssSource).toContain('align-items: center')
    expect(cssSource).toContain('align-self: stretch')
    expect(cssSource).toContain('justify-content: center')
    expect(cssSource).toContain('text-wrap: pretty')
    expect(cssSource).toContain('margin-top: 0')
    expect(cssSource).not.toContain('margin-top: -4.85rem')
  })

  it('places the active-period summary in a responsive liquid-glass card', () => {
    expect(pageSource).toContain('className="structure-hero-layout"')
    expect(cssSource).toContain(
      'grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem)',
    )
    expect(cssSource).toContain('rgba(0, 23, 105, 0.28)')
    expect(cssSource).toContain('inset 0 1px 0 rgba(255, 255, 255, 0.24)')
    expect(cssSource).toMatch(
      /backdrop-filter:\s*blur\(var\(--glass-blur-interactive\)\)\s*saturate\(var\(--glass-saturate\)\)/,
    )
  })

  it('provides a labelled, readable officer detail dialog', () => {
    expect(gridSource).toContain(
      'aria-describedby="structure-modal-description"',
    )
    expect(gridSource).toContain('structure-modal-handle')
    expect(cardSource).toContain(
      'aria-label={`${member.name}, ${member.positionName}, ${member.unitName}`}',
    )
  })
})
