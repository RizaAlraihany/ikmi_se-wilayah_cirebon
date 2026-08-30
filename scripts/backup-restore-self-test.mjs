#!/usr/bin/env node
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import {
  assertExternalDirectory,
  assertRestoreTarget,
  compareCounts,
  normalizeCounts,
  pruneLocalBackupSets,
  sanitizeOperationalError,
  sha256,
} from './lib/database-backup-utils.mjs'

const source = 'postgresql://source-user:source-pass@source.example:5432/ikmi'
assert.throws(
  () => assertRestoreTarget(source, source, 'ikmi', 'source.example'),
  /target sama/,
)
assert.throws(
  () => assertRestoreTarget(source, 'postgresql://test:test@localhost:5432/ordinary', 'ordinary', 'localhost'),
  /nama database target/,
)
assert.throws(
  () => assertRestoreTarget(source, 'postgresql://test:test@localhost:5432/ikmi_restore_test', 'wrong', 'localhost'),
  /RESTORE_CONFIRM_DATABASE/,
)
assert.equal(
  assertRestoreTarget(source, 'postgresql://test:test@localhost:5432/ikmi_restore_test', 'ikmi_restore_test', 'localhost').database,
  'ikmi_restore_test',
)
assert.throws(
  () => assertRestoreTarget(source, 'postgresql://test:test@localhost:5432/ikmi_restore_test', 'ikmi_restore_test', 'wrong-host'),
  /RESTORE_CONFIRM_HOST/,
)

const counts = normalizeCounts({
  users: 1,
  programs: 2,
  agendas: 3,
  posts: 4,
  content_plans: 5,
  pamflet_requests: 6,
  registrations: 7,
})
assert.ok(compareCounts(counts, { ...counts }).every((entry) => entry.matches))
assert.equal(sha256(Buffer.from('IKMI')), 'fc15dd511824f8f39240d9431596e4e2b6bb8e53095bde4f59f7768ddf06b331')
assert.doesNotMatch(
  sanitizeOperationalError(new Error('postgresql://admin:secret@db.example/ikmi token=abc')),
  /admin:secret|token=abc/,
)

const testRoot = await mkdtemp(resolve(tmpdir(), 'ikmi-backup-self-test-'))
try {
  assert.throws(() => assertExternalDirectory(process.cwd(), process.cwd(), 'BACKUP_DIRECTORY'), /di luar repository/)
  for (const name of ['ikmi-daily-20260801.dump', 'ikmi-daily-20260802.dump', 'ikmi-daily-20260803.dump']) {
    await writeFile(resolve(testRoot, name), 'dump')
    await writeFile(resolve(testRoot, `${name}.manifest.json`), '{}')
  }
  const removed = await pruneLocalBackupSets(testRoot, 2)
  assert.deepEqual(removed, ['ikmi-daily-20260801.dump'])
} finally {
  await rm(testRoot, { recursive: true, force: true })
}

console.log('Backup/restore safety self-test: PASS')
