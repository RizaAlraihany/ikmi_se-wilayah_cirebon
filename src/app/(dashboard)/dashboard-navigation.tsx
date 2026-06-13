'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArchiveIcon,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  FileText,
  KeyRound,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  Newspaper,
  Settings,
  UserCircle,
  Users,
  WalletCards,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const icons = {
  archive: ArchiveIcon,
  audit: BarChart3,
  bell: Bell,
  book: BookOpen,
  calendar: CalendarDays,
  dashboard: LayoutDashboard,
  file: FileText,
  key: KeyRound,
  mail: Mail,
  megaphone: Megaphone,
  newspaper: Newspaper,
  profile: UserCircle,
  settings: Settings,
  users: Users,
  wallet: WalletCards,
}

export type DashboardNavItem = {
  href: string
  label: string
  icon: keyof typeof icons
}

export type DashboardNavGroup = {
  label: string
  items: DashboardNavItem[]
}

function isActivePath(pathname: string, href: string) {
  if (href === '/admin') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function DesktopNavItem({ item }: { item: DashboardNavItem }) {
  const pathname = usePathname()
  const Icon = icons[item.icon]
  const active = isActivePath(pathname, item.href)

  return (
    <Link
      href={item.href}
      title={item.label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition xl:justify-start',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface',
        active
          ? 'bg-surface text-primary shadow-soft'
          : 'text-surface/76 hover:bg-surface/10 hover:text-surface',
      )}
    >
      <span
        className={cn(
          'absolute left-0 hidden h-6 w-1 rounded-r-full bg-accent xl:block',
          active ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden="true"
      />
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-accent' : 'text-current')} aria-hidden="true" />
      <span className="hidden xl:inline">{item.label}</span>
    </Link>
  )
}

function DrawerNavItem({ item }: { item: DashboardNavItem }) {
  const pathname = usePathname()
  const Icon = icons[item.icon]
  const active = isActivePath(pathname, item.href)

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition',
        active ? 'bg-primary text-surface shadow-card' : 'text-primary hover:bg-surface-alt',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {item.label}
    </Link>
  )
}

function BottomNavItem({ item }: { item: DashboardNavItem }) {
  const pathname = usePathname()
  const Icon = icons[item.icon]
  const active = isActivePath(pathname, item.href)

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition',
        active ? 'bg-primary text-surface shadow-card' : 'text-primary/70 hover:bg-primary/5 hover:text-accent',
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  )
}

export function DashboardSidebar({ groups }: { groups: DashboardNavGroup[] }) {
  return (
    <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-30 hidden w-16 border-r border-surface/10 text-surface lg:flex lg:flex-col xl:w-60">
      <div className="flex min-h-20 flex-col items-center justify-center border-b border-surface/10 px-3 py-5 xl:items-start xl:px-6">
        <Link href="/admin" className="text-center font-heading text-xl font-extrabold xl:text-left">
          <span className="xl:hidden" aria-hidden="true">
            IK
          </span>
          <span className="hidden xl:inline">IKMI Cirebon</span>
          <span className="sr-only">IKMI Cirebon Dashboard</span>
        </Link>
        <div className="hidden xl:block">
          <p className="mt-1 text-sm text-surface/70">Dashboard internal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-5 xl:px-3" aria-label="Navigasi dashboard">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="hidden px-3 text-[11px] font-bold uppercase tracking-widest text-surface/48 xl:block">
              {group.label}
            </p>
            {group.items.map((item) => (
              <DesktopNavItem key={item.href} item={item} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export function DashboardMobileDrawer({ groups }: { groups: DashboardNavGroup[] }) {
  return (
    <details className="relative lg:hidden">
      <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full text-primary hover:bg-primary/5 [&::-webkit-details-marker]:hidden">
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Buka menu dashboard</span>
      </summary>
      <div className="absolute left-0 top-13 z-50 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl bg-surface p-3 shadow-card ring-1 ring-border">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1 py-2">
            <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-text-muted">{group.label}</p>
            {group.items.map((item) => (
              <DrawerNavItem key={item.href} item={item} />
            ))}
          </div>
        ))}
      </div>
    </details>
  )
}

export function DashboardBottomNav({ items }: { items: DashboardNavItem[] }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface-glass px-2 py-2 shadow-soft backdrop-blur-xl lg:hidden"
      aria-label="Navigasi mobile"
    >
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <BottomNavItem key={item.href} item={item} />
        ))}
      </div>
    </nav>
  )
}
