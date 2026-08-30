import { createHash } from 'node:crypto'
import { chmod, mkdir, readdir, rm, stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'

export const CRITICAL_TABLES = [
  'users',
  'programs',
  'agendas',
  'posts',
  'content_plans',
  'pamflet_requests',
  'registrations',
]

export function parsePositiveInteger(value, fallback, name) {
  if (value === undefined || value === '') return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 3650) {
    throw new Error(`${name} harus berupa integer 1-3650.`)
  }
  return parsed
}

export function describeDatabase(connectionString) {
  const url = new URL(connectionString)
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('Database URL harus menggunakan protokol PostgreSQL.')
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (!database) throw new Error('Nama database tidak ditemukan pada connection string.')
  return {
    host: url.hostname.toLowerCase(),
    port: url.port || '5432',
    database,
  }
}

export function libpqEnvironment(connectionString, baseEnvironment = process.env) {
  const url = new URL(connectionString)
  const database = describeDatabase(connectionString)
  return {
    ...baseEnvironment,
    PGHOST: database.host,
    PGPORT: database.port,
    PGDATABASE: database.database,
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGSSLMODE: url.searchParams.get('sslmode') || baseEnvironment.PGSSLMODE || 'prefer',
  }
}

export function assertRestoreTarget(sourceUrl, targetUrl, expectedDatabase, expectedHost) {
  const source = describeDatabase(sourceUrl)
  const target = describeDatabase(targetUrl)
  if (source.database === target.database) {
    throw new Error('Restore ditolak: target sama dengan database sumber/production.')
  }
  if (!/(?:^|[_-])(restore[_-]?test|restore|temporary|temp|test)(?:$|[_-])/i.test(target.database)) {
    throw new Error('Restore ditolak: nama database target harus jelas mengandung restore_test, restore, temporary, temp, atau test.')
  }
  if (!expectedDatabase || target.database !== expectedDatabase) {
    throw new Error('Restore ditolak: RESTORE_CONFIRM_DATABASE harus sama persis dengan nama database target.')
  }
  if (!expectedHost || target.host !== expectedHost.toLowerCase()) {
    throw new Error('Restore ditolak: RESTORE_CONFIRM_HOST harus sama persis dengan host target.')
  }
  return target
}

export function isWithin(parent, candidate) {
  const relation = relative(resolve(parent), resolve(candidate))
  return relation === '' || (!relation.startsWith(`..${sep}`) && relation !== '..' && !isAbsolute(relation))
}

export function assertExternalDirectory(workspaceRoot, candidate, name) {
  if (!candidate) throw new Error(`${name} wajib dikonfigurasi.`)
  const target = resolve(candidate)
  if (isWithin(workspaceRoot, target)) {
    throw new Error(`${name} harus berada di luar repository.`)
  }
  return target
}

export function criticalCountSql() {
  const pairs = CRITICAL_TABLES.map(
    (table) => `'${table}', (SELECT count(*)::bigint FROM public.${table})`,
  ).join(', ')
  return `SELECT json_build_object(${pairs})::text;`
}

export function normalizeCounts(value) {
  return Object.fromEntries(
    CRITICAL_TABLES.map((table) => {
      const count = Number(value?.[table])
      if (!Number.isSafeInteger(count) || count < 0) throw new Error(`Record count ${table} tidak valid.`)
      return [table, count]
    }),
  )
}

export function compareCounts(expected, actual) {
  return CRITICAL_TABLES.map((table) => ({
    table,
    expected: expected[table],
    actual: actual[table],
    matches: expected[table] === actual[table],
  }))
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

export function sanitizeOperationalError(error) {
  const raw = error instanceof Error ? error.message : String(error)
  return raw
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[DATABASE_URL_REDACTED]')
    .replace(/(?:password|secret|token|authorization)=?[^\s,;]*/gi, '$1=[REDACTED]')
    .slice(0, 500)
}

export async function ensurePrivateDirectory(directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await chmod(directory, 0o700).catch(() => undefined)
}

export async function acquireRunLock(directory, lockName) {
  const lockPath = resolve(directory, lockName)
  try {
    const lockStat = await stat(lockPath)
    if (Date.now() - lockStat.mtimeMs > 24 * 60 * 60 * 1000) await rm(lockPath, { force: true })
  } catch {
    // A missing lock is the expected state.
  }
  const { open } = await import('node:fs/promises')
  const handle = await open(lockPath, 'wx', 0o600)
  await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }))
  await handle.close()
  return async () => rm(lockPath, { force: true })
}

export async function pruneLocalBackupSets(directory, keep) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  const dumps = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.dump'))
    .map((entry) => entry.name)
    .sort()
    .reverse()
  const removed = []
  for (const dumpName of dumps.slice(keep)) {
    await rm(resolve(directory, dumpName), { force: true })
    await rm(resolve(directory, `${dumpName}.manifest.json`), { force: true })
    removed.push(dumpName)
  }
  return removed
}

export function parseS3Uri(value) {
  const match = /^s3:\/\/([^/]+)(?:\/(.*))?$/.exec(value ?? '')
  if (!match) throw new Error('BACKUP_S3_URI harus menggunakan format s3://bucket/prefix.')
  return { bucket: match[1], prefix: (match[2] ?? '').replace(/^\/+|\/+$/g, '') }
}
