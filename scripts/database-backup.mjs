#!/usr/bin/env node
import { copyFile, chmod, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import process from 'node:process'
import {
  acquireRunLock,
  assertExternalDirectory,
  criticalCountSql,
  describeDatabase,
  ensurePrivateDirectory,
  isWithin,
  libpqEnvironment,
  normalizeCounts,
  parsePositiveInteger,
  parseS3Uri,
  pruneLocalBackupSets,
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

async function sendFailureAlert(mode, error) {
  const endpoint = process.env.BACKUP_ALERT_WEBHOOK_URL
  if (!endpoint) return
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        service: 'ikmi-cirebon-database-backup',
        status: 'FAILED',
        mode,
        occurredAt: new Date().toISOString(),
        message: sanitizeOperationalError(error),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`Alert webhook HTTP ${response.status}.`)
  } catch (alertError) {
    console.error(`Peringatan backup juga gagal: ${sanitizeOperationalError(alertError)}`)
  }
}

async function uploadToS3(localPath, key) {
  const { bucket } = parseS3Uri(process.env.BACKUP_S3_URI)
  await run(process.env.AWS_BIN || 'aws', ['s3api', 'put-object', '--bucket', bucket, '--key', key, '--body', localPath, '--server-side-encryption', 'AES256'])
}

async function pruneS3(mode, keep) {
  const { bucket, prefix } = parseS3Uri(process.env.BACKUP_S3_URI)
  const keyPrefix = [prefix, mode].filter(Boolean).join('/') + '/'
  const raw = await run(process.env.AWS_BIN || 'aws', ['s3api', 'list-objects-v2', '--bucket', bucket, '--prefix', keyPrefix, '--output', 'json'], { capture: true })
  const objects = (JSON.parse(raw).Contents ?? [])
    .filter((entry) => typeof entry.Key === 'string' && entry.Key.endsWith('.dump'))
    .sort((left, right) => String(right.LastModified).localeCompare(String(left.LastModified)))
  for (const object of objects.slice(keep)) {
    await run(process.env.AWS_BIN || 'aws', ['s3api', 'delete-object', '--bucket', bucket, '--key', object.Key])
    await run(process.env.AWS_BIN || 'aws', ['s3api', 'delete-object', '--bucket', bucket, '--key', `${object.Key}.manifest.json`])
  }
}

export async function createDatabaseBackup(mode) {
  if (!['daily', 'weekly'].includes(mode)) throw new Error('Mode backup hanya daily atau weekly.')
  const databaseUrl = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('BACKUP_DATABASE_URL atau DATABASE_URL wajib dikonfigurasi.')
  const backupRoot = assertExternalDirectory(workspaceRoot, process.env.BACKUP_DIRECTORY, 'BACKUP_DIRECTORY')
  const externalRoot = process.env.BACKUP_EXTERNAL_DIRECTORY
    ? assertExternalDirectory(workspaceRoot, process.env.BACKUP_EXTERNAL_DIRECTORY, 'BACKUP_EXTERNAL_DIRECTORY')
    : null
  if (!externalRoot && !process.env.BACKUP_S3_URI) {
    throw new Error('External backup wajib: konfigurasi BACKUP_EXTERNAL_DIRECTORY atau BACKUP_S3_URI.')
  }
  if (externalRoot && (isWithin(backupRoot, externalRoot) || isWithin(externalRoot, backupRoot))) {
    throw new Error('BACKUP_EXTERNAL_DIRECTORY harus terpisah dari BACKUP_DIRECTORY, bukan parent/child.')
  }

  const keep = mode === 'daily'
    ? parsePositiveInteger(process.env.BACKUP_DAILY_RETENTION, 7, 'BACKUP_DAILY_RETENTION')
    : parsePositiveInteger(process.env.BACKUP_WEEKLY_RETENTION, 4, 'BACKUP_WEEKLY_RETENTION')
  const modeDirectory = resolve(backupRoot, mode)
  await ensurePrivateDirectory(modeDirectory)
  const releaseLock = await acquireRunLock(backupRoot, `.backup-${mode}.lock`)

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const dumpPath = resolve(modeDirectory, `ikmi-${mode}-${stamp}.dump`)
  const manifestPath = `${dumpPath}.manifest.json`
  try {
    const source = describeDatabase(databaseUrl)
    const counts = await readCounts(databaseUrl)
    await run(process.env.PG_DUMP_BIN || 'pg_dump', [
      '--format=custom',
      '--compress=9',
      '--no-owner',
      '--no-privileges',
      '--file', dumpPath,
    ], { env: libpqEnvironment(databaseUrl) })
    await chmod(dumpPath, 0o600).catch(() => undefined)
    const dump = await readFile(dumpPath)
    if (dump.length < 1024) throw new Error('Backup ditolak karena file dump kosong atau terlalu kecil.')
    const manifest = {
      version: 1,
      product: 'IKMI Cirebon Digital Platform',
      mode,
      createdAt: new Date().toISOString(),
      source,
      format: 'postgresql-custom',
      file: basename(dumpPath),
      bytes: dump.length,
      sha256: sha256(dump),
      retentionSets: keep,
      criticalTableCounts: counts,
    }
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 })

    if (externalRoot) {
      const externalDirectory = resolve(externalRoot, mode)
      await ensurePrivateDirectory(externalDirectory)
      await copyFile(dumpPath, resolve(externalDirectory, basename(dumpPath)))
      await copyFile(manifestPath, resolve(externalDirectory, basename(manifestPath)))
      await chmod(resolve(externalDirectory, basename(dumpPath)), 0o600).catch(() => undefined)
      await chmod(resolve(externalDirectory, basename(manifestPath)), 0o600).catch(() => undefined)
      await pruneLocalBackupSets(externalDirectory, keep)
    }
    if (process.env.BACKUP_S3_URI) {
      const { prefix } = parseS3Uri(process.env.BACKUP_S3_URI)
      const keyBase = [prefix, mode, basename(dumpPath)].filter(Boolean).join('/')
      await uploadToS3(dumpPath, keyBase)
      await uploadToS3(manifestPath, `${keyBase}.manifest.json`)
      await pruneS3(mode, keep)
    }
    await pruneLocalBackupSets(modeDirectory, keep)
    console.log(JSON.stringify({ status: 'PASS', mode, backup: basename(dumpPath), bytes: dump.length, sha256: manifest.sha256, counts }, null, 2))
    return { dumpPath, manifestPath, manifest }
  } catch (error) {
    await Promise.all([
      rm(dumpPath, { force: true }),
      rm(manifestPath, { force: true }),
    ])
    throw error
  } finally {
    await releaseLock()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const modeArg = process.argv.find((value) => value.startsWith('--mode='))?.split('=')[1]
    ?? process.argv[process.argv.indexOf('--mode') + 1]
    ?? 'daily'
  createDatabaseBackup(modeArg).catch(async (error) => {
    await sendFailureAlert(modeArg, error)
    console.error(`Backup gagal: ${sanitizeOperationalError(error)}`)
    process.exitCode = 1
  })
}
