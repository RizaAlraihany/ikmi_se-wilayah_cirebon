/*
 * Copies valid legacy User department/position relationships into the
 * period-aware StructureAssignment table. Run without arguments to review,
 * then add --apply to persist only the proposed rows.
 *
 * The command is intentionally additive and idempotent: it never updates or
 * deletes users, departments, positions, periods, or existing assignments.
 */
const { createRequire } = require('module')
const path = require('path')

const requireFromProject = createRequire(path.join(process.cwd(), 'package.json'))
const { PrismaClient } = requireFromProject('@prisma/client')
const prisma = new PrismaClient()
const apply = process.argv.includes('--apply')

async function main() {
  const period = await prisma.period.findFirst({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true, name: true },
    orderBy: [{ startDate: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
  })

  if (!period) throw new Error('Tidak ada periode aktif untuk struktur.')

  const [legacyOfficers, existingAssignments] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        department: { is: { periodId: period.id, status: 'ACTIVE', deletedAt: null } },
        position: { is: { deletedAt: null } },
      },
      select: {
        id: true,
        departmentId: true,
        positionId: true,
        createdAt: true,
        department: { select: { id: true, periodId: true } },
        position: { select: { id: true, departmentId: true } },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.structureAssignment.findMany({
      where: { periodId: period.id, deletedAt: null },
      select: { userId: true, positionId: true },
    }),
  ])

  const activeUserPositionKeys = new Set(
    existingAssignments.flatMap((assignment) =>
      assignment.userId ? [`${assignment.userId}:${assignment.positionId}`] : [],
    ),
  )
  const occupiedPositionIds = new Set(existingAssignments.map((assignment) => assignment.positionId))
  const nextSortOrder = new Map()
  for (const assignment of existingAssignments) {
    nextSortOrder.set(assignment.positionId, (nextSortOrder.get(assignment.positionId) ?? 0) + 1)
  }

  const invalid = []
  const conflicts = []
  const proposals = []

  for (const officer of legacyOfficers) {
    if (!officer.departmentId || !officer.positionId || officer.department.periodId !== period.id || officer.position.departmentId !== officer.departmentId) {
      invalid.push(officer.id)
      continue
    }

    const key = `${officer.id}:${officer.positionId}`
    if (activeUserPositionKeys.has(key)) continue

    if (occupiedPositionIds.has(officer.positionId)) {
      conflicts.push(officer.id)
      continue
    }

    const sortOrder = nextSortOrder.get(officer.positionId) ?? 0
    nextSortOrder.set(officer.positionId, sortOrder + 1)
    proposals.push({
      periodId: period.id,
      userId: officer.id,
      memberId: null,
      departmentId: officer.departmentId,
      positionId: officer.positionId,
      sortOrder,
    })
  }

  if (conflicts.length > 0) {
    throw new Error('Ada jabatan yang sudah ditempati penugasan lain. Tidak ada data yang ditulis.')
  }

  if (apply && proposals.length > 0) {
    await prisma.$transaction(
      proposals.map((data) => prisma.structureAssignment.create({ data })),
    )
  }

  console.log(JSON.stringify({
    mode: apply ? 'APPLY' : 'DRY_RUN',
    period: period.name,
    existingAssignments: existingAssignments.length,
    proposedAssignments: proposals.length,
    invalidLegacyRecords: invalid.length,
    skippedBecausePositionIsAlreadyAssigned: conflicts.length,
  }))
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
