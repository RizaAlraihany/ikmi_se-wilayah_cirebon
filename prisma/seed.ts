import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 1. Seed Departments
  const departments = [
    { code: 'BPH', name: 'Badan Pengurus Harian' },
    { code: 'KAD', name: 'Kaderisasi' },
    { code: 'KAJ', name: 'Kajian & Advokasi Strategis' },
    { code: 'PSDA', name: 'Pengembangan Sumber Daya Anggota' },
    { code: 'EKRAF', name: 'Ekonomi Kreatif' },
    { code: 'KOMDIGI', name: 'Komunikasi & Digitalisasi' },
    { code: 'HPM', name: 'Hubungan & Pengabdian Masyarakat' }
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.code },
      update: { name: dept.name, code: dept.code },
      create: { id: dept.code, name: dept.name, code: dept.code }
    })
  }

  // 2. Seed Positions
  const positions = [
    { id: 'ketum', name: 'Ketua Umum', departmentId: 'BPH' },
    { id: 'waketum', name: 'Wakil Ketua Umum', departmentId: 'BPH' },
    { id: 'sekum_1', name: 'Sekretaris Umum I', departmentId: 'BPH' },
    { id: 'sekum_2', name: 'Sekretaris Umum II', departmentId: 'BPH' },
    { id: 'bendum_1', name: 'Bendahara Umum I', departmentId: 'BPH' },
    { id: 'bendum_2', name: 'Bendahara Umum II', departmentId: 'BPH' },
    { id: 'kadep_komdigi', name: 'Ketua Departemen', departmentId: 'KOMDIGI' },
    { id: 'sekdep_komdigi', name: 'Sekretaris Departemen', departmentId: 'KOMDIGI' },
    { id: 'anggota_komdigi', name: 'Anggota Departemen', departmentId: 'KOMDIGI' }
  ]

  for (const pos of positions) {
    await prisma.position.upsert({
      where: { id: pos.id },
      update: { name: pos.name, departmentId: pos.departmentId },
      create: { id: pos.id, name: pos.name, departmentId: pos.departmentId }
    })
  }

  // 3. Seed Roles
  const roles = [
    { id: 'super_admin', name: 'Super Admin', description: 'Akses penuh seluruh sistem' },
    { id: 'ketua_umum', name: 'Ketua Umum', description: 'Pemegang otoritas tertinggi' },
    { id: 'wakil_ketua_umum', name: 'Wakil Ketua Umum', description: 'Koordinator departemen' },
    { id: 'sekretaris_umum', name: 'Sekretaris Umum', description: 'Pengelolaan administrasi' },
    { id: 'bendahara_umum', name: 'Bendahara Umum', description: 'Pengelolaan keuangan' },
    { id: 'ketua_departemen', name: 'Ketua Departemen', description: 'Kepala departemen' },
    { id: 'sekretaris_departemen', name: 'Sekretaris Departemen', description: 'Administrasi departemen' },
    { id: 'anggota_departemen', name: 'Anggota Departemen', description: 'Anggota operasional' },
    { id: 'alumni', name: 'Alumni', description: 'Akses sangat terbatas' }
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name, description: role.description },
      create: { id: role.id, name: role.name, description: role.description }
    })
  }

  // 4. Seed Permissions
  const permissions = [
    // Users
    { id: 'user.view', name: 'View Users', module: 'Users' },
    { id: 'user.create', name: 'Create Users', module: 'Users' },
    { id: 'user.update', name: 'Update Users', module: 'Users' },
    { id: 'user.delete', name: 'Delete Users', module: 'Users' },
    // Organization
    { id: 'organization.view', name: 'View Organization', module: 'Organization' },
    { id: 'organization.update', name: 'Update Organization', module: 'Organization' },
    // Members
    { id: 'member.view', name: 'View Members', module: 'Members' },
    { id: 'member.create', name: 'Create Members', module: 'Members' },
    { id: 'member.update', name: 'Update Members', module: 'Members' },
    { id: 'member.verify', name: 'Verify Members', module: 'Members' },
    { id: 'member.promote', name: 'Promote Members', module: 'Members' },
    // Registration
    { id: 'registration.view', name: 'View Registrations', module: 'Registration' },
    { id: 'registration.review', name: 'Review Registrations', module: 'Registration' },
    { id: 'registration.approve', name: 'Approve Registrations', module: 'Registration' },
    { id: 'registration.reject', name: 'Reject Registrations', module: 'Registration' },
    // Blog
    { id: 'post.view', name: 'View Posts', module: 'Blog' },
    { id: 'post.create', name: 'Create Posts', module: 'Blog' },
    { id: 'post.update', name: 'Update Posts', module: 'Blog' },
    { id: 'post.delete', name: 'Delete Posts', module: 'Blog' },
    { id: 'post.submit', name: 'Submit Posts', module: 'Blog' },
    { id: 'post.publish', name: 'Publish Posts', module: 'Blog' },
    // Program
    { id: 'program.view', name: 'View Programs', module: 'Program' },
    { id: 'program.create', name: 'Create Programs', module: 'Program' },
    { id: 'program.update', name: 'Update Programs', module: 'Program' },
    { id: 'program.delete', name: 'Delete Programs', module: 'Program' },
    // Event
    { id: 'event.view', name: 'View Events', module: 'Event' },
    { id: 'event.create', name: 'Create Events', module: 'Event' },
    { id: 'event.update', name: 'Update Events', module: 'Event' },
    { id: 'event.delete', name: 'Delete Events', module: 'Event' },
    // LPJ
    { id: 'lpj.view', name: 'View LPJ', module: 'LPJ' },
    { id: 'lpj.submit', name: 'Submit LPJ', module: 'LPJ' },
    { id: 'lpj.verify_department', name: 'Verify LPJ (Dept)', module: 'LPJ' },
    { id: 'lpj.verify_bph', name: 'Verify LPJ (BPH)', module: 'LPJ' },
    // Finance
    { id: 'finance.view', name: 'View Finance', module: 'Finance' },
    { id: 'finance.create', name: 'Create Finance', module: 'Finance' },
    { id: 'finance.approve_tier1', name: 'Approve Finance Tier 1', module: 'Finance' },
    { id: 'finance.approve_tier2', name: 'Approve Finance Tier 2', module: 'Finance' },
    { id: 'finance.reject', name: 'Reject Finance', module: 'Finance' },
    // Complaints
    { id: 'complaint.view', name: 'View Complaints', module: 'Complaints' },
    { id: 'complaint.assign', name: 'Assign Complaints', module: 'Complaints' },
    { id: 'complaint.process', name: 'Process Complaints', module: 'Complaints' },
    { id: 'complaint.resolve', name: 'Resolve Complaints', module: 'Complaints' },
    // Letters
    { id: 'letter.view', name: 'View Letters', module: 'Letters' },
    { id: 'letter.create', name: 'Create Letters', module: 'Letters' },
    { id: 'letter.update', name: 'Update Letters', module: 'Letters' },
    { id: 'letter.delete', name: 'Delete Letters', module: 'Letters' },
    // CMS
    { id: 'cms.view', name: 'View CMS', module: 'CMS' },
    { id: 'cms.update', name: 'Update CMS', module: 'CMS' },
    // Audit
    { id: 'audit.view', name: 'View Audit Logs', module: 'Audit' },
    // System
    { id: 'system.manage', name: 'Manage System', module: 'System' }
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { id: perm.id },
      update: { name: perm.name, module: perm.module },
      create: { id: perm.id, name: perm.name, module: perm.module }
    })
  }

  const categories = [
    { name: 'Blog', slug: 'blog', description: 'Tulisan umum dan kabar organisasi.' },
    { name: 'News', slug: 'news', description: 'Berita resmi IKMI Cirebon.' },
    { name: 'Opinion', slug: 'opinion', description: 'Opini dan ruang gagasan anggota.' },
    { name: 'Kajian', slug: 'kajian', description: 'Kajian strategis dan literasi isu daerah.' },
    { name: 'Geopolitik', slug: 'geopolitik', description: 'Analisis geopolitik dan kebijakan publik.' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    })
  }

  // 5. Seed Super Admin User
  const passwordHash = await bcrypt.hash('Password123!', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@ikmi.ac.id' },
    update: {},
    create: {
      name: 'Super Administrator',
      email: 'admin@ikmi.ac.id',
      passwordHash: passwordHash,
      roleId: 'super_admin',
      departmentId: 'BPH',
      positionId: 'ketum'
    }
  })

  const rcPasswordHash = await bcrypt.hash('RcDev#2026!', 10)
  const rcUsers = [
    {
      name: 'RC Super Admin',
      email: 'rc.superadmin@ikmi.ac.id',
      roleId: 'super_admin',
      departmentId: 'BPH',
      positionId: 'ketum',
    },
    {
      name: 'RC Ketua Umum',
      email: 'rc.ketua@ikmi.ac.id',
      roleId: 'ketua_umum',
      departmentId: 'BPH',
      positionId: 'ketum',
    },
    {
      name: 'RC Bendahara Umum',
      email: 'rc.bendahara@ikmi.ac.id',
      roleId: 'bendahara_umum',
      departmentId: 'BPH',
      positionId: 'bendum_1',
    },
    {
      name: 'RC Ketua Departemen',
      email: 'rc.kadep@ikmi.ac.id',
      roleId: 'ketua_departemen',
      departmentId: 'KOMDIGI',
      positionId: 'kadep_komdigi',
    },
    {
      name: 'RC Anggota Departemen',
      email: 'rc.anggota@ikmi.ac.id',
      roleId: 'anggota_departemen',
      departmentId: 'KOMDIGI',
      positionId: 'anggota_komdigi',
    },
  ]

  for (const user of rcUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        roleId: user.roleId,
        departmentId: user.departmentId,
        positionId: user.positionId,
      },
      create: {
        ...user,
        passwordHash: rcPasswordHash,
      },
    })
  }

  // 6. Map Super Admin Permissions
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: 'super_admin',
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: 'super_admin',
        permissionId: perm.id
      }
    })
  }

  const rolePermissionMap: Record<string, string[]> = {
    ketua_umum: [
      'user.view',
      'user.create',
      'user.update',
      'user.delete',
      'member.view',
      'member.promote',
      'post.view',
      'post.create',
      'post.update',
      'post.submit',
      'lpj.view',
      'lpj.verify_bph',
      'finance.view',
      'finance.approve_tier2',
      'audit.view',
    ],
    wakil_ketua_umum: [
      'user.view',
      'member.view',
      'member.promote',
      'post.view',
      'post.create',
      'post.update',
      'post.submit',
      'program.view',
      'program.create',
      'event.view',
      'event.create',
      'lpj.view',
      'lpj.verify_bph',
      'audit.view',
    ],
    sekretaris_umum: [
      'user.view',
      'member.view',
      'post.view',
      'post.create',
      'post.update',
      'post.submit',
      'lpj.view',
      'lpj.verify_bph',
      'letter.view',
      'letter.create',
      'letter.update',
      'letter.delete',
      'audit.view',
    ],
    bendahara_umum: [
      'post.view',
      'post.create',
      'post.update',
      'post.submit',
      'lpj.view',
      'lpj.verify_bph',
      'finance.view',
      'finance.approve_tier1',
      'finance.approve_tier2',
      'finance.reject',
      'audit.view',
    ],
    ketua_departemen: [
      'member.view',
      'member.verify',
      'registration.view',
      'registration.review',
      'registration.approve',
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
      'finance.view',
      'finance.create',
      'cms.view',
      'cms.update',
    ],
    sekretaris_departemen: [
      'member.view',
      'registration.view',
      'registration.review',
      'post.view',
      'post.create',
      'post.update',
      'post.submit',
      'post.publish',
      'program.view',
      'program.create',
      'program.update',
      'event.view',
      'event.create',
      'event.update',
      'lpj.view',
      'lpj.submit',
      'finance.view',
      'finance.create',
      'cms.view',
      'cms.update',
    ],
    anggota_departemen: [
      'post.view',
      'post.create',
      'post.update',
      'post.submit',
      'program.view',
      'event.view',
      'lpj.view',
      'lpj.submit',
      'cms.view',
    ],
  }

  for (const [roleId, permissionIds] of Object.entries(rolePermissionMap)) {
    for (const permissionId of permissionIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          }
        },
        update: {},
        create: {
          roleId,
          permissionId,
        }
      })
    }
  }

  // 7. Seed Program, Activity, Content Plan dummy for Master Data rules
  const program = await prisma.program.upsert({
    where: { id: 'prog_komdigi_1' },
    update: {},
    create: {
      id: 'prog_komdigi_1',
      name: 'Website IKMI',
      departmentId: 'KOMDIGI',
      budgetPlan: 0,
      description: 'Pengembangan Web',
      status: 'ONGOING'
    }
  })

  await prisma.activity.upsert({
    where: { id: 'act_komdigi_1' },
    update: {},
    create: {
      id: 'act_komdigi_1',
      programId: program.id,
      name: 'Sprint 1',
      description: 'Foundation Refactor',
      status: 'COMPLETED'
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
