import { Program, User } from '@prisma/client'

export const eventPolicies = {
  canManageEvent(user: User, program: Program | null) {
    if (!program) return false
    return user.departmentId === program.departmentId
  },
}
