import { PrismaClient } from '@prisma/client'
// Force IDE cache refresh
import bcrypt from 'bcryptjs'
import { masterDataSeed } from './master-data.generated'

const prisma = new PrismaClient()

function roleIdFromPositionId(positionId: string | null) {
  if (!positionId) return 'user'
  if (positionId === 'ketum' || positionId === 'waketum') return 'super_admin'
  if (positionId === 'sekum_1') return 'admin_sekretaris'
  if (positionId === 'bendum_1') return 'admin_bendahara'
  if (
    positionId === 'kadep_komdigi' ||
    positionId === 'sekdep_komdigi' ||
    positionId === 'anggota_komdigi'
  ) {
    return 'admin_komdigi'
  }
  if (positionId === 'sekum_2' || positionId === 'bendum_2') return 'user'
  if (positionId.startsWith('kadep_')) return 'user'
  if (positionId.startsWith('sekdep_')) return 'user'
  if (positionId.startsWith('anggota_')) return 'user'
  throw new Error(`Position belum memiliki mapping role: ${positionId}`)
}

function ensureRoleMatchesPosition(user: { name: string; roleId: string; positionId: string | null }) {
  const expectedRoleId = roleIdFromPositionId(user.positionId)
  if (user.roleId !== expectedRoleId) {
    throw new Error(
      `Role tidak sesuai jabatan untuk ${user.name}: role=${user.roleId}, jabatan=${user.positionId}, expected=${expectedRoleId}`,
    )
  }
}

const roles = [
  { id: 'super_admin', name: 'Super Admin', description: 'Ketua dan Wakil Ketua dengan akses penuh sistem' },
  { id: 'admin_komdigi', name: 'Admin Komdigi', description: 'Pengelola CMS, content plan, request pamflet, dan karya tulis' },
  { id: 'admin_sekretaris', name: 'Admin Sekretaris', description: 'Pengelola kalender, pengumuman, persuratan, pengurus, dan pendaftar' },
  { id: 'admin_bendahara', name: 'Admin Bendahara', description: 'Pengelola buku kas, laporan keuangan, LPJ, dan token submit LPJ' },
  { id: 'user', name: 'User', description: 'Anggota umum tanpa akses admin departemen' },
]

const deprecatedRoleIds = [
  'ketua_umum',
  'wakil_ketua_umum',
  'sekretaris_umum',
  'bendahara_umum',
  'ketua_departemen',
  'sekretaris_departemen',
  'anggota_departemen',
  'alumni',
]

