import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('Tentang officer preview', () => {
  const pageSource = readFileSync(
    path.join(process.cwd(), 'src/app/(public)/tentang-kami/page.tsx'),
    'utf8',
  )

  it('shows BPH leaders, secretaries, and treasurers from their real positions', () => {
    expect(pageSource).toContain(
      'MAIN_UNIT_PREVIEW_POSITION_PATTERN =',
    )
    expect(pageSource).toContain(
      '/ketua umum|wakil ketua|sekretaris umum|bendahara umum/i',
    )
    expect(pageSource).toContain(
      'MAIN_UNIT_PREVIEW_POSITION_PATTERN.test(member.positionName)',
    )
  })

  it('shows the chair and secretary of each department', () => {
    expect(pageSource).toContain(
      'DEPARTMENT_PREVIEW_POSITION_PATTERN =',
    )
    expect(pageSource).toContain(
      '/ketua departemen|kepala departemen|sekretaris departemen/i',
    )
    expect(pageSource).toContain(
      'DEPARTMENT_PREVIEW_POSITION_PATTERN.test(member.positionName)',
    )
    expect(pageSource).toContain('buildOfficerPreview(officerGroups)')
    expect(pageSource).toContain('officerPreviewGroups.map')
    expect(pageSource).not.toContain('officerGroups.map((group)')
  })

  it('keeps the complete roster available through the structure route', () => {
    expect(pageSource).toContain('href="/struktur"')
    expect(pageSource).toContain('Lihat Seluruh Pengurus')
  })
})
