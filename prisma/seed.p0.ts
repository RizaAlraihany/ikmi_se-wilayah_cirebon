import { PrismaClient, type OrganizationalUnitType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { loadEnvConfig } from '@next/env'
import { assertDevelopmentSeedAllowed } from './bootstrap'
import { developmentAccounts, developmentDepartments, developmentPeriod, developmentPositions, developmentRolePermissions } from './development-data'

loadEnvConfig(process.cwd())
const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash(assertDevelopmentSeedAllowed(), 12)
  // Only a disposable database may use this fixture; no existing accounts or
  // production organizational units are overwritten by the development seed.
  const existing = await prisma.user.findFirst({ where: { id: { notIn: developmentAccounts.map((account) => account.id) } }, select: { id: true } })
  if (existing) throw new Error('P0 seed requires an empty or P0-fixture-only database.')
  await prisma.$transaction(async (tx) => {
    await tx.period.upsert({ where: { id: developmentPeriod.id }, create: developmentPeriod, update: {} })
    for (const department of developmentDepartments) {
      const data = { ...department, unitType: department.unitType as OrganizationalUnitType }
      await tx.department.upsert({ where: { id: data.id }, create: data, update: data })
    }
    for (const position of developmentPositions) {
      await tx.position.upsert({ where: { id: position.id }, create: position, update: position })
    }
    for (const [roleId, permissions] of Object.entries(developmentRolePermissions)) {
      await tx.role.upsert({ where: { id: roleId }, create: { id: roleId, name: roleId }, update: {} })
      for (const id of permissions) {
        await tx.permission.upsert({ where: { id }, create: { id, name: id, module: id.split('.')[0] }, update: {} })
        await tx.rolePermission.upsert({ where: { roleId_permissionId: { roleId, permissionId: id } }, create: { roleId, permissionId: id }, update: {} })
      }
    }
    for (const account of developmentAccounts) {
      await tx.user.upsert({ where: { id: account.id }, create: { ...account, passwordHash }, update: { ...account, passwordHash, sessionVersion: { increment: 1 } } })
    }
  }, { timeout: 60000 })
  console.log('Synthetic P0 master data and three development accounts are ready.')
}

main().catch(() => { console.error('P0 seed failed. Check the development guard and disposable database configuration.'); process.exitCode = 1 }).finally(() => prisma.$disconnect())
