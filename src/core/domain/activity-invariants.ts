export const PROGRAM_KINDS = ['PROGRAM'] as const
export const ACTIVITY_KINDS = [...PROGRAM_KINDS, 'AGENDA'] as const
export const EXECUTION_STATUSES = ['PLANNED', 'PREPARATION', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const

export type ProgramKind = (typeof PROGRAM_KINDS)[number]
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number]

export type RegistrationPolicy = Readonly<{
  requiresRegistration: boolean
  closesAt?: Date
  closedByAdmin?: boolean
}>

export function isProgramKind(kind: ActivityKind): kind is ProgramKind {
  return kind === 'PROGRAM'
}

/** The current PRD intentionally has no committee module for Program. */
export function programHasCommitteeModule(): false {
  return false
}

export function createRegistrationPolicy(
  requiresRegistration: boolean,
  options: Omit<RegistrationPolicy, 'requiresRegistration'> = {},
): RegistrationPolicy {
  return { requiresRegistration, ...options }
}

export function isRegistrationOpen(policy: RegistrationPolicy, now = new Date()): boolean {
  if (!policy.requiresRegistration || policy.closedByAdmin) return false
  return !policy.closesAt || policy.closesAt > now
}

// Planned schedule may change independently; it must never derive this status.
export function preserveExecutionStatus(status: ExecutionStatus): ExecutionStatus {
  return status
}
