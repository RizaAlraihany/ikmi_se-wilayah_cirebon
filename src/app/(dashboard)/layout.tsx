import { auth, signOut } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, LogOut, UserCircle } from 'lucide-react'
import { notificationQueries } from '@/features/notifications/queries'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { Button } from '@/components/ui/button'
import { can, type SessionUser } from '@/core/authorization/rbac'
import {
  DashboardBottomNav,
  DashboardMobileDrawer,
  DashboardSidebar,
  type DashboardNavGroup,
  type DashboardNavItem,
} from './dashboard-navigation'

type PermissionNavItem = DashboardNavItem & { permission: string | null }

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard', permission: null },
  { href: '/admin/users', label: 'Manajemen User', icon: 'users', permission: 'user.view' },
  { href: '/admin/finance/tokens', label: 'LPJ Token', icon: 'key', permission: 'lpj_token.manage' },
  { href: '/admin/system/audit-logs', label: 'Audit Logs', icon: 'audit', permission: 'audit.view' },
  { href: '/admin/cms/settings', label: 'Landing Page', icon: 'settings', permission: 'cms.update' },
  { href: '/admin/cms/content-plan', label: 'Content Plan', icon: 'file', permission: 'content_plan.view' },
  { href: '/admin/cms/posts', label: 'Blog & Artikel', icon: 'newspaper', permission: 'post.view' },
  { href: '/admin/cms/categories', label: 'Kategori', icon: 'book', permission: 'cms.view' },
  { href: '/admin/cms/media', label: 'Media Library', icon: 'archive', permission: 'cms.view' },
  { href: '/admin/events', label: 'Kalender Kegiatan', icon: 'calendar', permission: 'calendar.view' },
  { href: '/admin/announcements', label: 'Pengumuman', icon: 'megaphone', permission: 'announcement.view' },
  { href: '/admin/letters', label: 'Persuratan', icon: 'mail', permission: 'letter.view' },
  { href: '/admin/documents', label: 'Arsip Dokumen', icon: 'archive', permission: 'letter.view' },
  { href: '/admin/management', label: 'Manajemen Pengurus', icon: 'users', permission: 'user.view' },
  { href: '/admin/registrations', label: 'Anggota Baru', icon: 'book', permission: 'registration.view' },
  { href: '/admin/finance', label: 'Buku Kas', icon: 'wallet', permission: 'finance.view' },
  { href: '/admin/reports', label: 'LPJ Module', icon: 'file', permission: 'lpj.view' },
] satisfies PermissionNavItem[]

const navGroups = [
  {
    label: 'Overview',
    items: [navItems[0]],
  },
  {
    label: 'Super Admin',
    items: [navItems[1], navItems[2], navItems[3], navItems[4]],
  },
  {
    label: 'Komdigi',
    items: [navItems[5], navItems[6], navItems[7], navItems[8]],
  },
  {
    label: 'Sekretaris',
    items: [navItems[9], navItems[10], navItems[11], navItems[12], navItems[13], navItems[14]],
  },
  {
    label: 'Bendahara',
    items: [navItems[15], navItems[16]],
  },
]

const defaultMobileNavItems = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard', permission: null },
  { href: '/admin/events', label: 'Kalender', icon: 'calendar', permission: 'calendar.view' },
  { href: '/admin/letters', label: 'Surat', icon: 'mail', permission: 'letter.view' },
  { href: '/admin/documents', label: 'Arsip', icon: 'archive', permission: 'letter.view' },
  { href: '/admin/management', label: 'Pengurus', icon: 'users', permission: 'user.view' },
  { href: '/admin/announcements', label: 'Info', icon: 'megaphone', permission: 'announcement.view' },
  { href: '/admin/cms/posts', label: 'Artikel', icon: 'newspaper', permission: 'post.view' },
  { href: '/dashboard/profile', label: 'Profil', icon: 'profile', permission: null },
] satisfies PermissionNavItem[]

const mobileNavByRole: Record<string, PermissionNavItem[]> = {
  admin_komdigi: [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard', permission: null },
    { href: '/admin/cms/settings', label: 'Landing', icon: 'settings', permission: 'cms.update' },
    { href: '/admin/cms/content-plan', label: 'Plan', icon: 'calendar', permission: 'content_plan.view' },
    { href: '/admin/cms/posts', label: 'Blog', icon: 'newspaper', permission: 'post.view' },
    { href: '/admin/cms/media', label: 'Media', icon: 'archive', permission: 'cms.view' },
  ],
  admin_sekretaris: [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard', permission: null },
    { href: '/admin/events', label: 'Kalender', icon: 'calendar', permission: 'calendar.view' },
    { href: '/admin/letters', label: 'Surat', icon: 'mail', permission: 'letter.view' },
    { href: '/admin/documents', label: 'Arsip', icon: 'archive', permission: 'letter.view' },
    { href: '/admin/management', label: 'Pengurus', icon: 'users', permission: 'user.view' },
  ],
  admin_bendahara: [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard', permission: null },
    { href: '/admin/finance', label: 'Iuran', icon: 'wallet', permission: 'finance.view' },
    { href: '/admin/finance/tokens', label: 'Token', icon: 'key', permission: 'lpj_token.manage' },
    { href: '/admin/reports', label: 'LPJ', icon: 'file', permission: 'lpj.view' },
  ],
}

