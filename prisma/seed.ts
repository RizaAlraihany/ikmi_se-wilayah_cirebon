import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Seed Departments
  const departments = [
    { code: 'KOM', name: 'Komdigi' },
    { code: 'KAD', name: 'Kaderisasi' },
    { code: 'ADV', name: 'Advokasi' },
    { code: 'PSD', name: 'PSDA' },
    { code: 'EKR', name: 'Ekraf' },
    { code: 'HUB', name: 'Hubmas' },
    { code: 'BPH', name: 'BPH' }
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.code }, // Assuming we can use code as ID for simplicity or just create
      update: { name: dept.name, code: dept.code },
      create: { id: dept.code, name: dept.name, code: dept.code }
    })
  }

  // Seed Roles
  const roles = [
    { id: 'super_admin', name: 'Super Admin', description: 'System Administrator' },
    { id: 'bph_sekum', name: 'Sekretaris Umum', description: 'BPH Sekum' },
    { id: 'bph_bendum', name: 'Bendahara Umum', description: 'BPH Bendum' },
    { id: 'kadep_komdigi', name: 'Kadep Komdigi', description: 'Ketua Departemen Komdigi' },
    { id: 'staff_komdigi', name: 'Staff Komdigi', description: 'Staff Departemen Komdigi' }
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name, description: role.description },
      create: { id: role.id, name: role.name, description: role.description }
    })
  }

  // Seed Permissions
  const permissions = [
    { id: 'user.manage', name: 'Manage Users', module: 'User' },
    { id: 'finance.approve.tier1', name: 'Approve Finance Tier 1', module: 'Finance' },
    { id: 'post.publish', name: 'Publish Posts', module: 'Blog' },
    { id: 'audit.view', name: 'View Audit Logs', module: 'System' }
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { id: perm.id },
      update: { name: perm.name, module: perm.module },
      create: { id: perm.id, name: perm.name, module: perm.module }
    })
  }

  // Seed Super Admin User (password: Password123!)
  const passwordHash = await bcrypt.hash('Password123!', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@ikmi.ac.id' },
    update: {},
    create: {
      name: 'Super Administrator',
      email: 'admin@ikmi.ac.id',
      passwordHash: passwordHash,
      roleId: 'super_admin',
      departmentId: 'BPH'
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
