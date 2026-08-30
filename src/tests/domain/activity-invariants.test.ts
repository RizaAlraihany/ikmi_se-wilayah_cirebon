import {
  createRegistrationPolicy,
  isProgramKind,
  isRegistrationOpen,
  preserveExecutionStatus,
  programHasCommitteeModule,
} from '@/core/domain/activity-invariants'

describe('activity domain invariants', () => {
  it('keeps Program and Agenda distinct without a committee module', () => {
    expect(isProgramKind('PROGRAM')).toBe(true)
    expect(isProgramKind('AGENDA')).toBe(false)
    expect(programHasCommitteeModule()).toBe(false)
  })

  it('keeps registration optional and contains no participant-quota policy', () => {
    const disabled = createRegistrationPolicy(false)
    const enabled = createRegistrationPolicy(true, { closesAt: new Date('2026-08-10T00:00:00.000Z') })

    expect(isRegistrationOpen(disabled, new Date('2026-08-08T00:00:00.000Z'))).toBe(false)
    expect(isRegistrationOpen(enabled, new Date('2026-08-08T00:00:00.000Z'))).toBe(true)
    expect(isRegistrationOpen(enabled, new Date('2026-08-11T00:00:00.000Z'))).toBe(false)
    expect('participantQuota' in enabled).toBe(false)
    expect('remainingSlots' in enabled).toBe(false)
    expect('waitingList' in enabled).toBe(false)
  })

  it('does not infer actual execution status from a schedule transition', () => {
    expect(preserveExecutionStatus('PLANNED')).toBe('PLANNED')
    expect(preserveExecutionStatus('COMPLETED')).toBe('COMPLETED')
  })
})
