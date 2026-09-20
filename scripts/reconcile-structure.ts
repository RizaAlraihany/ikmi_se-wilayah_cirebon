import { Prisma, PrismaClient } from '@prisma/client'
import {
  assertActiveSuperAdmin,
  assertStructureReconciliationApproval,
  planStructureReconciliation,
  reconciliationMode,
} from '../src/features/structure/reconciliation'

const prisma = new PrismaClient()
type Client = Prisma.TransactionClient | PrismaClient

async function readPlan(client: Client) {
  const period = await client.period.findFirst({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true },
    orderBy: [{ startDate: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
  })
  if (!period) throw new Error('No active Structure period found.')

  const [officers, members, assignments] = await Promise.all([
    client.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        department: { is: { periodId: period.id, status: 'ACTIVE', deletedAt: null } },
        position: { is: { deletedAt: null } },
      },
      select: { id: true, name: true, email: true, departmentId: true, positionId: true, position: { select: { sortOrder: true, departmentId: true } } },
      orderBy: { id: 'asc' },
    }),
    client.member.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true, periodId: true, membershipStatus: true },
      orderBy: { id: 'asc' },
    }),
    client.structureAssignment.findMany({
      where: { periodId: period.id, deletedAt: null },
      select: { id: true, userId: true, memberId: true, departmentId: true, positionId: true },
      orderBy: { id: 'asc' },
    }),
  ])

  const invalidOfficers = officers.filter((officer) => !officer.departmentId || !officer.positionId || officer.position?.departmentId !== officer.departmentId)
  return planStructureReconciliation({
    periodId: period.id,
    officers: officers.flatMap((officer) => officer.departmentId && officer.positionId && officer.position?.departmentId === officer.departmentId ? [{
      userId: officer.id,
      name: officer.name,
      email: officer.email,
      departmentId: officer.departmentId,
      positionId: officer.positionId,
      sortOrder: officer.position.sortOrder,
    }] : []),
    members,
    assignments,
    conflicts: invalidOfficers.map((officer) => ({ userId: officer.id, reason: 'INVALID_LEGACY_UNIT_POSITION' })),
  })
}

async function main() {
  const mode = reconciliationMode(process.argv.slice(2))
  const reviewedPlan = await readPlan(prisma)
  console.log(JSON.stringify(reviewedPlan, null, 2))
  if (mode === 'dry-run') return

  const actorId = process.env.STRUCTURE_RECONCILIATION_SUPER_ADMIN_ID
  if (!actorId) throw new Error('Apply requires STRUCTURE_RECONCILIATION_SUPER_ADMIN_ID.')

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('structure:reconciliation'))`
    await tx.$executeRaw`LOCK TABLE members, structure_assignments IN SHARE ROW EXCLUSIVE MODE`
    const actor = await tx.user.findFirst({ where: { id: actorId }, select: { roleId: true, isActive: true, deletedAt: true } })
    assertActiveSuperAdmin(actor)
    const plan = await readPlan(tx)
    assertStructureReconciliationApproval(plan, mode.approvalDigest)

    for (const operation of plan.operations) {
      const member = operation.memberId ? { id: operation.memberId } : await tx.member.create({
        data: { ...operation.createMember!, membershipStatus: 'ACTIVE_MEMBER' },
        select: { id: true },
      })
      if (operation.kind === 'ENRICH') {
        await tx.structureAssignment.update({
          where: { id: operation.assignmentId! },
          data: { userId: operation.userId, memberId: member.id, ...operation.assignment },
        })
      } else {
        await tx.structureAssignment.create({
          data: { periodId: plan.periodId, userId: operation.userId, memberId: member.id, ...operation.assignment },
        })
      }
    }
    await tx.auditLog.create({
      data: { action: 'CREATE', entity: 'StructureReconciliation', entityId: plan.digest, userId: actorId, newData: JSON.stringify({ digest: plan.digest, operationCount: plan.operations.length }) },
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

main().finally(() => prisma.$disconnect())
