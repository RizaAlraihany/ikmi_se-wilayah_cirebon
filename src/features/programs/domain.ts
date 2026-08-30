export const PROGRAM_DERIVED_STATUSES = [
  'UNSCHEDULED',
  'UPCOMING',
  'ONGOING',
  'COMPLETED',
  'POSTPONED',
  'CANCELLED',
] as const

export type ProgramDerivedStatus = (typeof PROGRAM_DERIVED_STATUSES)[number]
export type ProgramStatusOverride = Extract<ProgramDerivedStatus, 'POSTPONED' | 'CANCELLED'>

type ProgramSchedule = {
  plannedStart: Date | null
  plannedEnd: Date | null
  statusOverride: ProgramStatusOverride | null
}

/**
 * Dates are stored as absolute instants. Comparing them against `now` is
 * timezone-safe; Jakarta conversion is only needed when parsing date inputs.
 */
export function deriveProgramStatus(program: ProgramSchedule, now = new Date()): ProgramDerivedStatus {
  if (program.statusOverride) return program.statusOverride
  if (!program.plannedStart) return 'UNSCHEDULED'
  if (now < program.plannedStart) return 'UPCOMING'
  if (!program.plannedEnd) return 'ONGOING'
  if (now <= program.plannedEnd) return 'ONGOING'
  return 'COMPLETED'
}

export function programStatusLabel(status: ProgramDerivedStatus) {
  const labels: Record<ProgramDerivedStatus, string> = {
    UNSCHEDULED: 'Belum dijadwalkan',
    UPCOMING: 'Akan datang',
    ONGOING: 'Berjalan',
    COMPLETED: 'Selesai',
    POSTPONED: 'Ditunda',
    CANCELLED: 'Dibatalkan',
  }

  return labels[status]
}

export function programVisibilityLabel(visibility: string | null | undefined) {
  const labels: Record<string, string> = {
    PUBLIC: 'Publik',
    INTERNAL: 'Internal',
    HIDDEN: 'Disembunyikan',
    MEMBER_ONLY: 'Internal (legacy)',
    PENGURUS_ONLY: 'Internal (legacy)',
    BPH_ONLY: 'Internal (legacy)',
  }

  return visibility ? labels[visibility] ?? 'Belum ditentukan' : 'Belum ditentukan'
}
