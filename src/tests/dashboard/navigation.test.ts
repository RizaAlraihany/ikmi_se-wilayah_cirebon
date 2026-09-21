import {
  dashboardNavigationGroups,
  getMobileNavigationItems,
  roleCanSeeNavigationItem,
} from '@/core/authorization/dashboard-navigation'
import { getDashboardRouteRequirement } from '@/core/authorization/dashboard-route-permissions'

function visibleHrefs(roleId: string) {
  return dashboardNavigationGroups
    .flatMap((group) => group.items)
    .filter((item) => roleCanSeeNavigationItem(item, roleId))
    .map((item) => item.href)
}

describe('dashboard navigation', () => {
  it('keeps legacy system administration out of the active sidebar', () => {
    expect(visibleHrefs('super_admin')).not.toEqual(expect.arrayContaining(['/admin/users', '/admin/system/audit-logs']))
  })

  it('separates organization and Komdigi workspaces before permission checks', () => {
    expect(visibleHrefs('admin_organization')).toEqual([
      '/admin',
      '/admin/agendas',
      '/admin/programs',
      '/admin/organization/registrations',
      '/admin/organization/structure',
      '/admin/organization/about',
      '/admin/organization',
      '/admin/cms/settings',
      '/admin/organization/settings',
    ])

    expect(visibleHrefs('admin_komdigi')).toEqual([
      '/admin',
      '/admin/kirim-tulisan',
      '/admin/campaign',
      '/admin/cms/posts',
    ])
  })

  it('keeps settings as the final independent sidebar section', () => {
    const labels = dashboardNavigationGroups.map((group) => group.label)
    const settingsGroup = dashboardNavigationGroups.at(-1)

    expect(labels).toEqual(['Overview', 'Organisasi', 'Komdigi', 'Sistem'])
    expect(settingsGroup?.items).toEqual([
      expect.objectContaining({ href: '/admin/organization/settings', label: 'Pengaturan' }),
    ])
  })

  it('uses role-specific mobile shortcuts and rejects unknown roles', () => {
    expect(getMobileNavigationItems('admin_organization').map((item) => item.href)).toEqual([
      '/admin',
      '/admin/agendas',
      '/admin/programs',
      '/admin/organization/registrations',
      '/admin/organization/structure',
    ])
    expect(getMobileNavigationItems('admin_komdigi').map((item) => item.href)).toEqual([
      '/admin',
      '/admin/campaign',
      '/admin/cms/posts',
      '/admin/kirim-tulisan',
    ])
    expect(getMobileNavigationItems('user')).toEqual([])
  })

  it('uses the same role boundary for a navigation item and its direct URL', () => {
    const protectedItems = dashboardNavigationGroups
      .flatMap((group) => group.items)
      .filter((item) => item.permission !== null)

    for (const item of protectedItems) {
      const requirement = getDashboardRouteRequirement(item.href)
      expect(requirement?.roles).toEqual(item.roles)
    }
  })

  it('normalizes hash links before checking their direct-route permission', () => {
    expect(getDashboardRouteRequirement('/admin/organization#periode')?.path).toBe('/admin/organization')
  })

  it('keeps frozen operational routes out of active navigation', () => {
    const activeHrefs = dashboardNavigationGroups.flatMap((group) => group.items).map((item) => item.href)
    expect(activeHrefs).not.toEqual(expect.arrayContaining(['/admin/events', '/admin/documents', '/admin/cms/content-plan', '/admin/request-pamflet']))
  })

  it('denies direct access to removed legacy modules', () => {
    expect(getDashboardRouteRequirement('/admin/events')).toBeUndefined()
    expect(getDashboardRouteRequirement('/admin/finance')).toBeUndefined()
    expect(getDashboardRouteRequirement('/admin/reports')).toBeUndefined()
    expect(getDashboardRouteRequirement('/admin/letters')).toBeUndefined()
    expect(getDashboardRouteRequirement('/admin/documents')).toBeUndefined()
    expect(getDashboardRouteRequirement('/admin/announcements')).toBeUndefined()
    expect(getDashboardRouteRequirement('/admin/cms/content-plan')).toBeUndefined()
    expect(getDashboardRouteRequirement('/admin/request-pamflet')).toBeUndefined()
    expect(getDashboardRouteRequirement('/admin/cms/analytics')).toBeUndefined()
  })
})
