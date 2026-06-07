import { Event, Program, User } from '@prisma/client'

export const reportPolicies = {
  canManageReport(user: User, eventWithProgram: Event & { program: Program }) {
    return user.departmentId === eventWithProgram.program.departmentId
  },
}