const permissions = [
  { id: 'user.view', name: 'View Users', module: 'Users' },
  { id: 'user.create', name: 'Create Users', module: 'Users' },
  { id: 'user.update', name: 'Update Users', module: 'Users' },
  { id: 'user.delete', name: 'Delete Users', module: 'Users' },
  { id: 'organization.view', name: 'View Organization', module: 'Organization' },
  { id: 'organization.update', name: 'Update Organization', module: 'Organization' },
  { id: 'member.view', name: 'View Members', module: 'Members' },
  { id: 'member.create', name: 'Create Members', module: 'Members' },
  { id: 'member.update', name: 'Update Members', module: 'Members' },
  { id: 'member.verify', name: 'Verify Members', module: 'Members' },
  { id: 'member.promote', name: 'Promote Members', module: 'Members' },
  { id: 'registration.view', name: 'View Registrations', module: 'Registration' },
  { id: 'registration.review', name: 'Review Registrations', module: 'Registration' },
  { id: 'registration.approve', name: 'Approve Registrations', module: 'Registration' },
  { id: 'registration.reject', name: 'Reject Registrations', module: 'Registration' },
  { id: 'post.view', name: 'View Posts', module: 'Blog' },
  { id: 'post.create', name: 'Create Posts', module: 'Blog' },
  { id: 'post.update', name: 'Update Posts', module: 'Blog' },
  { id: 'post.delete', name: 'Delete Posts', module: 'Blog' },
  { id: 'post.submit', name: 'Submit Posts', module: 'Blog' },
  { id: 'post.publish', name: 'Publish Posts', module: 'Blog' },
  { id: 'program.view', name: 'View Programs', module: 'Program' },
  { id: 'program.create', name: 'Create Programs', module: 'Program' },
  { id: 'program.update', name: 'Update Programs', module: 'Program' },
  { id: 'program.delete', name: 'Delete Programs', module: 'Program' },
  { id: 'event.view', name: 'View Events', module: 'Event' },
  { id: 'event.create', name: 'Create Events', module: 'Event' },
  { id: 'event.update', name: 'Update Events', module: 'Event' },
  { id: 'event.delete', name: 'Delete Events', module: 'Event' },
  { id: 'lpj.view', name: 'View LPJ', module: 'LPJ' },
  { id: 'lpj.submit', name: 'Submit LPJ', module: 'LPJ' },
  { id: 'lpj.verify_department', name: 'Verify LPJ (Dept)', module: 'LPJ' },
  { id: 'lpj.verify_bph', name: 'Verify LPJ (BPH)', module: 'LPJ' },
  { id: 'finance.view', name: 'View Finance', module: 'Finance' },
  { id: 'finance.create', name: 'Create Finance', module: 'Finance' },
  { id: 'finance.approve_tier1', name: 'Approve Finance Tier 1', module: 'Finance' },
  { id: 'finance.approve_tier2', name: 'Approve Finance Tier 2', module: 'Finance' },
  { id: 'finance.reject', name: 'Reject Finance', module: 'Finance' },
  { id: 'complaint.view', name: 'View Complaints', module: 'Complaints' },
  { id: 'complaint.assign', name: 'Assign Complaints', module: 'Complaints' },
  { id: 'complaint.process', name: 'Process Complaints', module: 'Complaints' },
  { id: 'complaint.resolve', name: 'Resolve Complaints', module: 'Complaints' },
  { id: 'letter.view', name: 'View Letters', module: 'Letters' },
  { id: 'letter.create', name: 'Create Letters', module: 'Letters' },
  { id: 'letter.update', name: 'Update Letters', module: 'Letters' },
  { id: 'letter.delete', name: 'Delete Letters', module: 'Letters' },
  { id: 'cms.view', name: 'View CMS', module: 'CMS' },
  { id: 'cms.update', name: 'Update CMS', module: 'CMS' },
  { id: 'audit.view', name: 'View Audit Logs', module: 'Audit' },
  { id: 'system.manage', name: 'Manage System', module: 'System' },
  { id: 'profile.update', name: 'Update Own Profile', module: 'Profile' },
  { id: 'content_plan.view', name: 'View Content Plan', module: 'Content Plan' },
  { id: 'content_plan.manage', name: 'Manage Content Plan', module: 'Content Plan' },
  { id: 'article_queue.view', name: 'View Article Queue', module: 'Karya Tulis' },
  { id: 'article_queue.manage', name: 'Manage Article Queue', module: 'Karya Tulis' },
  { id: 'pamphlet_request.create', name: 'Create Pamphlet Request', module: 'Pamflet' },
  { id: 'pamphlet_request.manage', name: 'Manage Pamphlet Request', module: 'Pamflet' },
  { id: 'calendar.view', name: 'View Calendar', module: 'Calendar' },
  { id: 'calendar.manage', name: 'Manage Calendar', module: 'Calendar' },
  { id: 'announcement.view', name: 'View Announcements', module: 'Announcements' },
  { id: 'announcement.manage', name: 'Manage Announcements', module: 'Announcements' },
  { id: 'cashbook.view', name: 'View Cashbook', module: 'Finance' },
  { id: 'cashbook.manage', name: 'Manage Cashbook', module: 'Finance' },
  { id: 'financial_report.view', name: 'View Financial Report', module: 'Finance' },
  { id: 'financial_report.export', name: 'Export Financial Report', module: 'Finance' },
  { id: 'lpj_token.manage', name: 'Manage LPJ Submission Token', module: 'LPJ' },
  { id: 'lpj_token.use', name: 'Use LPJ Submission Token', module: 'LPJ' },
]

const rolePermissionMap: Record<string, string[]> = {
  admin_komdigi: [
    'post.view',
    'post.create',
    'post.update',
    'post.delete',
    'post.submit',
    'post.publish',
    'cms.view',
    'cms.update',
    'content_plan.view',
    'content_plan.manage',
    'article_queue.view',
    'article_queue.manage',
    'pamphlet_request.manage',
  ],
  admin_sekretaris: [
    'user.view',
    'user.update',
    'registration.view',
    'registration.review',
    'event.view',
    'event.create',
    'event.update',
    'event.delete',
    'calendar.view',
    'calendar.manage',
    'announcement.view',
    'announcement.manage',
    'letter.view',
    'letter.create',
    'letter.update',
    'letter.delete',
  ],
  admin_bendahara: [
    'finance.view',
    'finance.create',
    'finance.approve_tier1',
    'finance.approve_tier2',
    'finance.reject',
    'cashbook.view',
    'cashbook.manage',
    'financial_report.view',
    'financial_report.export',
    'lpj.view',
    'lpj.verify_bph',
    'lpj_token.manage',
  ],
  user: [
    'profile.update',
    'calendar.view',
    'announcement.view',
    'financial_report.view',
    'pamphlet_request.create',
    'post.submit',
    'lpj.submit',
    'lpj_token.use',
  ],
}

