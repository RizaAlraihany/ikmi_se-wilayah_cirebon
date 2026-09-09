import { getActivePublicStructure, getCurrentStructurePeriod } from '@/features/public/public-structure'
import { prismaMock } from '../prisma-mock'

const department = {
  id: 'bph',
  name: 'Badan Pengurus Harian',
  code: 'BPH',
  description: 'Pimpinan organisasi.',
  unitType: 'BPH' as const,
  sortOrder: 0,
}

describe('public structure read model', () => {
  it('merges valid legacy officers while ignoring malformed assignments', async () => {
    prismaMock.period.findFirst.mockResolvedValueOnce({
      id: 'period-1',
      name: '2026–2027',
      cabinetName: null,
    } as never)
    prismaMock.structureAssignment.findMany
      .mockResolvedValueOnce([
        {
          id: 'invalid-assignment',
          sortOrder: 0,
          user: { id: 'admin', name: 'Admin', photoUrl: null, positionId: null },
          member: null,
          department,
          position: {
            id: 'position-other-unit',
            name: 'Anggota Unit Lain',
            departmentId: 'other-unit',
            sortOrder: 0,
          },
        },
      ] as never)
      .mockResolvedValueOnce([])
    prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: 'officer-1',
        name: 'Pengurus Nyata',
        photoUrl: 'https://example.com/photo.webp',
        departmentId: department.id,
        positionId: 'ketua-umum',
        department,
        position: {
          id: 'ketua-umum',
          name: 'Ketua Umum',
          departmentId: department.id,
          sortOrder: 0,
        },
      },
    ] as never)

    const result = await getActivePublicStructure()

    expect(result.assignments).toHaveLength(1)
    expect(result.assignments[0]).toMatchObject({
      id: 'legacy:officer-1:ketua-umum',
      person: { name: 'Pengurus Nyata' },
      department: { id: 'bph' },
      position: { id: 'ketua-umum' },
    })
    expect(prismaMock.period.findFirst).toHaveBeenCalledWith({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, name: true, cabinetName: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    })
    expect(prismaMock.structureAssignment.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        orderBy: [
          { department: { sortOrder: 'asc' } },
          { department: { name: 'asc' } },
          { position: { sortOrder: 'asc' } },
          { sortOrder: 'asc' },
          { id: 'asc' },
        ],
      }),
    )
  })

  it('does not resurrect an explicitly archived legacy assignment', async () => {
    prismaMock.period.findFirst.mockResolvedValueOnce({
      id: 'period-1',
      name: '2026–2027',
      cabinetName: null,
    } as never)
    prismaMock.structureAssignment.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { userId: 'officer-1', positionId: 'ketua-umum' },
      ] as never)
    prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: 'officer-1',
        name: 'Pengurus Lama',
        photoUrl: null,
        departmentId: department.id,
        positionId: 'ketua-umum',
        department,
        position: {
          id: 'ketua-umum',
          name: 'Ketua Umum',
          departmentId: department.id,
          sortOrder: 0,
        },
      },
    ] as never)

    const result = await getActivePublicStructure()

    expect(result.assignments).toEqual([])
  })

  it('returns a safe empty public structure when there is no active period', async () => {
    prismaMock.period.findFirst.mockResolvedValueOnce(null)

    await expect(getActivePublicStructure()).resolves.toEqual({
      period: null,
      assignments: [],
    })
    expect(prismaMock.structureAssignment.findMany).not.toHaveBeenCalled()
    expect(prismaMock.user.findMany).not.toHaveBeenCalled()
  })

  it('uses one deterministic current-period selector for single, multiple, and tied ACTIVE periods', async () => {
    const newest = { id: 'period-newest', name: 'Newest', cabinetName: null }
    const tiedWinner = { id: 'period-z', name: 'Tie winner', cabinetName: null }
    prismaMock.period.findFirst.mockResolvedValueOnce(newest as never).mockResolvedValueOnce(tiedWinner as never)

    await expect(getCurrentStructurePeriod()).resolves.toEqual(newest)
    await expect(getCurrentStructurePeriod()).resolves.toEqual(tiedWinner)
    expect(prismaMock.period.findFirst).toHaveBeenNthCalledWith(1, {
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, name: true, cabinetName: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    })
    expect(prismaMock.period.findFirst).toHaveBeenNthCalledWith(2, {
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, name: true, cabinetName: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    })
  })

  it('lets explicit position and assignment ordering beat position labels', async () => {
    const makeRecord = (id: string, name: string, positionId: string, positionSortOrder: number, sortOrder: number) => ({
      id,
      sortOrder,
      user: { id: `user-${id}`, name, photoUrl: null, positionId },
      member: null,
      department,
      position: { id: positionId, name, departmentId: department.id, sortOrder: positionSortOrder },
    })

    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1', name: '2026', cabinetName: null } as never)
    prismaMock.structureAssignment.findMany
      .mockResolvedValueOnce([
        makeRecord('label-first', 'Ketua Umum', 'position-10', 10, 0),
        makeRecord('db-first', 'Anggota', 'position-1', 1, 0),
      ] as never)
      .mockResolvedValueOnce([])
    prismaMock.user.findMany.mockResolvedValueOnce([])

    const result = await getActivePublicStructure()

    expect(result.assignments.map((assignment) => assignment.person.name)).toEqual(['Anggota', 'Ketua Umum'])

    prismaMock.period.findFirst.mockResolvedValueOnce({ id: 'period-1', name: '2026', cabinetName: null } as never)
    prismaMock.structureAssignment.findMany
      .mockResolvedValueOnce([
        makeRecord('label-first-tie', 'Ketua Umum', 'position-1', 1, 2),
        makeRecord('assignment-first-tie', 'Anggota', 'position-2', 1, 1),
      ] as never)
      .mockResolvedValueOnce([])
    prismaMock.user.findMany.mockResolvedValueOnce([])

    const tiedResult = await getActivePublicStructure()

    expect(tiedResult.assignments.map((assignment) => assignment.person.name)).toEqual(['Anggota', 'Ketua Umum'])
  })
})
