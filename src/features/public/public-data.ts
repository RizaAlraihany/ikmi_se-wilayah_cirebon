import type { Prisma } from '@prisma/client'

/**
 * Field allow-lists used by public routes. Keep private profile, finance,
 * audit, and workflow fields out of public React Server Component payloads.
 */
export const publicDepartmentSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  unitType: true,
  sortOrder: true,
} satisfies Prisma.DepartmentSelect

export const publicPositionSelect = {
  id: true,
  name: true,
  departmentId: true,
  department: { select: publicDepartmentSelect },
} satisfies Prisma.PositionSelect

export const publicOfficerSelect = {
  id: true,
  name: true,
  photoUrl: true,
  positionId: true,
  position: { select: publicPositionSelect },
} satisfies Prisma.UserSelect

export const publicStructureMemberSelect = {
  id: true,
  name: true,
  photoUrl: true,
  positionId: true,
} satisfies Prisma.UserSelect

export const publicMemberStructureSelect = {
  id: true,
  fullName: true,
  photoUrl: true,
} satisfies Prisma.MemberSelect

export const publicStructureAssignmentSelect = {
  id: true,
  sortOrder: true,
  user: { select: publicStructureMemberSelect },
  member: { select: publicMemberStructureSelect },
  department: { select: publicDepartmentSelect },
  position: { select: { id: true, name: true, departmentId: true, sortOrder: true } },
} satisfies Prisma.StructureAssignmentSelect

/**
 * Temporary read model for officers that still live in the legacy User table.
 * Keep this allow-list public-safe while StructureAssignment is being backfilled.
 */
export const publicLegacyStructureOfficerSelect = {
  id: true,
  name: true,
  photoUrl: true,
  departmentId: true,
  positionId: true,
  department: { select: publicDepartmentSelect },
  position: {
    select: {
      id: true,
      name: true,
      departmentId: true,
      sortOrder: true,
    },
  },
} satisfies Prisma.UserSelect

export const publicProgramSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  department: { select: publicDepartmentSelect },
} satisfies Prisma.ProgramSelect

export const publicEventSelect = {
  id: true,
  title: true,
  description: true,
  location: true,
  startDate: true,
  endDate: true,
  status: true,
} satisfies Prisma.EventSelect

export const publicEventWithProgramSelect = {
  ...publicEventSelect,
  program: { select: publicProgramSelect },
} satisfies Prisma.EventSelect

export const publicPostSelect = {
  id: true,
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  thumbnailUrl: true,
  ogImageUrl: true,
  seoTitle: true,
  seoDescription: true,
  seoKeywords: true,
  authorName: true,
  publishedAt: true,
  updatedAt: true,
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
  author: {
    select: {
      name: true,
      position: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.PostSelect

export const publicWebConfigSelect = {
  key: true,
  valueJson: true,
} satisfies Prisma.WebConfigSelect
