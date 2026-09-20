import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertActiveSuperAdmin,
  assertStructureReconciliationApproval,
  planStructureReconciliation,
  reconciliationMode,
} from '@/features/structure/reconciliation'

const officer = { userId: 'user-1', name: 'Officer', email: 'OFFICER@example.test', departmentId: 'unit-1', positionId: 'position-1', sortOrder: 2 }

describe('Structure reconciliation', () => {
  it('queries every nondeleted identity candidate across all periods and statuses', () => {
    const source = readFileSync(resolve(process.cwd(), 'scripts/reconcile-structure.ts'), 'utf8')
    expect(source).toContain("where: { deletedAt: null }")
    expect(source).toContain('membershipStatus: true')
    expect(source).not.toContain("where: { membershipStatus: 'ACTIVE_MEMBER', deletedAt: null }")
    expect(source).not.toContain("OR: [{ periodId: period.id }, { periodId: null }]")
  })

  it('defaults to dry-run and requires explicit apply approval syntax', () => {
    expect(reconciliationMode([])).toBe('dry-run')
    expect(reconciliationMode(['--dry-run'])).toBe('dry-run')
    expect(reconciliationMode(['--apply', '--approval-digest=abc'])).toEqual({ apply: true, approvalDigest: 'abc' })
    expect(() => reconciliationMode(['--apply'])).toThrow()
  })

  it('creates a deterministic review plan without mutating its inputs', () => {
    const input = { periodId: 'period-1', officers: [officer], members: [], assignments: [] }
    const first = planStructureReconciliation(input)
    const second = planStructureReconciliation(input)
    expect(first).toEqual(second)
    expect(first.operations).toHaveLength(1)
    expect(first.operations[0].kind).toBe('CREATE')
    expect(first.operations[0].createMember?.email).toBe('officer@example.test')
    expect(input.members).toEqual([])
    expect(input.assignments).toEqual([])
  })

  it('reports position occupied by another person and refuses approval', () => {
    const plan = planStructureReconciliation({
      periodId: 'period-1',
      officers: [officer],
      members: [{ id: 'member-1', email: officer.email, periodId: 'period-1', membershipStatus: 'ACTIVE_MEMBER' }],
      assignments: [{ id: 'assignment-1', userId: 'other-user', memberId: 'member-1', departmentId: 'unit-1', positionId: 'position-1' }],
    })
    expect(plan.conflicts).toEqual([{ userId: 'user-1', reason: 'POSITION_OCCUPIED_BY_ANOTHER_PERSON' }])
    expect(() => assertStructureReconciliationApproval(plan, plan.digest)).toThrow('unresolved conflicts')
  })

  it('reports multiple assignments for same position', () => {
    const plan = planStructureReconciliation({
      periodId: 'period-1',
      officers: [officer],
      members: [],
      assignments: [
        { id: 'assignment-1', userId: 'user-1', memberId: null, departmentId: 'unit-1', positionId: 'position-1' },
        { id: 'assignment-2', userId: 'user-2', memberId: null, departmentId: 'unit-1', positionId: 'position-1' },
      ],
    })
    expect(plan.conflicts).toEqual([{ userId: 'user-1', reason: 'MULTIPLE_ASSIGNMENTS_FOR_POSITION' }])
  })

  it('is idempotent when the canonical position is already assigned to same user', () => {
    const plan = planStructureReconciliation({
      periodId: 'period-1',
      officers: [officer],
      members: [{ id: 'member-1', email: officer.email, periodId: 'period-1', membershipStatus: 'ACTIVE_MEMBER' }],
      assignments: [{ id: 'assignment-1', userId: officer.userId, memberId: 'member-1', departmentId: 'unit-1', positionId: 'position-1' }],
    })
    expect(plan.operations).toEqual([])
  })

  it('enriches existing assignment with memberId when provenance user matches', () => {
    const plan = planStructureReconciliation({
      periodId: 'period-1',
      officers: [officer],
      members: [{ id: 'member-1', email: officer.email, periodId: 'period-1', membershipStatus: 'ACTIVE_MEMBER' }],
      assignments: [{ id: 'assignment-1', userId: officer.userId, memberId: null, departmentId: 'unit-1', positionId: 'position-1' }],
    })
    expect(plan.operations).toHaveLength(1)
    expect(plan.operations[0].kind).toBe('ENRICH')
    expect(plan.operations[0].assignmentId).toBe('assignment-1')
    expect(plan.operations[0].memberId).toBe('member-1')
  })

  it('reports assignment member mismatch when provenance assignment has different member', () => {
    const plan = planStructureReconciliation({
      periodId: 'period-1',
      officers: [officer],
      members: [{ id: 'member-1', email: officer.email, periodId: 'period-1', membershipStatus: 'ACTIVE_MEMBER' }],
      assignments: [{ id: 'assignment-1', userId: officer.userId, memberId: 'member-2', departmentId: 'unit-1', positionId: 'position-1' }],
    })
    expect(plan.conflicts).toEqual([{ userId: 'user-1', reason: 'ASSIGNMENT_MEMBER_MISMATCH' }])
  })

  it('reports ambiguous and cross-period Member conflicts and refuses approval', () => {
    const ambiguous = planStructureReconciliation({
      periodId: 'period-1', officers: [officer], assignments: [],
      members: [{ id: 'member-1', email: officer.email, periodId: null, membershipStatus: 'ACTIVE_MEMBER' }, { id: 'member-2', email: officer.email.toLowerCase(), periodId: null, membershipStatus: 'ACTIVE_MEMBER' }],
    })
    expect(ambiguous.conflicts).toEqual([{ userId: 'user-1', reason: 'MULTIPLE_MEMBERS_WITH_EMAIL' }])
    expect(() => assertStructureReconciliationApproval(ambiguous, ambiguous.digest)).toThrow('unresolved conflicts')

    const crossPeriod = planStructureReconciliation({
      periodId: 'period-1', officers: [officer], assignments: [],
      members: [{ id: 'member-1', email: officer.email, periodId: 'period-2', membershipStatus: 'ACTIVE_MEMBER' }],
    })
    expect(crossPeriod.conflicts[0].reason).toBe('MEMBER_BELONGS_TO_ANOTHER_PERIOD')
  })

  it.each(['NEW', 'INACTIVE', 'REJECTED'])('reports %s same-email identity for manual review without creating or assigning', (membershipStatus) => {
    const plan = planStructureReconciliation({
      periodId: 'period-1', officers: [officer], assignments: [],
      members: [{ id: 'member-1', email: officer.email, periodId: 'period-1', membershipStatus }],
    })
    expect(plan.operations).toEqual([])
    expect(plan.conflicts).toEqual([{ userId: officer.userId, reason: `MEMBER_STATUS_REQUIRES_MANUAL_REVIEW:${membershipStatus}` }])
  })

  it('requires the exact digest and an active Super Admin', () => {
    const plan = planStructureReconciliation({ periodId: 'period-1', officers: [], members: [], assignments: [] })
    expect(() => assertStructureReconciliationApproval(plan, 'wrong')).toThrow('exact reviewed approval digest')
    expect(() => assertStructureReconciliationApproval(plan, plan.digest)).not.toThrow()
    expect(() => assertActiveSuperAdmin({ roleId: 'admin_organization', isActive: true, deletedAt: null })).toThrow('active Super Admin')
    expect(() => assertActiveSuperAdmin({ roleId: 'super_admin', isActive: true, deletedAt: null })).not.toThrow()
  })
})