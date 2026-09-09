import { PrismaClient, type OrganizationalUnitType } from '@prisma/client'
import { assertMasterDataSeedAllowed } from './bootstrap'
import masterDataSeed from './structure-master-data.json'

const prisma = new PrismaClient()

async function main() {
  assertMasterDataSeedAllowed()

  for (const department of masterDataSeed.departments) {
    await prisma.department.upsert({
      where: { id: department.id },
      update: {
        name: department.name,
        code: department.code,
        unitType: department.unitType as OrganizationalUnitType,
        sortOrder: department.sortOrder,
      },
      create: { ...department, unitType: department.unitType as OrganizationalUnitType },
    })
  }

  for (const position of masterDataSeed.positions) {
    await prisma.position.upsert({
      where: { id: position.id },
      update: {
        name: position.name,
        departmentId: position.departmentId,
        sortOrder: position.sortOrder,
      },
      create: position,
    })
  }

  console.log(JSON.stringify({
    departments: masterDataSeed.departments.length,
    positions: masterDataSeed.positions.length,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
