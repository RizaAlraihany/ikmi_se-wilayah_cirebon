import { requirePermission } from '@/core/authorization/guards'
import { ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { ForbiddenError } from '@/core/errors/custom-errors'
import type { SessionUser } from '@/core/authorization/rbac'

export async function requireOrganizationAccess(permission = 'organization.update') {
  const actor = await requirePermission(permission)
  if (!ORGANIZATION_DASHBOARD_ROLE_IDS.some((role) => role === actor.roleId)) {
    throw new ForbiddenError('Pengelolaan organisasi hanya tersedia bagi Admin Organisasi.')
  }
  return actor
}

export function assertOrganizationUnitScope(actor: SessionUser, departmentId: string | null) {
  if (actor.roleId !== 'super_admin' && (!departmentId || actor.departmentId !== departmentId)) {
    throw new ForbiddenError('Anda hanya dapat mengelola unit organisasi Anda.')
  }
}
