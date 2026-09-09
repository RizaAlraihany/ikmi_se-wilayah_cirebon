import { prisma } from '@/core/database/prisma'
import {
  publicLegacyStructureOfficerSelect,
  publicStructureAssignmentSelect,
} from './public-data'

const unitTypePriority = {
  BPH: 0,
  SECRETARIAT: 10,
  TREASURY: 20,
  DEPARTMENT: 30,
  DIVISION: 40,
} as const

export async function getCurrentStructurePeriod() {
  return prisma.period.findFirst({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true, name: true, cabinetName: true },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
  })
}

/** Public structure deliberately exposes only name, photo, position, and unit. */
export async function getActivePublicStructure() {
  const period = await getCurrentStructurePeriod()
  if (!period) return { period: null, assignments: [] }

  const [records, archivedLegacyAssignments, legacyOfficers] = await Promise.all([
    prisma.structureAssignment.findMany({
      where: {
        periodId: period.id,
        deletedAt: null,
        department: { periodId: period.id, status: 'ACTIVE', deletedAt: null },
        position: { deletedAt: null },
        OR: [
          { member: { is: { membershipStatus: 'ACTIVE_MEMBER', deletedAt: null } } },
          { memberId: null, user: { is: { isActive: true, deletedAt: null } } },
        ],
      },
      select: publicStructureAssignmentSelect,
      orderBy: [
        { department: { sortOrder: 'asc' } },
        { department: { name: 'asc' } },
        { position: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { id: 'asc' },
      ],
    }),
    prisma.structureAssignment.findMany({
      where: {
        periodId: period.id,
        deletedAt: { not: null },
        userId: { not: null },
      },
      select: { userId: true, positionId: true },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        department: {
          is: {
            periodId: period.id,
            status: 'ACTIVE',
            deletedAt: null,
          },
        },
        position: { is: { deletedAt: null } },
      },
      select: publicLegacyStructureOfficerSelect,
    }),
  ])

  // Reject malformed historical rows where the selected position belongs to
  // another unit. They remain available for an admin to repair, but are never
  // exposed as a valid public organizational relationship.
  const validRecords = records.filter(
    (record) => record.position.departmentId === record.department.id,
  )
  const assignedLegacyKeys = new Set(
    validRecords.flatMap((record) =>
      record.user ? [`${record.user.id}:${record.position.id}`] : [],
    ),
  )
  const archivedLegacyKeys = new Set(
    archivedLegacyAssignments.flatMap((record) =>
      record.userId ? [`${record.userId}:${record.positionId}`] : [],
    ),
  )

  const assignments = validRecords.flatMap((record) => {
    const person = record.member
      ? { id: record.member.id, name: record.member.fullName, photoUrl: record.member.photoUrl }
      : record.user
        ? { id: record.user.id, name: record.user.name, photoUrl: record.user.photoUrl }
        : null
    return person ? [{ ...record, person }] : []
  })

  // Expand/migrate compatibility: current verified officer records still live
  // in User. Merge only records that have not been assigned or explicitly
  // archived in the new period-aware StructureAssignment model.
  const legacyAssignments = legacyOfficers.flatMap((officer) => {
    if (!officer.department || !officer.position) return []
    if (officer.position.departmentId !== officer.department.id) return []

    const legacyKey = `${officer.id}:${officer.position.id}`
    if (assignedLegacyKeys.has(legacyKey) || archivedLegacyKeys.has(legacyKey)) {
      return []
    }

    return [{
      id: `legacy:${officer.id}:${officer.position.id}`,
      sortOrder: officer.position.sortOrder,
      user: {
        id: officer.id,
        name: officer.name,
        photoUrl: officer.photoUrl,
        positionId: officer.positionId,
      },
      member: null,
      department: officer.department,
      position: officer.position,
      person: {
        id: officer.id,
        name: officer.name,
        photoUrl: officer.photoUrl,
      },
    }]
  })

  const completeAssignments = [...assignments, ...legacyAssignments].sort(
    (left, right) =>
      unitTypePriority[left.department.unitType] - unitTypePriority[right.department.unitType] ||
      left.department.sortOrder - right.department.sortOrder ||
      left.department.name.localeCompare(right.department.name, 'id-ID') ||
      left.position.sortOrder - right.position.sortOrder ||
      left.sortOrder - right.sortOrder ||
      left.person.name.localeCompare(right.person.name, 'id-ID') ||
      left.id.localeCompare(right.id, 'id-ID'),
  )

  return { period, assignments: completeAssignments }
}
