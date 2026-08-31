import { Prisma, PrismaClient } from '@prisma/client'
import {
  classifyLegacyEvents,
  PRD_V2_AGENDAS,
  PRD_V2_ORGANIZATIONAL_UNITS,
  PRD_V2_PERIOD,
  PRD_V2_PROGRAM_RELATIONSHIPS,
  PRD_V2_PROGRAMS,
  validatePrdV2MasterData,
} from '../../src/core/domain/prd-v2-master-data'

/**
 * LEGACY / MANUAL ONLY
 *
 * Historical one-time ERP to previous-PRD data migration. This file is kept
 * for reference and must not be run during normal v5 development. It has no
 * package.json command; any use requires an approved historical data plan.
 */

const prisma = new PrismaClient()

type Mode = 'dry-run' | 'apply'

function parseMode(args: string[]): Mode {
  if (args.length === 1 && args[0] === '--dry-run') return 'dry-run'
  if (args.length === 1 && args[0] === '--apply') return 'apply'

  throw new Error('Legacy manual script: use only with an approved historical data plan and an explicit --dry-run or --apply mode.')
}

function toDate(value: string | undefined) {
  return value ? new Date(value) : null
}

async function loadAndValidateLegacyMappings() {
  const explicitLegacyMappings = PRD_V2_PROGRAMS.filter((program) => program.acceptedLegacyNames)
  const legacyPrograms = await prisma.program.findMany({
    where: {
      id: { in: explicitLegacyMappings.map((program) => program.targetProgramId) },
      deletedAt: null,
    },
    select: { id: true, name: true, periodId: true },
  })
  const programById = new Map(legacyPrograms.map((program) => [program.id, program]))

  for (const mapping of explicitLegacyMappings) {
    const legacyProgram = programById.get(mapping.targetProgramId)
    if (!legacyProgram) {
      throw new Error(`Program legacy untuk mapping PRD tidak ditemukan: ${mapping.targetProgramId}`)
    }

    const acceptedNames = new Set([...(mapping.acceptedLegacyNames ?? []), mapping.name])
    if (!acceptedNames.has(legacyProgram.name)) {
      throw new Error(`Program legacy ${mapping.targetProgramId} memiliki nama tidak terduga: ${legacyProgram.name}`)
    }
  }

  const newPrograms = PRD_V2_PROGRAMS.filter((program) => !program.acceptedLegacyNames)
  const existingNewProgramIds = await prisma.program.findMany({
    where: { id: { in: newPrograms.map((program) => program.targetProgramId) } },
    select: { id: true, periodId: true },
  })

  return {
    legacyPrograms: programById,
    existingNewPrograms: new Map(existingNewProgramIds.map((program) => [program.id, program])),
  }
}

function programBackfillData(definition: (typeof PRD_V2_PROGRAMS)[number]) {
  return {
    name: definition.name,
    departmentId: definition.organizationalUnitId,
    budgetPlan: definition.plannedBudget === null ? null : new Prisma.Decimal(definition.plannedBudget),
    periodId: PRD_V2_PERIOD.id,
    fullName: definition.name,
    plannedStart: toDate(definition.plannedStart),
    plannedEnd: toDate(definition.plannedEnd),
    scheduleStatus: definition.scheduleStatus ?? null,
    plannedBudget: definition.plannedBudget === null ? null : new Prisma.Decimal(definition.plannedBudget),
    budgetVisibility: null,
    verificationStatus: 'NEEDS_VERIFICATION' as const,
    progress: null,
    visibility: 'HIDDEN' as const,
    campaignEnabled: false,
    featured: false,
    isFeatured: false,
    requiresRegistration: definition.requiresRegistration,
    registrationType: definition.registrationType,
  }
}

