import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('public route privacy regression', () => {
  it('does not query registration data or render officer addresses', () => {
    const structurePage = readSource('src/app/(public)/struktur/page.tsx')
    const structureCard = readSource('src/app/(public)/struktur/struktur-card.tsx')

    expect(structurePage).not.toContain('prisma.registration.findMany')
    expect(structureCard).not.toContain('member.address')
    expect(structureCard).not.toContain('member.campus')
  })

  it('does not select or render program budgets on public Program routes', () => {
    const publicProgramQuery = readSource('src/features/public/public-program.ts')
    const programPage = readSource('src/app/(public)/program/[slug]/page.tsx')

    expect(publicProgramQuery).not.toContain('budgetPlan')
    expect(publicProgramQuery).not.toContain('plannedBudget')
    expect(programPage).not.toContain('budgetPlan')
    expect(programPage).toContain('getPublicProgramBySlug')
  })
})
