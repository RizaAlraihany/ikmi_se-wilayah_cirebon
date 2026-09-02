import { readFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'

const sourceRoot = resolve(process.cwd(), 'src')

function resolveLocalImport(importer: string, specifier: string) {
  const base = specifier.startsWith('@/') ? resolve(sourceRoot, specifier.slice(2)) : resolve(dirname(importer), specifier)
  const candidates = [base, base + '.ts', base + '.tsx', base + '.js', base + '.jsx', resolve(base, 'index.ts'), resolve(base, 'index.tsx')]
  return candidates.find((candidate) => extname(candidate) && readFileExists(candidate)) || null
}

function readFileExists(path: string) {
  try {
    readFileSync(path)
    return true
  } catch {
    return false
  }
}

function collectLocalDependencyGraph(entry: string) {
  const pending = [resolve(process.cwd(), entry)]
  const visited = new Set<string>()
  while (pending.length) {
    const current = pending.pop()!
    if (visited.has(current)) continue
    visited.add(current)
    const source = readFileSync(current, 'utf8')
    for (const match of source.matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)) {
      const dependency = match[1]
      if (!dependency || (!dependency.startsWith('@/') && !dependency.startsWith('.'))) continue
      const resolved = resolveLocalImport(current, dependency)
      if (resolved) pending.push(resolved)
    }
  }
  return visited
}

describe('article sanitizer server boundary', () => {
  it('keeps the public submission schema dependency graph client-safe', () => {
    const graph = collectLocalDependencyGraph('src/features/kirim-tulisan/schemas.ts')
    const graphSource = [...graph].map((path) => readFileSync(path, 'utf8')).join('\n')

    expect([...graph]).not.toContain(resolve(process.cwd(), 'src/features/blog/article-html.ts'))
    expect(graphSource).not.toContain('isomorphic-dompurify')
    expect(graphSource).not.toContain("import 'server-only'")
  })

  it('marks the HTML persistence sanitizer as server-only', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/features/blog/article-html.ts'), 'utf8')
    expect(source).toContain("import 'server-only'")
    expect(source).toContain("from 'isomorphic-dompurify'")
  })
})
