import { Program, User } from '@prisma/client'

export const eventPolicies = {
  canManageEvent(user: User, program: Program) {
    return user.departmentId === program.departmentId
  },
}
