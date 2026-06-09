import { auth, signOut } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquareWarning,
  Newspaper,
  Settings,
  Users,
  WalletCards,
} from 'lucide-react'
import { notificationQueries } from '@/features/notifications/queries'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/cms/posts', label: 'Blog', icon: Newspaper },
  { href: '/admin/cms/categories', label: 'Categories', icon: BookOpen },
  { href: '/admin/cms/content-plan', label: 'Content Plan', icon: FileText },
  { href: '/admin/cms/media', label: 'Media Library', icon: CalendarDays }, // Using placeholder icon
  { href: '/admin/registrations', label: 'Registration', icon: BookOpen },
  { href: '/admin/kaderisasi', label: 'Kaderisasi', icon: Users },
  { href: '/admin/membership', label: 'Membership', icon: Users },
  { href: '/admin/finance', label: 'Finance', icon: WalletCards },
  { href: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/letters', label: 'Letters', icon: Mail },
  { href: '/admin/system/audit-logs', label: 'Audit Logs', icon: BarChart3 },
  { href: '/admin/cms/analytics', label: 'CMS Analytics', icon: BarChart3 },
  { href: '/admin/cms/settings', label: 'Web Config', icon: Settings },
]

const mobileNavItems = navItems.slice(0, 5)

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || !session.user.id) {
    redirect('/login')
  }

  const unreadCount = await notificationQueries.getUnreadCount(session.user.id)
  const initialNotifications = await notificationQueries.getUserNotifications(session.user.id, 0, 10)

  return (
    <div className="min-h-screen bg-background text-primary">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line bg-primary text-surface lg:flex lg:flex-col">
        <div className="border-b border-surface/10 px-6 py-6">
          <Link href="/admin" className="font-heading text-xl font-extrabold">
            IKMI Cirebon
          </Link>
          <p className="mt-1 text-sm text-surface/70">Enterprise dashboard</p>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-5" aria-label="Navigasi dashboard">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-surface/78 transition hover:bg-surface/10 hover:text-surface"
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
            <div>
              <p className="font-heading text-base font-extrabold">Sistem Terpadu IKMI</p>
              <p className="hidden text-xs text-muted sm:block">{session.user.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown
                initialNotifications={initialNotifications}
                unreadCount={unreadCount}
              />
              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/login' })
                }}
              >
                <Button type="submit" variant="ghost" size="icon" aria-label="Keluar">
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-[1200px] px-4 py-6 pb-24 md:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-2 py-2 lg:hidden" aria-label="Navigasi mobile">
        <div className="grid grid-cols-5 gap-1">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold text-primary/70 hover:bg-primary/5 hover:text-accent"
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
