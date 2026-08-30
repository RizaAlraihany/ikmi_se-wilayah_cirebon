import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('Phase 24 — Backup and Restore', () => {
  it('schedules daily and weekly backups to external encrypted storage', () => {
    const workflow = readSource('.github/workflows/database-backup.yml')
    expect(workflow).toContain("cron: '15 2 * * *'")
    expect(workflow).toContain("cron: '15 3 * * 0'")
    expect(workflow).toContain('BACKUP_S3_URI')
    expect(workflow).toContain('secrets.BACKUP_DATABASE_URL')
    expect(workflow).not.toMatch(/postgres(?:ql)?:\/\/[^$\s]+/i)

    const script = readSource('scripts/database-backup.mjs')
    expect(script).toContain("'--server-side-encryption', 'AES256'")
    expect(script).toContain('BACKUP_DAILY_RETENTION')
    expect(script).toContain('BACKUP_WEEKLY_RETENTION')
    expect(script).toContain('BACKUP_ALERT_WEBHOOK_URL')
    expect(script).toContain('sha256')
  })

  it('keeps backups out of the repository and Git', () => {
    const utilities = readSource('scripts/lib/database-backup-utils.mjs')
    const gitignore = readSource('.gitignore')
    expect(utilities).toContain('harus berada di luar repository')
    expect(gitignore).toContain('*.dump')
    expect(gitignore).toContain('*.sql.gz')
  })

  it('requires an explicitly named non-production restore target', () => {
    const utilities = readSource('scripts/lib/database-backup-utils.mjs')
    const restore = readSource('scripts/database-restore-test.mjs')
    expect(utilities).toContain('target sama dengan database sumber/production')
    expect(utilities).toContain('RESTORE_CONFIRM_DATABASE')
    expect(utilities).toContain('RESTORE_CONFIRM_HOST')
    expect(restore).toContain("'--clean'")
    expect(restore).toContain("'--exit-on-error'")
    expect(restore).not.toContain("'--dbname', targetUrl")
  })

  it('compares every critical table required by the roadmap', () => {
    const utilities = readSource('scripts/lib/database-backup-utils.mjs')
    for (const table of ['users', 'programs', 'agendas', 'posts', 'content_plans', 'pamflet_requests', 'registrations']) {
      expect(utilities).toContain(`'${table}'`)
    }
    expect(utilities).toContain('matches: expected[table] === actual[table]')
  })

  it('does not keep known credentials in Docker Compose', () => {
    const compose = readSource('docker-compose.yml')
    expect(compose).not.toContain('ikmi_password')
    expect(compose).not.toContain('my_super_secret_for_docker')
    expect(compose).toContain('POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required')
  })
})
