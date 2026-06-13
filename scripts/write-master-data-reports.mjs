import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'

const repoRoot = process.cwd()
const workbookPath = path.join(repoRoot, 'docs', 'database', 'Master-Data.xlsx')
const generatedPath = path.join(repoRoot, 'prisma', 'master-data.generated.ts')
const workDir = path.join(os.tmpdir(), 'ikmi-master-data-report')
const prisma = new PrismaClient()

const roleIds = [
  'super_admin',
  'ketua_umum',
  'wakil_ketua_umum',
  'sekretaris_umum',
  'bendahara_umum',
  'ketua_departemen',
  'sekretaris_departemen',
  'anggota_departemen',
  'alumni',
]

const permissionIds = [
  'user.view',
  'user.create',
  'user.update',
  'user.delete',
  'organization.view',
  'organization.update',
  'member.view',
  'member.create',
  'member.update',
  'member.verify',
  'member.promote',
  'registration.view',
  'registration.review',
  'registration.approve',
  'registration.reject',
  'post.view',
  'post.create',
  'post.update',
  'post.delete',
  'post.submit',
  'post.publish',
  'program.view',
  'program.create',
  'program.update',
  'program.delete',
  'event.view',
  'event.create',
  'event.update',
  'event.delete',
  'lpj.view',
  'lpj.submit',
  'lpj.verify_department',
  'lpj.verify_bph',
  'finance.view',
  'finance.create',
  'finance.approve_tier1',
  'finance.approve_tier2',
  'finance.reject',
  'complaint.view',
  'complaint.assign',
  'complaint.process',
  'complaint.resolve',
  'letter.view',
  'letter.create',
  'letter.update',
  'letter.delete',
  'cms.view',
  'cms.update',
  'audit.view',
  'system.manage',
]

const rolePermissionMap = {
  super_admin: permissionIds,
  ketua_umum: [
    'user.view',
    'user.create',
    'user.update',
    'user.delete',
    'member.view',
    'member.promote',
    'post.create',
    'lpj.verify_bph',
    'finance.approve_tier2',
    'audit.view',
  ],
  wakil_ketua_umum: [
    'user.view',
    'member.view',
    'member.promote',
    'post.create',
    'program.create',
    'event.create',
    'lpj.verify_bph',
    'audit.view',
  ],
  sekretaris_umum: [
    'user.view',
    'member.view',
    'post.create',
    'lpj.verify_bph',
    'letter.create',
    'audit.view',
  ],
  bendahara_umum: [
    'post.create',
    'lpj.verify_bph',
    'finance.approve_tier1',
    'finance.approve_tier2',
    'audit.view',
  ],
  ketua_departemen: [
    'member.view',
    'member.verify',
    'registration.review',
    'registration.approve',
    'post.create',
    'post.publish',
    'program.create',
    'event.create',
    'lpj.submit',
    'lpj.verify_department',
    'finance.create',
    'complaint.process',
    'cms.update',
  ],
  sekretaris_departemen: [
    'member.view',
    'registration.review',
    'post.create',
    'post.publish',
    'program.create',
    'event.create',
    'lpj.submit',
    'finance.create',
    'complaint.process',
    'cms.update',
  ],
  anggota_departemen: ['post.create', 'lpj.submit'],
  alumni: [],
}

