import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const repoRoot = process.cwd()
const sourceWorkbook = path.join(repoRoot, 'docs', 'database', 'Master-Data.xlsx')
const outputFile = path.join(repoRoot, 'prisma', 'master-data.generated.ts')
const workDir = path.join(os.tmpdir(), 'ikmi-master-data-generator')

const departmentAliases = {
  'Sekretaris Umum': 'BPH',
  Sekum: 'BPH',
  'Bendahara Umum': 'BPH',
  BPH: 'BPH',
  'Advokasi & Kasta': 'KAJ',
  'Kajian': 'KAJ',
  'Kajian & Advokasi': 'KAJ',
  Kaderisasi: 'KAD',
  PSDA: 'PSDA',
  PSDM: 'PSDA',
  PDDS: 'PSDA',
  'Ekonomi Kreatif': 'EKRAF',
  Ekotif: 'EKRAF',
  Komdigi: 'KOMDIGI',
  'Komunikasi dan Digital': 'KOMDIGI',
  HPM: 'HPM',
  'Humas & Pengabdian Masyarakat': 'HPM',
}

const departmentNames = {
  BPH: 'Badan Pengurus Harian',
  KAD: 'Kaderisasi',
  KAJ: 'Kajian & Advokasi',
  PSDA: 'Pengembangan Sumber Daya Anggota',
  EKRAF: 'Ekonomi Kreatif',
  KOMDIGI: 'Komunikasi & Digitalisasi',
  HPM: 'Hubungan & Pengabdian Masyarakat',
}

const bphPositionMap = {
  'ketua umum': { roleId: 'ketua_umum', departmentId: 'BPH', positionId: 'ketum' },
  'wakil ketua umum': { roleId: 'wakil_ketua_umum', departmentId: 'BPH', positionId: 'waketum' },
  'sekretaris umum i': { roleId: 'sekretaris_umum', departmentId: 'BPH', positionId: 'sekum_1' },
  'sekretaris umum ii': { roleId: 'sekretaris_umum', departmentId: 'BPH', positionId: 'sekum_2' },
  'bendahara umum i': { roleId: 'bendahara_umum', departmentId: 'BPH', positionId: 'bendum_1' },
  'bendahara umum ii': { roleId: 'bendahara_umum', departmentId: 'BPH', positionId: 'bendum_2' },
}

const departmentPositionRules = [
  { prefix: 'ketua departemen', roleId: 'ketua_departemen', positionPrefix: 'kadep' },
  { prefix: 'sekretaris departemen', roleId: 'sekretaris_departemen', positionPrefix: 'sekdep' },
  { prefix: 'anggota', roleId: 'anggota_departemen', positionPrefix: 'anggota' },
]

const monthMap = {
  Januari: 0,
  Februari: 1,
  Maret: 2,
  April: 3,
  Mei: 4,
  Juni: 5,
  Juli: 6,
  Agustus: 7,
  September: 8,
  Oktober: 9,
  November: 10,
  Desember: 11,
}

