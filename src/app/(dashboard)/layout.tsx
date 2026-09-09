import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Children } from 'react'
import { notificationQueries } from '@/features/notifications/queries'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { can, type SessionUser } from '@/core/authorization/rbac'
import { requireAuth } from '@/core/authorization/guards'
import { UnauthorizedError } from '@/core/errors/custom-errors'
import {
  dashboardNavigationGroups,
  roleCanSeeNavigationItem,
  type DashboardNavigationItem,
  type DashboardVisibleNavItem,
} from '@/core/authorization/dashboard-navigation'
import {
  DashboardBreadcrumb,
  DashboardMobileDrawer,
  DashboardSidebar,
  type DashboardNavGroup,
} from './dashboard-navigation'
import { DashboardProfileDropdown } from './dashboard-profile-dropdown'
import { logger } from '@/core/monitoring/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Ruang Kerja Admin IKMI Cirebon',
  robots: { index: false, follow: false },
}

function stripPermission(item: DashboardNavigationItem): DashboardVisibleNavItem {
  return {
    href: item.href,
    label: item.label,
    icon: item.icon,
  }
}

async function hasNavAccess(item: DashboardNavigationItem, user: SessionUser) {
  if (!roleCanSeeNavigationItem(item, user.roleId)) return false
  if (!item.permission) return true
  return can(item.permission, user)
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let sessionUser: Awaited<ReturnType<typeof requireAuth>>
  try {
    sessionUser = await requireAuth()
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect('/login')
    logger.error(error, { scope: 'dashboard.layout', phase: 'auth' })
    throw error
  }

  let unreadCount: number
  let initialNotifications: Awaited<ReturnType<typeof notificationQueries.getUserNotifications>>
  let authorizedNavGroups: { label: string; items: DashboardVisibleNavItem[] }[]
  try {
    unreadCount = await notificationQueries.getUnreadCount(sessionUser.id)
    initialNotifications = await notificationQueries.getUserNotifications(sessionUser.id, 0, 10)

    authorizedNavGroups = await Promise.all(
      dashboardNavigationGroups.map(async (group) => {
        const filteredItems = await Promise.all(
          group.items.map(async (item) => ((await hasNavAccess(item, sessionUser)) ? stripPermission(item) : null)),
        )

        return {
          label: group.label,
          items: filteredItems.filter(Boolean) as DashboardVisibleNavItem[],
        }
      }),
    )
  } catch (error) {
    logger.error(error, { scope: 'dashboard.layout', phase: 'data-load', userId: sessionUser.id })
    throw error
  }

  const activeNavGroups = authorizedNavGroups.filter((group) => group.items.length > 0) as DashboardNavGroup[]

  const userName = sessionUser.name || 'Pengurus IKMI'
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    || 'IK'
  const workspaceLabel = currentWorkspaceLabel(sessionUser.roleId)
  const stableChildren = Children.toArray(children)

  return (
    <div className="dashboard-shell min-h-screen text-primary">
      <DashboardSidebar key="dashboard-sidebar" groups={activeNavGroups} workspaceLabel={workspaceLabel} />

      <div key="dashboard-content" className="lg:pl-64">
        <header className="dashboard-topbar sticky top-0 z-20 border-b border-border/80">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <div key="dashboard-header-navigation" className="flex items-center gap-3">
              <DashboardMobileDrawer key="dashboard-mobile-drawer" groups={activeNavGroups} />
              <DashboardBreadcrumb key="dashboard-breadcrumb" workspaceLabel={workspaceLabel} />
            </div>
            <div key="dashboard-header-actions" className="flex items-center gap-2">
              <NotificationDropdown
                key={`notifications-${sessionUser.id}`}
                initialNotifications={initialNotifications}
                unreadCount={unreadCount}
              />
              <DashboardProfileDropdown
                key={`profile-${sessionUser.id}`}
                userName={userName}
                userInitials={userInitials}
                roleLabel={currentUserRoleLabel(sessionUser.roleId)}
              />
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)] px-4 py-5 lg:px-8 lg:py-7">
          <div className="dashboard-container">
            {stableChildren}
          </div>
        </main>
      </div>
    </div>
  )
}

function currentUserRoleLabel(roleId: string | null | undefined) {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_organization: 'Admin Organisasi',
    admin_komdigi: 'Admin Komdigi',
  }

  return roleId ? labels[roleId] ?? 'Pengurus IKMI' : 'Pengurus IKMI'
}

function currentWorkspaceLabel(roleId: string | null | undefined) {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_organization: 'Organisasi',
    admin_komdigi: 'Komdigi',
  }

  return roleId ? labels[roleId] ?? 'IKMI' : 'IKMI'
}