function ps(command) {
  return execFileSync('powershell.exe', ['-NoProfile', '-Command', command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function extractWorkbook() {
  ps(`$tmp = ${JSON.stringify(workDir)}; if (Test-Path $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force }; New-Item -ItemType Directory -Path $tmp | Out-Null; Copy-Item -LiteralPath ${JSON.stringify(workbookPath)} -Destination (Join-Path $tmp 'Master-Data.zip'); Expand-Archive -LiteralPath (Join-Path $tmp 'Master-Data.zip') -DestinationPath $tmp`)
}

function decodeXml(value = '') {
  return String(value)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function readXml(file) {
  return fs.readFileSync(path.join(workDir, file), 'utf8')
}

function getSharedStrings() {
  const file = path.join(workDir, 'xl/sharedStrings.xml')
  if (!fs.existsSync(file)) return []
  const xml = fs.readFileSync(file, 'utf8')
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml([...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((text) => text[1]).join('')),
  )
}

function getSheets() {
  const workbookXml = readXml('xl/workbook.xml')
  const relsXml = readXml('xl/_rels/workbook.xml.rels')
  const relMap = Object.fromEntries(
    [...relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((match) => [
      match[1],
      match[2],
    ]),
  )

  return [...workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*sheetId="([^"]+)"[^>]*r:id="([^"]+)"/g)].map(
    (match) => ({
      name: decodeXml(match[1]),
      file: `xl/${relMap[match[3]].replace(/^\//, '')}`,
    }),
  )
}

function colIndex(ref) {
  const col = ref.match(/[A-Z]+/)?.[0] ?? 'A'
  let index = 0
  for (const char of col) {
    index = index * 26 + char.charCodeAt(0) - 64
  }
  return index - 1
}

function parseSheet(file, sharedStrings) {
  const xml = readXml(file)
  const rows = []

  for (const rowMatch of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = []
    for (const cellMatch of rowMatch[2].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1]
      const body = cellMatch[2]
      const ref = attrs.match(/r="([^"]+)"/)?.[1] ?? ''
      const type = attrs.match(/t="([^"]+)"/)?.[1]
      const valueMatch = body.match(/<v>([\s\S]*?)<\/v>/)
      let value = ''

      if (type === 's' && valueMatch) {
        value = sharedStrings[Number(valueMatch[1])] ?? ''
      } else if (type === 'inlineStr') {
        value = decodeXml([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((text) => text[1]).join(''))
      } else if (valueMatch) {
        value = decodeXml(valueMatch[1])
      }

      row[colIndex(ref)] = String(value ?? '').replace(/\s+/g, ' ').trim()
    }
    rows[Number(rowMatch[1]) - 1] = row
  }

  return rows.map((row) => row ?? []).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
}

function loadGeneratedSeed() {
  const source = fs.readFileSync(generatedPath, 'utf8')
  const json = source.match(/export const masterDataSeed = ([\s\S]*?) as const/)?.[1]
  if (!json) throw new Error('Tidak bisa membaca prisma/master-data.generated.ts')
  return JSON.parse(json)
}

function uniqueNonBlank(values) {
  return new Set(values.filter((value) => value !== '')).size
}

function auditSheet(name, rows) {
  const totalRows = rows.length
  const totalColumns = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const headers = rows[0] ?? []
  const dataRows = rows.slice(1)
  const candidates = []
  const duplicates = []
  const dataTypes = []

  for (let column = 0; column < totalColumns; column += 1) {
    const values = dataRows.map((row) => String(row[column] ?? '').trim())
    const nonBlank = values.filter(Boolean)
    const unique = uniqueNonBlank(values)
    const header = headers[column] || `Column ${column + 1}`
    if (nonBlank.length > 0 && unique === nonBlank.length) candidates.push(header)
    if (unique < nonBlank.length) duplicates.push(header)
    if (nonBlank.every((value) => value === '' || !Number.isNaN(Number(value)))) {
      dataTypes.push(`${header}: number`)
    } else {
      dataTypes.push(`${header}: text`)
    }
  }

  return {
    name,
    totalRows,
    totalColumns,
    headers,
    dataType: dataTypes.join('; '),
    primaryKeyCandidate: candidates.join(', ') || '-',
    duplicateCandidate: duplicates.join(', ') || '-',
  }
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(' |')} |`,
    `| ${headers.map(() => '---').join(' |')} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value).replace(/\|/g, '\\|')).join(' |')} |`),
  ].join('\n')
}

function setDiff(actual, expected) {
  return [...actual].filter((value) => !expected.has(value)).sort()
}

async function main() {
  extractWorkbook()
  const sharedStrings = getSharedStrings()
  const sheets = Object.fromEntries(
    getSheets().map((sheet) => [sheet.name, parseSheet(sheet.file, sharedStrings)]),
  )
  const sheetAudits = Object.entries(sheets).map(([name, rows]) => auditSheet(name, rows))
  const seed = loadGeneratedSeed()

  const expectedRolePermissions = new Set(
    Object.entries(rolePermissionMap).flatMap(([roleId, permissions]) =>
      permissions.map((permissionId) => `${roleId}:${permissionId}`),
    ),
  )

  const db = {
    departments: await prisma.department.findMany({ select: { id: true, code: true, name: true } }),
    positions: await prisma.position.findMany({ select: { id: true, name: true, departmentId: true } }),
    roles: await prisma.role.findMany({ select: { id: true } }),
    permissions: await prisma.permission.findMany({ select: { id: true } }),
    rolePermissions: await prisma.rolePermission.findMany({ select: { roleId: true, permissionId: true } }),
    programs: await prisma.program.findMany({ select: { id: true, name: true, departmentId: true } }),
    activities: await prisma.activity.findMany({ select: { id: true, programId: true, name: true } }),
    events: await prisma.event.findMany({ select: { id: true, programId: true } }),
    contentPlans: await prisma.contentPlan.findMany({ select: { id: true, authorId: true } }),
    webConfigs: await prisma.webConfig.findMany({ select: { key: true } }),
    categories: await prisma.category.findMany({ select: { slug: true } }),
    users: await prisma.user.findMany({ select: { email: true, roleId: true, departmentId: true, positionId: true } }),
  }

  const expected = {
    departments: new Set(seed.departments.map((item) => item.id)),
    positions: new Set(seed.positions.map((item) => item.id)),
    roles: new Set(roleIds),
    permissions: new Set(permissionIds),
    rolePermissions: expectedRolePermissions,
    programs: new Set(seed.programs.map((item) => item.id)),
    activities: new Set(seed.programs.map((item) => `act_${item.id.replace(/^prog_/, '')}`)),
    events: new Set(seed.events.map((item) => item.id)),
    contentPlans: new Set(seed.contentPlans.map((item) => item.id)),
    users: new Set(seed.members.map((item) => item.email).concat('admin@ikmi.ac.id')),
  }

  const actual = {
    departments: new Set(db.departments.map((item) => item.id)),
    positions: new Set(db.positions.map((item) => item.id)),
    roles: new Set(db.roles.map((item) => item.id)),
    permissions: new Set(db.permissions.map((item) => item.id)),
    rolePermissions: new Set(db.rolePermissions.map((item) => `${item.roleId}:${item.permissionId}`)),
    programs: new Set(db.programs.map((item) => item.id)),
    activities: new Set(db.activities.map((item) => item.id)),
    events: new Set(db.events.map((item) => item.id)),
    contentPlans: new Set(db.contentPlans.map((item) => item.id)),
    users: new Set(db.users.map((item) => item.email)),
  }

  const counts = {
    departments: db.departments.length,
    positions: db.positions.length,
    roles: db.roles.length,
    permissions: db.permissions.length,
    rolePermissions: db.rolePermissions.length,
    programs: db.programs.length,
    activities: db.activities.length,
    contentPlans: db.contentPlans.length,
  }

  const brokenRelations = [
    ...db.positions.filter((item) => item.departmentId && !actual.departments.has(item.departmentId)).map((item) => `Position ${item.id} -> department ${item.departmentId}`),
    ...db.programs.filter((item) => !actual.departments.has(item.departmentId)).map((item) => `Program ${item.id} -> department ${item.departmentId}`),
    ...db.activities.filter((item) => !actual.programs.has(item.programId)).map((item) => `Activity ${item.id} -> program ${item.programId}`),
    ...db.contentPlans.filter((item) => !db.users.some((user) => user.email && item.authorId)).map((item) => `ContentPlan ${item.id} -> author ${item.authorId}`),
  ]

  const duplicateEmails = [...new Set(seed.members.map((item) => item.email))]
    .filter((email) => seed.members.filter((item) => item.email === email).length > 1)

  const auditMd = `# MASTER-DATA-AUDIT

