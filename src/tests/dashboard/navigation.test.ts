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
  it('keeps system navigation exclusive to Super Admin', () => {
    expect(visibleHrefs('super_admin')).toEqual(expect.arrayContaining(['/admin/users', '/admin/system/audit-logs']))
    expect(visibleHrefs('admin_organization')).not.toEqual(expect.arrayContaining(['/admin/users', '/admin/system/audit-logs']))
    expect(visibleHrefs('admin_komdigi')).not.toEqual(expect.arrayContaining(['/admin/users', '/admin/system/audit-logs']))
  })

  it('separates organization and Komdigi workspaces before permission checks', () => {
    expect(visibleHrefs('admin_organization')).toEqual([
      '/admin',
      '/admin/programs',
      '/admin/agendas',
      '/admin/events',
      '/admin/organization/registrations',
      '/admin/organization/structure',
      '/admin/documents',
      '/admin/organization#periode',
    ])

    expect(visibleHrefs('admin_komdigi')).toEqual([
      '/admin',
      '/admin/cms/content-plan',
      '/admin/request-pamflet',
      '/admin/kirim-tulisan',
      '/admin/campaign',
      '/admin/cms/posts',
      '/admin/cms/media',
      '/admin/cms/settings',
    ])
  })

  it('uses role-specific mobile shortcuts and rejects unknown roles', () => {
    expect(getMobileNavigationItems('admin_organization').map((item) => item.href)).toEqual([
      '/admin',
      '/admin/programs',
      '/admin/agendas',
      '/admin/events',
      '/admin/organization/registrations',
    ])
    expect(getMobileNavigationItems('admin_komdigi').map((item) => item.href)).toEqual([
      '/admin',
      '/admin/cms/content-plan',
      '/admin/request-pamflet',
      '/admin/kirim-tulisan',
      '/admin/cms/posts',
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

  it('protects Documents with a dedicated permission instead of the Letters domain', () => {
    expect(getDashboardRouteRequirement('/admin/documents')?.permission).toBe('document_archive.view')
    const documentItem = dashboardNavigationGroups.flatMap((group) => group.items).find((item) => item.href === '/admin/documents')
    expect(documentItem?.permission).toBe('document_archive.view')
  })
})
