export const ACTIVE_ROLE_IDS = [
  'super_admin',
  'admin_komdigi',
  'admin_sekretaris',
  'admin_bendahara',
  'user',
] as const

export type ActiveRoleId = (typeof ACTIVE_ROLE_IDS)[number]

export const ACTIVE_ROLE_LABELS: Record<ActiveRoleId, string> = {
  super_admin: 'Super Admin',
  admin_komdigi: 'Admin Komdigi',
  admin_sekretaris: 'Admin Sekretaris',
  admin_bendahara: 'Admin Bendahara',
  user: 'User',
}

export const ACTIVE_ADMIN_ROLE_IDS = [
  'super_admin',
  'admin_komdigi',
  'admin_sekretaris',
  'admin_bendahara',
] as const

export function isSuperAdminRole(roleId?: string | null) {
  return roleId === 'super_admin'
}

export function isKomdigiAdminRole(roleId?: string | null) {
  return roleId === 'admin_komdigi'
}

export function isSekretarisAdminRole(roleId?: string | null) {
  return roleId === 'admin_sekretaris'
}

export function isBendaharaAdminRole(roleId?: string | null) {
  return roleId === 'admin_bendahara'
}

export function isActiveRoleId(roleId?: string | null): roleId is ActiveRoleId {
  return ACTIVE_ROLE_IDS.includes(roleId as ActiveRoleId)
}

export function isInternalAdminRole(roleId?: string | null) {
  return ACTIVE_ADMIN_ROLE_IDS.includes(roleId as (typeof ACTIVE_ADMIN_ROLE_IDS)[number])
}