function ps(command) {
  return execFileSync('powershell.exe', ['-NoProfile', '-Command', command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function extractWorkbook() {
  ps(`$tmp = ${JSON.stringify(workDir)}; if (Test-Path $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force }; New-Item -ItemType Directory -Path $tmp | Out-Null; Copy-Item -LiteralPath ${JSON.stringify(sourceWorkbook)} -Destination (Join-Path $tmp 'Master-Data.zip'); Expand-Archive -LiteralPath (Join-Path $tmp 'Master-Data.zip') -DestinationPath $tmp`)
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
  const xml = readXml('xl/sharedStrings.xml')
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
  const col = ref.match(/[A-Z]+/)[0]
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

      row[colIndex(ref)] = value
    }
    rows[Number(rowMatch[1]) - 1] = row
  }

  return rows.map((row) => row ?? []).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function comparable(value) {
  return normalizeText(value).toLowerCase()
}

function slug(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function resolveDepartment(value) {
  const text = normalizeText(value)
  if (departmentAliases[text]) return departmentAliases[text]

  for (const [alias, code] of Object.entries(departmentAliases)) {
    if (text.toLowerCase().includes(alias.toLowerCase())) return code
  }

  throw new Error(`Tidak bisa mapping departemen: ${text}`)
}

function resolvePosition(jabatan) {
  const text = normalizeText(jabatan)
  const key = comparable(text)

  if (bphPositionMap[key]) return bphPositionMap[key]

  const departmentId = resolveDepartment(text)

  const rule = departmentPositionRules.find((item) => key.startsWith(item.prefix))
  if (rule) {
    return {
      roleId: rule.roleId,
      departmentId,
      positionId: `${rule.positionPrefix}_${departmentId.toLowerCase()}`,
    }
  }

  throw new Error(`Tidak bisa mapping jabatan: ${text}`)
}

function canonicalPositionName(position, fallback) {
  if (!position.departmentId || position.departmentId === 'BPH') return normalizeText(fallback)

  const departmentName = departmentNames[position.departmentId] ?? position.departmentId
  if (position.roleId === 'ketua_departemen') return `Ketua Departemen ${departmentName}`
  if (position.roleId === 'sekretaris_departemen') return `Sekretaris Departemen ${departmentName}`
  if (position.roleId === 'anggota_departemen') return `Anggota Departemen ${departmentName}`

  return normalizeText(fallback)
}

function normalizeEmail(value, index) {
  const email = normalizeText(value).toLowerCase()
  if (!email || email === '-') return `member-${String(index).padStart(2, '0')}@ikmi.local`
  return email
}

function excelDate(serial, dayOverride) {
  const value = Number(serial)
  const date = new Date(Date.UTC(1899, 11, 30))
  date.setUTCDate(date.getUTCDate() + value)
  if (dayOverride) date.setUTCDate(Number(dayOverride))
  return date.toISOString()
}

function contentPlanDate(month, day) {
  const monthIndex = monthMap[normalizeText(month)]
  if (monthIndex === undefined) throw new Error(`Bulan content plan tidak dikenal: ${month}`)
  return new Date(Date.UTC(2026, monthIndex, Number(day))).toISOString()
}

function buildData(tables) {
  const prokerRows = tables['departement &prokerr'].slice(1)
  const memberRows = tables['db-Anggota'].slice(1)
  const calendarRows = tables['Data Kalender Kegiatan IKMI 202'].slice(1)
  const contentRows = tables.content_plan_komdigi.slice(1)

  const programs = []
  let currentDepartment = ''
  for (const row of prokerRows) {
    if (normalizeText(row[0])) currentDepartment = normalizeText(row[0])
    const departmentId = resolveDepartment(currentDepartment)
    const name = normalizeText(row[1])
    if (!name) continue
    programs.push({
      id: `prog_${departmentId.toLowerCase()}_${slug(name)}`,
      name,
      departmentId,
      scale: normalizeText(row[2]),
      description: normalizeText(row[3]),
      status: 'PLANNED',
    })
  }

  const programByName = new Map(programs.map((program) => [slug(program.name), program]))

  const members = memberRows.map((row, index) => {
    const name = normalizeText(row[1])
    const jabatan = normalizeText(row[2])
    const position = resolvePosition(jabatan)
    return {
      id: `member_${String(index + 1).padStart(2, '0')}_${slug(name)}`,
      name,
      email: normalizeEmail(row[6], index + 1),
      sourceEmail: normalizeText(row[6]),
      positionName: canonicalPositionName(position, jabatan),
      birthInfo: normalizeText(row[3]),
      phone: normalizeText(row[4]),
      address: normalizeText(row[5]),
      ...position,
    }
  })

  const departmentIds = new Set([
    ...programs.map((program) => program.departmentId),
    ...members.map((member) => member.departmentId),
  ])
  const departments = [...departmentIds].sort().map((id) => ({
    id,
    code: id,
    name: departmentNames[id] ?? id,
  }))

  const positionsById = new Map()
  for (const member of members) {
    if (!positionsById.has(member.positionId)) {
      positionsById.set(member.positionId, {
        id: member.positionId,
        name: member.positionName,
        departmentId: member.departmentId,
      })
    }
  }
  const positions = [...positionsById.values()].sort((a, b) => a.id.localeCompare(b.id))

  const events = calendarRows
    .map((row, index) => {
      const title = normalizeText(row[2])
      if (!title) return null
      const departmentId = resolveDepartment(row[3])
      const key = slug(title)
      let program = programByName.get(key)
      if (!program) {
        program = {
          id: `prog_${departmentId.toLowerCase()}_${key}`,
          name: title,
          departmentId,
          scale: 'Kalender',
          description: `Agenda kalender IKMI: ${title}`,
          status: 'PLANNED',
        }
        programByName.set(key, program)
        programs.push(program)
      }
      const startDate = excelDate(row[0], row[1])
      const end = new Date(startDate)
      end.setUTCHours(end.getUTCHours() + 2)
      return {
        id: `event_${String(index + 1).padStart(3, '0')}_${slug(title)}`,
        programId: program.id,
        title,
        description: `Agenda ${title} dari ${departmentId}.`,
        location: 'IKMI Cirebon',
        startDate,
        endDate: end.toISOString(),
        status: 'UPCOMING',
      }
    })
    .filter(Boolean)

  const contentPlans = contentRows
    .map((row, index) => {
      const title = normalizeText(row[3])
      if (!title) return null
      return {
        id: `content_${String(index + 1).padStart(3, '0')}_${slug(title)}`,
        title: `${normalizeText(row[2])}: ${title}`,
        platform: 'Instagram',
        publishDate: contentPlanDate(row[0], row[1]),
        status: 'PLANNED',
        category: normalizeText(row[2]),
        relatedPosition: normalizeText(row[4]),
      }
    })
    .filter(Boolean)

  return { departments, positions, programs, members, events, contentPlans }
}

extractWorkbook()
const sharedStrings = getSharedStrings()
const tables = Object.fromEntries(
  getSheets().map((sheet) => [sheet.name, parseSheet(sheet.file, sharedStrings).map((row) => row.map(normalizeText))]),
)
const data = buildData(tables)

const banner = `// Generated from docs/database/Master-Data.xlsx by scripts/generate-master-data-seed.mjs.\n// Do not edit this file manually; update the workbook and rerun the generator.\n\n`
const body = `export const masterDataSeed = ${JSON.stringify(data, null, 2)} as const\n`

fs.writeFileSync(outputFile, banner + body)
console.log(
  JSON.stringify(
    {
      outputFile,
      programs: data.programs.length,
      members: data.members.length,
      events: data.events.length,
      contentPlans: data.contentPlans.length,
    },
    null,
    2,
  ),
)

export { tables };