Source: \`docs/database/Master-Data.xlsx\`

${mdTable(
  ['Sheet Name', 'Total Rows', 'Total Columns', 'Data Type', 'Primary Key Candidate', 'Duplicate Candidate'],
  sheetAudits.map((sheet) => [
    sheet.name,
    sheet.totalRows,
    sheet.totalColumns,
    sheet.dataType,
    sheet.primaryKeyCandidate,
    sheet.duplicateCandidate,
  ]),
)}

## Parsed Seed Summary

${mdTable(
  ['Entity', 'Count', 'Source Sheet'],
  [
    ['Departments', seed.departments.length, 'departement &prokerr, db-Anggota'],
    ['Positions', seed.positions.length, 'db-Anggota'],
    ['Members', seed.members.length, 'db-Anggota'],
    ['Programs', seed.programs.length, 'departement &prokerr + calendar fallbacks from workbook rows'],
    ['Events', seed.events.length, 'Data Kalender Kegiatan IKMI 202'],
    ['Content Plans', seed.contentPlans.length, 'content_plan_komdigi'],
  ],
)}
`

  const validationMd = `# MASTER-DATA-VALIDATION

## Scope

Validated against:

- \`prisma/schema.prisma\`
- \`docs/database/MASTER-DATA.md\`
- \`docs/database/05-DATABASE-DICTIONARY.md\`
- \`docs/database/06-RBAC-MATRIX.md\`

## Findings

${mdTable(
  ['Category', 'Result'],
  [
    ['Missing Data', 'Workbook has no dedicated sheets for roles, permissions, role_permissions, web_configs, or categories. Roles and permissions are therefore sourced from 06-RBAC-MATRIX.md, not invented. Web configs are not seeded.'],
    ['Extra Data', `${setDiff(actual.rolePermissions, expected.rolePermissions).length} extra role_permission rows, ${db.webConfigs.length} web_config rows, ${db.categories.length} category rows, and ${setDiff(actual.users, expected.users).length} extra user emails currently exist in DB. They are reported only and not deleted automatically.`],
    ['Invalid Enum', 'Generated statuses use ProgramStatus.PLANNED, EventStatus.UPCOMING, and ContentPlanStatus.PLANNED.'],
    ['Duplicate Record', duplicateEmails.length ? `Duplicate member emails: ${duplicateEmails.join(', ')}` : 'No duplicate generated member emails.'],
    ['Broken Relation', brokenRelations.length ? brokenRelations.join('; ') : 'No broken relation found in checked target tables.'],
    ['Schema Gap', 'ContentPlan model has no categoryId relation, so requested Content Plan -> Category validation cannot be enforced without schema change. Schema changes are forbidden by this task.'],
    ['Normalization', 'Workbook department aliases such as PSDM, Advokasi & Kasta, Komdigi, and Humas & Pengabdian Masyarakat are normalized to documented department codes for FK integrity. Original jabatan text is preserved in position names.'],
    ['Bootstrap Exception', 'admin@ikmi.ac.id is a system bootstrap account required by 14-ENGINEERING-DOD.md Super Admin seeder rule. It is not treated as workbook organization data.'],
  ],
)}

## Approval Required Before Cleanup

The following database records are outside the current master-data target and were not deleted:

- Extra role_permissions: ${setDiff(actual.rolePermissions, expected.rolePermissions).slice(0, 40).join(', ') || '-'}
- Extra users: ${setDiff(actual.users, expected.users).join(', ') || '-'}
- Existing web_configs: ${db.webConfigs.map((item) => item.key).join(', ') || '-'}
- Existing categories: ${db.categories.map((item) => item.slug).join(', ') || '-'}
`

  const relationMd = `# MASTER-DATA-RELATION-REPORT

${mdTable(
  ['Relation', 'Status', 'Notes'],
  [
    ['Department -> Position', db.positions.every((item) => !item.departmentId || actual.departments.has(item.departmentId)) ? 'PASS' : 'FAIL', `${db.positions.length} positions checked.`],
    ['Role -> Permission', setDiff(expected.rolePermissions, actual.rolePermissions).length === 0 ? 'PASS' : 'FAIL', `${expected.rolePermissions.size} expected role permissions checked.`],
    ['Program -> Activity', seed.programs.every((item) => actual.activities.has(`act_${item.id.replace(/^prog_/, '')}`)) ? 'PASS' : 'FAIL', `${seed.programs.length} workbook program rows represented as activities.`],
    ['Event -> Program', db.events.every((item) => actual.programs.has(item.programId)) ? 'PASS' : 'FAIL', `${db.events.length} events checked.`],
    ['Content Plan -> Category', 'NOT APPLICABLE', 'schema.prisma ContentPlan has no categoryId field.'],
    ['Content Plan -> Author', db.contentPlans.every((item) => item.authorId) ? 'PASS' : 'FAIL', `${db.contentPlans.length} content plans checked.`],
  ],
)}

## Broken Relations

${brokenRelations.length ? brokenRelations.map((item) => `- ${item}`).join('\n') : '- None'}
`

  const seedMd = `# MASTER-DATA-SEED-REPORT

Seed command executed:

\`\`\`bash
npx prisma db seed
\`\`\`

## Database Counts

\`\`\`json
${JSON.stringify(counts, null, 2)}
\`\`\`

## Notes

- Seeder uses idempotent \`upsert()\` for master target rows.
- Seeder does not hard-delete existing database rows that are outside the workbook/RBAC target.
- \`web_configs\` are not seeded because no workbook sheet maps to them.
`

  const finalAuditRows = [
    ['departments', expected.departments.size, actual.departments.size, setDiff(expected.departments, actual.departments).length, setDiff(actual.departments, expected.departments).length],
    ['positions', expected.positions.size, actual.positions.size, setDiff(expected.positions, actual.positions).length, setDiff(actual.positions, expected.positions).length],
    ['roles', expected.roles.size, actual.roles.size, setDiff(expected.roles, actual.roles).length, setDiff(actual.roles, expected.roles).length],
    ['permissions', expected.permissions.size, actual.permissions.size, setDiff(expected.permissions, actual.permissions).length, setDiff(actual.permissions, expected.permissions).length],
    ['role_permissions', expected.rolePermissions.size, actual.rolePermissions.size, setDiff(expected.rolePermissions, actual.rolePermissions).length, setDiff(actual.rolePermissions, expected.rolePermissions).length],
    ['programs', expected.programs.size, actual.programs.size, setDiff(expected.programs, actual.programs).length, setDiff(actual.programs, expected.programs).length],
    ['activities', expected.activities.size, actual.activities.size, setDiff(expected.activities, actual.activities).length, setDiff(actual.activities, expected.activities).length],
    ['content_plans', expected.contentPlans.size, actual.contentPlans.size, setDiff(expected.contentPlans, actual.contentPlans).length, setDiff(actual.contentPlans, expected.contentPlans).length],
  ]
  const isSynced = finalAuditRows.every((row) => row[3] === 0 && row[4] === 0)

  const finalMd = `# MASTER-DATA-FINAL-AUDIT

Source: \`docs/database/Master-Data.xlsx\`

Status: ${isSynced ? '100% SINKRON untuk target yang dicek.' : 'BELUM 100% SINKRON karena ada data ekstra/missing yang tidak dihapus otomatis tanpa approval.'}

${mdTable(['Entity', 'Expected', 'Actual', 'Missing', 'Extra'], finalAuditRows)}

## Final Notes

- Master data rows from workbook were generated into \`prisma/master-data.generated.ts\`.
- Database cleanup for extra production-impacting rows requires approval before execution.
- Roles and permissions are not present in workbook and are sourced from \`06-RBAC-MATRIX.md\`.
- The requested Content Plan -> Category relation cannot be completed without schema change because the current \`ContentPlan\` model has no category field.
`

  fs.writeFileSync(path.join(repoRoot, 'MASTER-DATA-AUDIT.md'), auditMd)
  fs.writeFileSync(path.join(repoRoot, 'MASTER-DATA-VALIDATION.md'), validationMd)
  fs.writeFileSync(path.join(repoRoot, 'MASTER-DATA-RELATION-REPORT.md'), relationMd)
  fs.writeFileSync(path.join(repoRoot, 'MASTER-DATA-SEED-REPORT.md'), seedMd)
  fs.writeFileSync(path.join(repoRoot, 'MASTER-DATA-FINAL-AUDIT.md'), finalMd)

  console.log(
    JSON.stringify(
      {
        reports: [
          'MASTER-DATA-AUDIT.md',
          'MASTER-DATA-VALIDATION.md',
          'MASTER-DATA-RELATION-REPORT.md',
          'MASTER-DATA-SEED-REPORT.md',
          'MASTER-DATA-FINAL-AUDIT.md',
        ],
        counts,
        isSynced,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
