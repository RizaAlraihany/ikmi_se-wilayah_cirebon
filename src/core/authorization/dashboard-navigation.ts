import {
  DASHBOARD_ROLE_IDS,
  KOMDIGI_DASHBOARD_ROLE_IDS,
  ORGANIZATION_DASHBOARD_ROLE_IDS,
  SUPER_ADMIN_ROLE_IDS,
  type DashboardRoleId,
} from '@/core/auth/roles'

export const DASHBOARD_NAV_ICONS = [
  'archive',
  'audit',
  'bell',
  'book',
  'calendar',
  'dashboard',
  'file',
  'image',
  'key',
  'mail',
  'megaphone',
  'newspaper',
  'profile',
  'settings',
  'users',
  'wallet',
] as const

export type DashboardNavIcon = (typeof DASHBOARD_NAV_ICONS)[number]

export type DashboardNavigationItem = {
  href: string
  label: string
  icon: DashboardNavIcon
  permission: string | null
  roles: readonly DashboardRoleId[]
}

export type DashboardNavigationGroup = {
  label: string
  items: readonly DashboardNavigationItem[]
}

export type DashboardVisibleNavItem = Pick<DashboardNavigationItem, 'href' | 'label' | 'icon'>

export type DashboardVisibleNavGroup = {
  label: string
  items: DashboardVisibleNavItem[]
}

/**
 * Navigation is deliberately role-scoped before permission filtering. This
 * prevents a legacy permission from surfacing a system menu to the wrong role;
 * page and mutation authorization remains enforced separately on the server.
 */
export const dashboardNavigationGroups: readonly DashboardNavigationGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: 'dashboard', permission: null, roles: DASHBOARD_ROLE_IDS },
    ],
  },
  {
    label: 'Organisasi',
    items: [
      { href: '/admin/programs', label: 'Program', icon: 'calendar', permission: 'program.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
      { href: '/admin/agendas', label: 'Agenda', icon: 'calendar', permission: 'calendar.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
      { href: '/admin/events', label: 'Kalender', icon: 'calendar', permission: 'calendar.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
      { href: '/admin/organization/registrations', label: 'Anggota', icon: 'book', permission: 'registration.review', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
      { href: '/admin/organization/structure', label: 'Struktur', icon: 'users', permission: 'structure.manage', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
      { href: '/admin/documents', label: 'Dokumen', icon: 'archive', permission: 'document_archive.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
      { href: '/admin/organization#periode', label: 'Periode', icon: 'calendar', permission: 'organization.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
    ],
  },
  {
    label: 'Komdigi',
    items: [
      { href: '/admin/cms/content-plan', label: 'Content Plan', icon: 'calendar', permission: 'content_plan.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
      { href: '/admin/request-pamflet', label: 'Request Pamflet', icon: 'file', permission: 'content_plan.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
      { href: '/admin/kirim-tulisan', label: 'Kiriman Tulisan', icon: 'book', permission: 'post.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
      { href: '/admin/campaign', label: 'CMS Beranda', icon: 'image', permission: 'cms.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
      { href: '/admin/cms/posts', label: 'Publikasi', icon: 'newspaper', permission: 'post.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
      { href: '/admin/cms/media', label: 'Media', icon: 'archive', permission: 'cms.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
      { href: '/admin/cms/settings', label: 'SEO & Pengaturan', icon: 'settings', permission: 'cms.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { href: '/admin/users', label: 'Pengguna & Role', icon: 'users', permission: 'user.view', roles: SUPER_ADMIN_ROLE_IDS },
      { href: '/admin/system/audit-logs', label: 'Audit Log', icon: 'audit', permission: 'audit.view', roles: SUPER_ADMIN_ROLE_IDS },
    ],
  },
] as const

const mobilePriorityHrefs: Record<DashboardRoleId, readonly string[]> = {
  super_admin: ['/admin', '/admin/users', '/admin/system/audit-logs'],
  admin_organization: ['/admin', '/admin/programs', '/admin/agendas', '/admin/events', '/admin/organization/registrations'],
  admin_komdigi: ['/admin', '/admin/cms/content-plan', '/admin/request-pamflet', '/admin/kirim-tulisan', '/admin/cms/posts'],
}

export function roleCanSeeNavigationItem(item: DashboardNavigationItem, roleId: string | null | undefined) {
  return item.roles.includes(roleId as DashboardRoleId)
}

export function getMobileNavigationItems(roleId: string | null | undefined): DashboardNavigationItem[] {
  const priority = roleId ? mobilePriorityHrefs[roleId as DashboardRoleId] : undefined
  if (!priority) return []

  const byHref = new Map(dashboardNavigationGroups.flatMap((group) => group.items.map((item) => [item.href, item])))
  return priority
    .map((href) => byHref.get(href))
    .filter((item): item is DashboardNavigationItem => !!item && roleCanSeeNavigationItem(item, roleId))
}