async function applyBackfill(
  tx: Prisma.TransactionClient,
  mappings: Awaited<ReturnType<typeof loadAndValidateLegacyMappings>>,
) {
  await tx.period.upsert({
    where: { id: PRD_V2_PERIOD.id },
    update: PRD_V2_PERIOD,
    create: PRD_V2_PERIOD,
  })

  for (const unit of PRD_V2_ORGANIZATIONAL_UNITS) {
    const data = {
      name: unit.name,
      code: unit.code,
      email: unit.email,
      periodId: PRD_V2_PERIOD.id,
      status: 'ACTIVE' as const,
      unitType: unit.unitType,
    }

    await tx.department.upsert({
      where: { id: unit.id },
      update: data,
      create: { id: unit.id, ...data },
    })
  }

  for (const definition of PRD_V2_PROGRAMS) {
    const data = programBackfillData(definition)
    const legacyProgram = mappings.legacyPrograms.get(definition.targetProgramId)
    const existingNewProgram = mappings.existingNewPrograms.get(definition.targetProgramId)

    if (legacyProgram) {
      if (legacyProgram.periodId === null) {
        await tx.program.update({ where: { id: definition.targetProgramId }, data })
      }
      continue
    }

    if (!definition.createDescription) {
      throw new Error(`Program baru ${definition.name} memerlukan deskripsi PRD untuk dibuat.`)
    }

    if (!existingNewProgram) {
      await tx.program.create({
        data: {
          id: definition.targetProgramId,
          ...data,
          description: definition.createDescription,
          status: 'DRAFT',
        },
      })
    }
  }

  for (const relationship of PRD_V2_PROGRAM_RELATIONSHIPS) {
    await tx.programRelationship.upsert({
      where: {
        sourceProgramId_targetProgramId_relationshipType: {
          sourceProgramId: relationship.sourceProgramId,
          targetProgramId: relationship.targetProgramId,
          relationshipType: relationship.relationshipType,
        },
      },
      update: { note: relationship.note },
      create: relationship,
    })
  }

  for (const agenda of PRD_V2_AGENDAS) {
    const data = {
      periodId: PRD_V2_PERIOD.id,
      organizationalUnitId: agenda.organizationalUnitId,
      name: agenda.name,
      scheduleType: agenda.scheduleType,
      startDatetime: toDate(agenda.startDatetime),
      endDatetime: toDate(agenda.endDatetime),
      recurrenceRule: agenda.recurrenceRule ?? null,
      relativeToProgramId: agenda.relativeToProgramId ?? null,
      relativeOffset: agenda.relativeOffset ?? null,
      conditionalNote: agenda.conditionalNote ?? null,
      visibility: 'HIDDEN' as const,
      status: 'DRAFT' as const,
      requiresRegistration: null,
      registrationType: null,
    }

    await tx.agenda.upsert({
      where: { id: agenda.id },
      update: data,
      create: {
        id: agenda.id,
        slug: agenda.id, // use id as slug placeholder; uniqueAgendaSlug used by the service on real create
        ...data,
      },
    })
  }
}

async function main() {
  const mode = parseMode(process.argv.slice(2))
  validatePrdV2MasterData()

  const mappings = await loadAndValidateLegacyMappings()
  const legacyEvents = await prisma.event.findMany({
    where: { deletedAt: null },
    select: { id: true, programId: true },
    orderBy: { id: 'asc' },
  })
  const eventReview = classifyLegacyEvents(legacyEvents)

  if (mode === 'apply') {
    await prisma.$transaction((tx) => applyBackfill(tx, mappings))
  }

  const summary = {
    mode,
    period: PRD_V2_PERIOD.id,
    organizationalUnits: PRD_V2_ORGANIZATIONAL_UNITS.length,
    programs: PRD_V2_PROGRAMS.length,
    agendas: PRD_V2_AGENDAS.length,
    programRelationships: PRD_V2_PROGRAM_RELATIONSHIPS.length,
    eventReview: {
      total: eventReview.length,
      programOccurrencesRequiringReview: eventReview.filter((event) => event.classification === 'PROGRAM_OCCURRENCE_REQUIRES_REVIEW').length,
      unmappedLegacyEventsRequiringReview: eventReview.filter((event) => event.classification === 'UNMAPPED_LEGACY_EVENT_REQUIRES_REVIEW').length,
      mappings: eventReview,
    },
  }

  console.log(JSON.stringify(summary, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
