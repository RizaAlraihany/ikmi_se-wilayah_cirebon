import { getActivePublicStructure } from '@/features/public/public-structure'
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
})