async function main() {
  console.log('Start seeding from MASTER-DATA.xlsx...')

  for (const department of masterDataSeed.departments) {
    await prisma.department.upsert({
      where: { id: department.id },
      update: { name: department.name, code: department.code },
      create: department,
    })
  }

  for (const position of masterDataSeed.positions) {
    await prisma.position.upsert({
      where: { id: position.id },
      update: { name: position.name, departmentId: position.departmentId },
      create: position,
    })
  }

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name, description: role.description },
      create: role,
    })
  }

  await prisma.user.updateMany({
    where: { roleId: { in: deprecatedRoleIds } },
    data: { roleId: 'user' },
  })

  await prisma.rolePermission.deleteMany({
    where: {
      OR: [
        { roleId: { in: roles.map((role) => role.id) } },
        { roleId: { in: deprecatedRoleIds } },
      ],
    },
  })

  await prisma.role.deleteMany({
    where: { id: { in: deprecatedRoleIds } },
  })

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { id: permission.id },
      update: { name: permission.name, module: permission.module },
      create: permission,
    })
  }

  const adminPasswordHash = await bcrypt.hash('Password123!', 10)
  const memberPasswordHash = await bcrypt.hash('Ikmi2026!', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ikmi.ac.id' },
    update: {
      name: 'Super Administrator',
      roleId: 'super_admin',
      departmentId: null,
      positionId: null,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name: 'Super Administrator',
      email: 'admin@ikmi.ac.id',
      passwordHash: adminPasswordHash,
      roleId: 'super_admin',
      departmentId: null,
      positionId: null,
    },
  })

  for (const member of masterDataSeed.members) {
    const roleId = roleIdFromPositionId(member.positionId)
    ensureRoleMatchesPosition({ name: member.name, roleId, positionId: member.positionId })

    await prisma.user.upsert({
      where: { email: member.email },
      update: {
        name: member.name,
        roleId,
        departmentId: member.departmentId,
        positionId: member.positionId,
        photoUrl: member.photoUrl || null,
        photoPublicId: member.photoPublicId || null,
        isActive: true,
        deletedAt: null,
      },
      create: {
        id: member.id,
        name: member.name,
        email: member.email,
        passwordHash: memberPasswordHash,
        roleId,
        departmentId: member.departmentId,
        positionId: member.positionId,
        photoUrl: member.photoUrl || null,
        photoPublicId: member.photoPublicId || null,
      },
    })
  }

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: 'super_admin',
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: 'super_admin',
        permissionId: permission.id,
      },
    })
  }

  for (const [roleId, permissionIds] of Object.entries(rolePermissionMap)) {
    for (const permissionId of permissionIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      })
    }
  }

  for (const program of masterDataSeed.programs) {
    await prisma.program.upsert({
      where: { id: program.id },
      update: {
        name: program.name,
        departmentId: program.departmentId,
        budgetPlan: 0,
        description: program.description,
        status: program.status,
      },
      create: {
        id: program.id,
        name: program.name,
        departmentId: program.departmentId,
        budgetPlan: 0,
        description: program.description,
        status: program.status,
      },
    })

    await prisma.activity.upsert({
      where: { id: `act_${program.id.replace(/^prog_/, '')}` },
      update: {
        programId: program.id,
        name: program.name,
        description: program.description,
        status: program.status,
      },
      create: {
        id: `act_${program.id.replace(/^prog_/, '')}`,
        programId: program.id,
        name: program.name,
        description: program.description,
        status: program.status,
      },
    })
  }

  for (const event of masterDataSeed.events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {
        programId: event.programId,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        status: event.status,
      },
      create: {
        id: event.id,
        programId: event.programId,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        status: event.status,
      },
    })
  }

  const contentPlanAuthor =
    (await prisma.user.findFirst({
      where: { positionId: 'kadep_komdigi', deletedAt: null },
      select: { id: true },
    })) ?? adminUser

  for (const plan of masterDataSeed.contentPlans) {
    await prisma.contentPlan.upsert({
      where: { id: plan.id },
      update: {
        title: plan.title,
        platform: plan.platform,
        publishDate: new Date(plan.publishDate),
        status: plan.status,
        authorId: contentPlanAuthor.id,
      },
      create: {
        id: plan.id,
        title: plan.title,
        platform: plan.platform,
        publishDate: new Date(plan.publishDate),
        status: plan.status,
        authorId: contentPlanAuthor.id,
      },
    })
  }

  console.log(
    JSON.stringify(
      {
        departments: masterDataSeed.departments.length,
        positions: masterDataSeed.positions.length,
        roles: roles.length,
        permissions: permissions.length,
        members: masterDataSeed.members.length,
        programs: masterDataSeed.programs.length,
        events: masterDataSeed.events.length,
        contentPlans: masterDataSeed.contentPlans.length,
      },
      null,
      2,
    ),
  )
  console.log('Seeding finished.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
