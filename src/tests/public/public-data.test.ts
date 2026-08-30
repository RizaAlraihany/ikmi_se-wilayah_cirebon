import { postQueries } from '@/features/blog/queries'
import {
  publicEventSelect,
  publicLegacyStructureOfficerSelect,
  publicOfficerSelect,
  publicPostSelect,
  publicProgramSelect,
  publicStructureAssignmentSelect,
} from '@/features/public/public-data'
import { prismaMock } from '../prisma-mock'

describe('public data allow-lists', () => {
  it('never includes private officer profile fields', () => {
    expect(publicOfficerSelect).toEqual({
      id: true,
      name: true,
      photoUrl: true,
      positionId: true,
      position: expect.any(Object),
    })
    expect(publicOfficerSelect).not.toHaveProperty('email')
    expect(publicOfficerSelect).not.toHaveProperty('passwordHash')
    expect(publicOfficerSelect).not.toHaveProperty('whatsappNumber')
  })

  it('never includes program budget or event report fields', () => {
    expect(publicProgramSelect).not.toHaveProperty('budgetPlan')
    expect(publicEventSelect).not.toHaveProperty('report')
  })

  it('exposes only approved fields for public structure assignments', () => {
    expect(publicStructureAssignmentSelect).toEqual({
      id: true,
      sortOrder: true,
      user: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          positionId: true,
        },
      },
      member: { select: { id: true, fullName: true, photoUrl: true } },
      department: {
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          unitType: true,
          sortOrder: true,
        },
      },
      position: { select: { id: true, name: true, departmentId: true, sortOrder: true } },
    })
    expect(JSON.stringify(publicStructureAssignmentSelect)).not.toMatch(/email|phone|whatsapp|address|password/i)
  })

  it('keeps legacy structure fallback within the same public privacy boundary', () => {
    expect(publicLegacyStructureOfficerSelect).toEqual({
      id: true,
      name: true,
      photoUrl: true,
      departmentId: true,
      positionId: true,
      department: { select: expect.any(Object) },
      position: {
        select: {
          id: true,
          name: true,
          departmentId: true,
          sortOrder: true,
        },
      },
    })
    expect(JSON.stringify(publicLegacyStructureOfficerSelect)).not.toMatch(/email|phone|whatsapp|address|campus|password/i)
  })

  it('uses the public post allow-list for published posts', async () => {
    prismaMock.post.findMany.mockResolvedValueOnce([])

    await postQueries.getPublishedPosts()

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: publicPostSelect }),
    )
  })
})
