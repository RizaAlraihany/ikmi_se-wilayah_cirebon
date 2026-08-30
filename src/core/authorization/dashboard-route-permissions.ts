import {
  KOMDIGI_DASHBOARD_ROLE_IDS,
  ORGANIZATION_DASHBOARD_ROLE_IDS,
  SUPER_ADMIN_ROLE_IDS,
  type DashboardRoleId,
} from '@/core/auth/roles'

/**
 * Server-side access requirements for every internal dashboard route.
 *
 * `null` means an authenticated user may access their own dashboard/profile
 * area. An omitted route is deliberately denied by the route guard, so a
 * newly added internal page cannot silently become session-only.
 */
export type DashboardRoutePermission = {
  path: string
  permission: string | null
  /**
   * Optional role boundary for sensitive routes. Permission remains required;
   * this prevents a legacy grant from widening a final PRD dashboard role.
   */
  roles?: readonly DashboardRoleId[]
}

export const dashboardRoutePermissions: readonly DashboardRoutePermission[] = [
  { path: '/admin', permission: null },
  { path: '/admin/users/create', permission: 'user.create', roles: SUPER_ADMIN_ROLE_IDS },
  { path: '/admin/users', permission: 'user.view', roles: SUPER_ADMIN_ROLE_IDS },
  { path: '/admin/management', permission: 'user.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/organization/registrations', permission: 'registration.review', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/organization/structure', permission: 'structure.manage', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/organization', permission: 'organization.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/registrations', permission: 'registration.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/agendas/new', permission: 'calendar.manage', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/agendas', permission: 'calendar.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/events', permission: 'calendar.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/finance/tokens/new', permission: 'lpj_token.manage', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/finance/tokens', permission: 'lpj_token.manage', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/finance/new', permission: 'finance.create', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/finance', permission: 'finance.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/reports', permission: 'lpj.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/letters', permission: 'letter.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/documents', permission: 'document_archive.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/announcements/new', permission: 'announcement.manage', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/announcements', permission: 'announcement.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/campaign', permission: 'cms.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/request-pamflet', permission: 'content_plan.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/kirim-tulisan', permission: 'post.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/cms/posts/import-blogger', permission: 'post.publish', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/cms/posts/create', permission: 'post.create', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/cms/posts', permission: 'post.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/cms/content-plan', permission: 'content_plan.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/cms/settings', permission: 'cms.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/cms/categories', permission: 'cms.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/cms/media', permission: 'cms.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/cms/analytics', permission: 'cms.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/media', permission: 'cms.view', roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  { path: '/admin/notifications', permission: null },
  { path: '/admin/system/audit-logs', permission: 'audit.view', roles: SUPER_ADMIN_ROLE_IDS },
  { path: '/admin/programs/new', permission: 'program.create', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/admin/programs', permission: 'program.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  { path: '/dashboard', permission: null },
  { path: '/dashboard/profile', permission: null },
  { path: '/users/create', permission: 'user.create', roles: SUPER_ADMIN_ROLE_IDS },
  { path: '/users', permission: 'user.view', roles: SUPER_ADMIN_ROLE_IDS },
  { path: '/registrations', permission: 'registration.view', roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
] as const

export function getDashboardRouteRequirement(pathname: string): DashboardRoutePermission | undefined {
  const normalizedPathname = pathname.split(/[?#]/, 1)[0]
  return dashboardRoutePermissions
    .filter((route) => {
      if (normalizedPathname === route.path) return true
      return route.path !== '/admin' && route.path !== '/dashboard' && normalizedPathname.startsWith(`${route.path}/`)
    })
    .sort((left, right) => right.path.length - left.path.length)[0]

}

export function getDashboardRoutePermission(pathname: string): string | null | undefined {
  return getDashboardRouteRequirement(pathname)?.permission
}
