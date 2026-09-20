import { createHash } from 'node:crypto'

export type LegacyStructureOfficer = {
  userId: string
  name: string
  email: string
  departmentId: string
  positionId: string
  sortOrder: number
}

export type ReconciliationMember = {
  id: string
  email: string | null
  periodId: string | null
  membershipStatus: string
}

export type ReconciliationAssignment = {
  id: string
  userId: string | null
  memberId: string | null
  departmentId: string
  positionId: string
}

export type StructureReconciliationOperation = {
  kind: 'CREATE' | 'ENRICH'
  assignmentId: string | null
  userId: string
  memberId: string | null
  createMember: { fullName: string; email: string; periodId: string } | null
  assignment: { departmentId: string; positionId: string; sortOrder: number }
}

export type StructureReconciliationPlan = {
  periodId: string
  operations: StructureReconciliationOperation[]
  conflicts: Array<{ userId: string; reason: string }>
  digest: string
}

function normalizedEmail(value: string) {
  return value.trim().toLowerCase()
}

function digestPlan(value: Omit<StructureReconciliationPlan, 'digest'>) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

export function planStructureReconciliation(input: {
  periodId: string
  officers: LegacyStructureOfficer[]
  members: ReconciliationMember[]
  assignments: ReconciliationAssignment[]
  conflicts?: Array<{ userId: string; reason: string }>
}): StructureReconciliationPlan {
  const membersByEmail = new Map<string, ReconciliationMember[]>()
  for (const member of input.members) {
    if (!member.email) continue
    const email = normalizedEmail(member.email)
    membersByEmail.set(email, [...(membersByEmail.get(email) ?? []), member])
  }

  const assignmentsByPosition = new Map<string, ReconciliationAssignment[]>()
  for (const assignment of input.assignments) {
    assignmentsByPosition.set(assignment.positionId, [...(assignmentsByPosition.get(assignment.positionId) ?? []), assignment])
  }
  const operations: StructureReconciliationOperation[] = []
  const conflicts: Array<{ userId: string; reason: string }> = [...(input.conflicts ?? [])]

  for (const officer of [...input.officers].sort((a, b) => a.userId.localeCompare(b.userId))) {
    const occupying = assignmentsByPosition.get(officer.positionId) ?? []
    const provenanceAssignment = occupying.find((assignment) => assignment.userId === officer.userId)
    if (occupying.length && !provenanceAssignment) {
      conflicts.push({ userId: officer.userId, reason: 'POSITION_OCCUPIED_BY_ANOTHER_PERSON' })
      continue
    }
    if (occupying.length > 1) {
      conflicts.push({ userId: officer.userId, reason: 'MULTIPLE_ASSIGNMENTS_FOR_POSITION' })
      continue
    }

    const matches = membersByEmail.get(normalizedEmail(officer.email)) ?? []
    if (matches.length > 1) {
      conflicts.push({ userId: officer.userId, reason: 'MULTIPLE_MEMBERS_WITH_EMAIL' })
      continue
    }
    const member = matches[0]
    if (member && member.membershipStatus !== 'ACTIVE_MEMBER') {
      conflicts.push({ userId: officer.userId, reason: `MEMBER_STATUS_REQUIRES_MANUAL_REVIEW:${member.membershipStatus}` })
      continue
    }
    if (member?.periodId && member.periodId !== input.periodId) {
      conflicts.push({ userId: officer.userId, reason: 'MEMBER_BELONGS_TO_ANOTHER_PERIOD' })
      continue
    }
    if (provenanceAssignment?.memberId && member && provenanceAssignment.memberId !== member.id) {
      conflicts.push({ userId: officer.userId, reason: 'ASSIGNMENT_MEMBER_MISMATCH' })
      continue
    }
    if (provenanceAssignment?.memberId) continue

    operations.push({
      kind: provenanceAssignment ? 'ENRICH' : 'CREATE',
      assignmentId: provenanceAssignment?.id ?? null,
      userId: officer.userId,
      memberId: member?.id ?? null,
      createMember: member ? null : { fullName: officer.name, email: normalizedEmail(officer.email), periodId: input.periodId },
      assignment: { departmentId: officer.departmentId, positionId: officer.positionId, sortOrder: officer.sortOrder },
    })
  }

  const reviewable = { periodId: input.periodId, operations, conflicts }
  return { ...reviewable, digest: digestPlan(reviewable) }
}

export function assertStructureReconciliationApproval(plan: StructureReconciliationPlan, approvalDigest: string | undefined) {
  if (plan.conflicts.length) throw new Error('Structure reconciliation has unresolved conflicts.')
  if (!approvalDigest || approvalDigest !== plan.digest) throw new Error('Apply requires the exact reviewed approval digest.')
}

export function reconciliationMode(args: string[]) {
  if (args.length === 0 || (args.length === 1 && args[0] === '--dry-run')) return 'dry-run' as const
  if (args.length === 2 && args[0] === '--apply' && args[1].startsWith('--approval-digest=')) {
    return { apply: true as const, approvalDigest: args[1].slice('--approval-digest='.length) }
  }
  throw new Error('Use --dry-run or --apply --approval-digest=<reviewed digest>.')
}

export function assertActiveSuperAdmin(actor: { roleId: string | null; isActive: boolean; deletedAt: Date | null } | null) {
  if (!actor || actor.roleId !== 'super_admin' || !actor.isActive || actor.deletedAt) {
    throw new Error('Apply requires an active Super Admin.')
  }
}
