/**
 * Dashboard roles are deliberately small and follow the final PRD role model.
 * Department, position, committee, and member status are organizational data,
 * not dashboard roles.
 */
export const DASHBOARD_ROLE_IDS = [
  'super_admin',
  'admin_organization',
  'admin_komdigi',
] as const

export type DashboardRoleId = (typeof DASHBOARD_ROLE_IDS)[number]

export const SUPER_ADMIN_ROLE_IDS = ['super_admin'] as const satisfies readonly DashboardRoleId[]
export const ORGANIZATION_DASHBOARD_ROLE_IDS = ['super_admin', 'admin_organization'] as const satisfies readonly DashboardRoleId[]
export const KOMDIGI_DASHBOARD_ROLE_IDS = ['super_admin', 'admin_komdigi'] as const satisfies readonly DashboardRoleId[]

export const DASHBOARD_ROLE_LABELS: Record<DashboardRoleId, string> = {
  super_admin: 'Super Admin',
  admin_organization: 'Admin Organisasi',
  admin_komdigi: 'Admin Komdigi',
}

export function isSuperAdminRole(roleId?: string | null) {
  return roleId === 'super_admin'
}

export function isOrganizationAdminRole(roleId?: string | null) {
  return roleId === 'admin_organization'
}

export function isKomdigiAdminRole(roleId?: string | null) {
  return roleId === 'admin_komdigi'
}

export function isDashboardRole(roleId?: string | null): roleId is DashboardRoleId {
  return DASHBOARD_ROLE_IDS.includes(roleId as DashboardRoleId)
}

export function isAuthenticatedDashboardUser(
  user?: { id?: string | null; roleId?: string | null } | null,
) {
  return Boolean(user?.id && isDashboardRole(user.roleId))
}
