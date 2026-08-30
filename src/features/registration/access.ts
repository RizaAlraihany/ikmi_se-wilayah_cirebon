import { isOrganizationAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requirePermission } from '@/core/authorization/guards'
import { ForbiddenError } from '@/core/errors/custom-errors'

export async function requireRegistrationReviewAccess() {
  const user = await requirePermission('registration.review')
  if (!isOrganizationAdminRole(user.roleId) && !isSuperAdminRole(user.roleId)) throw new ForbiddenError('Pendaftaran hanya dapat diproses Admin Organisasi.')
  return user
}
