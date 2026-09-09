import { execFileSync } from 'node:child_process'
import { developmentAccounts, developmentDepartments, developmentPositions } from '../../../prisma/development-data'
import master from '../../../prisma/structure-master-data.json'

it('provides a valid scoped organization account in the canonical development seed', () => {
  const account = developmentAccounts.find((user) => user.roleId === 'admin_organization')!
  const unit = developmentDepartments.find((department) => department.id === account.departmentId)
  expect(unit).toMatchObject({ id: 'dev-bph', unitType: 'BPH' })
  expect(developmentPositions.find((position) => position.id === account.positionId)?.departmentId).toBe(unit?.id)
  expect(account.email).toMatch(/@example\.test$/)
  expect(developmentAccounts.every((user) => user.id.startsWith('dev-'))).toBe(true)
})

it('preserves explicit BPH type and numeric hierarchy independently of private exports', () => {
  expect(master.departments.find((unit) => unit.id === 'BPH')).toMatchObject({ unitType: 'BPH', sortOrder: 10 })
  expect(new Set(master.departments.map((unit) => unit.sortOrder)).size).toBeGreaterThan(1)
  expect(new Set(master.positions.map((position) => position.sortOrder)).size).toBeGreaterThan(1)
})

it('keeps structural fields when the actual workbook transformation is rerun', () => {
  const script = `import { buildData } from './scripts/generate-master-data-seed.mjs';
    const data = buildData({'departement &prokerr':[[]], 'db-Anggota':[['NAMA','JABATAN'],['Development Person','Ketua Umum'],['Development Person Two','Sekretaris Umum I']], 'Data Kalender Kegiatan IKMI 202':[[]], content_plan_komdigi:[[]]});
    console.log(JSON.stringify({departments:data.departments,positions:data.positions}));`
  const generated = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: process.cwd(), encoding: 'utf8', timeout: 30000 }))
  expect(generated.departments[0]).toMatchObject({ unitType: 'BPH', sortOrder: 10 })
  expect(generated.positions.map((position: { sortOrder: number }) => position.sortOrder)).toEqual([10, 30])
})