function stripPermission(item: PermissionNavItem): DashboardNavItem {
  return {
    href: item.href,
    label: item.label,
    icon: item.icon,
  }
}

async function hasNavAccess(item: PermissionNavItem, user: SessionUser) {
  if (!item.permission) return true
  return can(item.permission, user)
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || !session.user.id) {
    redirect('/login')
  }

  const sessionUser = session.user as SessionUser
  const unreadCount = await notificationQueries.getUnreadCount(session.user.id)
  const initialNotifications = await notificationQueries.getUserNotifications(session.user.id, 0, 10)

  const authorizedNavGroups = await Promise.all(
    navGroups.map(async (group) => {
      const filteredItems = await Promise.all(
        group.items.map(async (item) => ((await hasNavAccess(item, sessionUser)) ? stripPermission(item) : null)),
      )

      return {
        label: group.label,
        items: filteredItems.filter(Boolean) as DashboardNavItem[],
      }
    }),
  )

  const activeNavGroups = authorizedNavGroups.filter((group) => group.items.length > 0) as DashboardNavGroup[]

  const roleMobileNavItems = mobileNavByRole[sessionUser.roleId] ?? defaultMobileNavItems
  const authorizedMobileNavItems = await Promise.all(
    roleMobileNavItems.map(async (item) => ((await hasNavAccess(item, sessionUser)) ? stripPermission(item) : null)),
  )
  const activeMobileNavItems = (authorizedMobileNavItems.filter(Boolean) as DashboardNavItem[]).slice(0, 5)

  const canManageSystem = await can('system.manage', sessionUser)
  const showMobileMenuToggle = canManageSystem
  const userName = session.user.name ?? 'Pengurus IKMI'
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    || 'IK'

  return (
    <div className="min-h-screen bg-background text-primary">
      <DashboardSidebar groups={activeNavGroups} />

      <div className="lg:pl-16 xl:pl-60">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {showMobileMenuToggle ? <DashboardMobileDrawer groups={activeNavGroups} /> : null}
              <div>
                <p className="font-heading text-base font-extrabold">Sistem Terpadu IKMI</p>
                <p className="hidden text-xs text-text-secondary sm:block">{session.user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown initialNotifications={initialNotifications} unreadCount={unreadCount} />
              <details className="relative">
                <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-surface px-2 pr-3 text-primary shadow-soft ring-1 ring-border transition hover:bg-surface-alt [&::-webkit-details-marker]:hidden">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-card font-heading text-xs font-extrabold text-surface">
                    {userInitials}
                  </span>
                  <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                  <span className="sr-only">Buka menu profil</span>
                </summary>
                <div className="absolute right-0 top-13 z-50 w-72 rounded-2xl bg-surface p-3 shadow-float ring-1 ring-border">
                  <div className="flex items-center gap-3 rounded-2xl bg-surface-alt p-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-card font-heading text-sm font-extrabold text-surface">
                      {userInitials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-sm font-extrabold text-primary">{userName}</p>
                      <p className="truncate text-xs font-medium text-text-secondary">{currentUserRoleLabel(session.user.roleId)}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Link
                      href="/dashboard/profile"
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
                    >
                      <UserCircle className="h-4 w-4 text-accent" aria-hidden="true" />
                      Profil saya
                    </Link>
                    <form
                      action={async () => {
                        'use server'
                        await signOut({ redirectTo: '/login' })
                      }}
                    >
                      <Button type="submit" variant="ghost" className="w-full justify-start rounded-xl px-3 text-danger hover:bg-danger/10">
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Keluar
                      </Button>
                    </form>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-[1200px] px-4 py-5 pb-24 md:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {!showMobileMenuToggle ? <DashboardBottomNav items={activeMobileNavItems} /> : null}
    </div>
  )
}

function currentUserRoleLabel(roleId: string | null | undefined) {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_komdigi: 'Admin Komdigi',
    admin_sekretaris: 'Admin Sekretaris',
    admin_bendahara: 'Admin Bendahara',
    user: 'Anggota',
  }

  return roleId ? labels[roleId] ?? 'Pengurus IKMI' : 'Pengurus IKMI'
}
