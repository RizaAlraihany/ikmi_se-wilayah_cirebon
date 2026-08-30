import { KOMDIGI_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { requirePermission, requirePermissionForUser } from '@/core/authorization/guards'
import type { SessionUser } from '@/core/authorization/rbac'
import { ForbiddenError } from '@/core/errors/custom-errors'

function assertKomdigiRole(user: SessionUser) {
  if (!KOMDIGI_DASHBOARD_ROLE_IDS.includes(user.roleId as (typeof KOMDIGI_DASHBOARD_ROLE_IDS)[number])) {
    throw new ForbiddenError('Content Plan hanya dapat diakses oleh Admin Komdigi.')
  }
  return user
}

export async function requireContentPlanActor(userId?: string) {
  const user = userId
    ? await requirePermissionForUser(userId, 'content_plan.manage')
    : await requirePermission('content_plan.manage')
  return assertKomdigiRole(user)
}
