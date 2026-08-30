#!/usr/bin/env node
import { chmod, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import process from 'node:process'
import {
  assertExternalDirectory,
  assertRestoreTarget,
  compareCounts,
  criticalCountSql,
  describeDatabase,
  ensurePrivateDirectory,
  isWithin,
  libpqEnvironment,
  normalizeCounts,
  sanitizeOperationalError,
  sha256,
} from './lib/database-backup-utils.mjs'

const workspaceRoot = resolve(import.meta.dirname, '..')

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      env: options.env ?? process.env,
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'],
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (value) => { stdout += String(value) })
    child.stderr?.on('data', (value) => { stderr += String(value) })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolvePromise(stdout)
      else reject(new Error(`${command} gagal dengan exit code ${code}. ${stderr}`))
    })
  })
}

async function readCounts(databaseUrl) {
  const output = await run(process.env.PSQL_BIN || 'psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-At', '-c', criticalCountSql()], {
    capture: true,
    env: libpqEnvironment(databaseUrl),
  })
  return normalizeCounts(JSON.parse(output.trim()))
}

export async function verifyDatabaseRestore(dumpInput) {
  const dumpPath = resolve(dumpInput || process.env.BACKUP_SOURCE_FILE || '')
  if (!dumpInput && !process.env.BACKUP_SOURCE_FILE) throw new Error('BACKUP_SOURCE_FILE atau argumen path dump wajib diberikan.')
  if (isWithin(workspaceRoot, dumpPath)) throw new Error('Restore test menolak backup yang tersimpan di dalam repository.')
  const manifestPath = `${dumpPath}.manifest.json`
  const [dump, manifestRaw] = await Promise.all([readFile(dumpPath), readFile(manifestPath, 'utf8')])
  const manifest = JSON.parse(manifestRaw)
  if (manifest.sha256 !== sha256(dump)) throw new Error('Checksum backup tidak cocok dengan manifest.')

  const sourceUrl = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL
  const targetUrl = process.env.RESTORE_TEST_DATABASE_URL
  if (!sourceUrl || !targetUrl) throw new Error('DATABASE_URL/BACKUP_DATABASE_URL dan RESTORE_TEST_DATABASE_URL wajib dikonfigurasi.')
  const target = assertRestoreTarget(
    sourceUrl,
    targetUrl,
    process.env.RESTORE_CONFIRM_DATABASE,
    process.env.RESTORE_CONFIRM_HOST,
  )
  const targetEnvironment = libpqEnvironment(targetUrl)
  const currentDatabase = (await run(process.env.PSQL_BIN || 'psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-At', '-c', 'SELECT current_database();'], {
    capture: true,
    env: targetEnvironment,
  })).trim()
  if (currentDatabase !== target.database) throw new Error('Database target aktual tidak sesuai connection string.')

  await run(process.env.PG_RESTORE_BIN || 'pg_restore', [
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-privileges',
    '--exit-on-error',
    '--dbname', target.database,
    dumpPath,
  ], { env: targetEnvironment })

  const actualCounts = await readCounts(targetUrl)
  const expectedCounts = normalizeCounts(manifest.criticalTableCounts)
  const comparison = compareCounts(expectedCounts, actualCounts)
  if (comparison.some((entry) => !entry.matches)) throw new Error('Record count critical table tidak cocok setelah restore.')

  const reportRoot = assertExternalDirectory(
    workspaceRoot,
    process.env.RESTORE_REPORT_DIRECTORY || dirname(dumpPath),
    'RESTORE_REPORT_DIRECTORY',
  )
  await ensurePrivateDirectory(reportRoot)
  const reportPath = resolve(reportRoot, `restore-test-${new Date().toISOString().replace(/[-:.]/g, '')}.json`)
  const report = {
    status: 'PASS',
    verifiedAt: new Date().toISOString(),
    backup: basename(dumpPath),
    backupSha256: manifest.sha256,
    target: describeDatabase(targetUrl),
    comparison,
  }
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 })
  await chmod(reportPath, 0o600).catch(() => undefined)
  console.log(JSON.stringify({ ...report, report: reportPath }, null, 2))
  return report
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  verifyDatabaseRestore(process.argv[2]).catch((error) => {
    console.error(`Restore test gagal: ${sanitizeOperationalError(error)}`)
    process.exitCode = 1
  })
}
