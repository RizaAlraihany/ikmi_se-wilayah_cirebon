import {
  classifyLegacyEvents,
  PRD_V2_AGENDAS,
  PRD_V2_ORGANIZATIONAL_UNITS,
  PRD_V2_PROGRAM_RELATIONSHIPS,
  PRD_V2_PROGRAMS,
  validatePrdV2MasterData,
} from '@/core/domain/prd-v2-master-data'

describe('PRD master-data migration', () => {
  it('preserves the PRD baseline of 14 Programs and 25 Agendas', () => {
    expect(() => validatePrdV2MasterData()).not.toThrow()
    expect(PRD_V2_PROGRAMS).toHaveLength(14)
    expect(PRD_V2_AGENDAS).toHaveLength(25)
    expect(PRD_V2_ORGANIZATIONAL_UNITS).toHaveLength(9)
  })

  it('keeps the single Program model, no committee module, and unknown budgets explicit', () => {
    expect(PRD_V2_PROGRAMS.every((program) => !('programType' in program))).toBe(true)
    expect(PRD_V2_PROGRAMS.every((program) => !('requiresCommittee' in program))).toBe(true)
    expect(PRD_V2_PROGRAMS.find((program) => program.name === 'MAKRAB')?.plannedBudget).toBeNull()
    expect(PRD_V2_PROGRAMS.find((program) => program.name === 'KONGRES IKMI')?.plannedBudget).toBeNull()
    expect(PRD_V2_PROGRAMS.some((program) => program.plannedBudget === '0')).toBe(false)
  })

  it('contains the two PRD Program relationships and never bulk-converts legacy events into Agendas', () => {
    expect(PRD_V2_PROGRAM_RELATIONSHIPS).toEqual(expect.arrayContaining([
      expect.objectContaining({ relationshipType: 'SCHEDULED_WITH' }),
      expect.objectContaining({ relationshipType: 'DEPENDS_ON' }),
    ]))
    expect(classifyLegacyEvents([{ id: 'event_known', programId: 'prog_kad_prabumi' }, { id: 'event_unknown', programId: 'legacy_only_program' }])).toEqual([
      { eventId: 'event_known', legacyProgramId: 'prog_kad_prabumi', classification: 'PROGRAM_OCCURRENCE_REQUIRES_REVIEW' },
      { eventId: 'event_unknown', legacyProgramId: 'legacy_only_program', classification: 'UNMAPPED_LEGACY_EVENT_REQUIRES_REVIEW' },
    ])
  })
})
