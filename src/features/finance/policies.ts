import type { FinanceRequest, User } from '@prisma/client'

export const financePolicies = {
  canManageRequest(user: User, request: FinanceRequest) {
    return user.departmentId === request.departmentId
  },
}
