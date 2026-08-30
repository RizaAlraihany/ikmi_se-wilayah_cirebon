'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  ArchiveIcon,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
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
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import type {
  DashboardNavIcon,
  DashboardVisibleNavGroup,
  DashboardVisibleNavItem,
} from '@/core/authorization/dashboard-navigation'
import { cn } from '@/lib/utils'

const icons: Record<DashboardNavIcon, LucideIcon> = {
  archive: ArchiveIcon,
  audit: BarChart3,
  bell: Bell,
  book: BookOpen,
  calendar: CalendarDays,
  dashboard: LayoutDashboard,
  file: FileText,
  image: ImageIcon,
  key: KeyRound,
  mail: Mail,
  megaphone: Megaphone,
  newspaper: Newspaper,
  profile: UserCircle,
  settings: Settings,
  users: Users,
  wallet: WalletCards,
}

export type DashboardNavItem = DashboardVisibleNavItem
export type DashboardNavGroup = DashboardVisibleNavGroup

function isActivePath(pathname: string, href: string) {
  const routeHref = href.split('#', 1)[0]
  if (routeHref === '/admin') return pathname === routeHref
  return pathname === routeHref || pathname.startsWith(`${routeHref}/`)
}

function DesktopNavItem({ item }: { item: DashboardNavItem }) {
  const pathname = usePathname()
  const Icon = icons[item.icon]
  const active = isActivePath(pathname, item.href)

  return (
    <Link
      href={item.href}
      prefetch={false}
      title={item.label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-[background-color,color] duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        active
          ? 'bg-surface-alt text-accent'
          : 'text-text-secondary hover:bg-surface-alt hover:text-primary',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-accent' : 'text-current')} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  )
}

function DrawerNavItem({ item, onNavigate }: { item: DashboardNavItem; onNavigate: () => void }) {
  const pathname = usePathname()
  const Icon = icons[item.icon]
  const active = isActivePath(pathname, item.href)

  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition',
        active ? 'ikmi-liquid-blue' : 'text-primary hover:bg-surface-alt',
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
      prefetch={false}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-bold transition',
        active ? 'text-primary' : 'text-primary/62 hover:bg-primary/5 hover:text-accent',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-9 items-center justify-center rounded-md transition',
          active ? 'ikmi-liquid-blue' : 'bg-transparent text-current group-hover:bg-accent/10',
        )}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="max-w-full truncate leading-none">{item.label}</span>
    </Link>
  )
}

export function DashboardSidebar({
  groups,
  workspaceLabel,
}: {
  groups: DashboardNavGroup[]
  workspaceLabel: string
}) {
  return (
    <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border text-primary shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:flex lg:flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
        <Link href="/admin" prefetch={false} className="flex min-h-11 items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary font-heading text-xs font-extrabold text-white shadow-sm" aria-hidden="true">
            IK
          </span>
          <span>
            <span className="block font-heading text-[13px] font-extrabold uppercase leading-tight tracking-wide text-primary">{workspaceLabel}</span>
            <span className="block text-[10px] text-text-muted">Workspace Admin</span>
          </span>
          <span className="sr-only">Dashboard {workspaceLabel} IKMI Cirebon</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Navigasi dashboard">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
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
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="dashboard-mobile-navigation"
        className="flex h-11 w-11 items-center justify-center rounded-md text-primary transition hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Buka menu dashboard</span>
      </button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Navigasi dashboard"
        description="Pilih area kerja yang dapat Anda akses."
        side="left"
      >
        <nav id="dashboard-mobile-navigation" className="max-h-[calc(100vh-9rem)] space-y-2 overflow-y-auto" aria-label="Navigasi dashboard">
          {groups.map((group) => (
            <div key={group.label} className="space-y-1 py-2">
              <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-text-muted">{group.label}</p>
              {group.items.map((item) => (
                <DrawerNavItem key={item.href} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          ))}
        </nav>
      </Drawer>
    </div>
  )
}

export function DashboardBottomNav({ items }: { items: DashboardNavItem[] }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface/92 px-2 pb-2 pt-1.5 shadow-float backdrop-blur-xl lg:hidden"
      aria-label="Navigasi mobile"
    >
      <div
        className="mx-auto grid max-w-md gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <BottomNavItem key={item.href} item={item} />
        ))}
      </div>
    </nav>
  )
}

const dashboardBreadcrumbs = [
  ['/admin/cms/content-plan', 'Content Plan'],
  ['/admin/request-pamflet', 'Request Pamflet'],
  ['/admin/kirim-tulisan', 'Kiriman Tulisan'],
  ['/admin/campaign', 'CMS Beranda'],
  ['/admin/cms/posts', 'Publikasi'],
  ['/admin/cms/media', 'Media'],
  ['/admin/cms/settings', 'SEO & Pengaturan'],
  ['/admin/programs', 'Program'],
  ['/admin/agendas', 'Agenda'],
  ['/admin/events', 'Kalender'],
  ['/admin/organization/registrations', 'Anggota'],
  ['/admin/organization/structure', 'Struktur'],
  ['/admin/organization', 'Periode & Unit'],
  ['/admin/documents', 'Dokumen'],
  ['/admin/users', 'Pengguna & Role'],
  ['/admin/system/audit-logs', 'Audit Log'],
  ['/admin', 'Overview'],
] as const

export function DashboardBreadcrumb({ workspaceLabel }: { workspaceLabel: string }) {
  const pathname = usePathname()
  const currentLabel = dashboardBreadcrumbs.find(([href]) => href === '/admin' ? pathname === href : pathname.startsWith(href))?.[1] ?? 'Workspace'

  return (
    <div>
      <p className="font-heading text-sm font-extrabold uppercase tracking-wide text-primary sm:hidden">{workspaceLabel}</p>
      <div className="hidden items-center gap-2 text-sm font-medium text-text-muted sm:flex">
        <span>Workspace</span>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-bold text-primary">{currentLabel}</span>
      </div>
    </div>
  )
}
