import {
  ArrowRight,
  Archive,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  Mail,
  Megaphone,
  Newspaper,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/core/auth/auth'
import { can } from '@/core/authorization/rbac'
import type { SessionUser } from '@/core/authorization/rbac'
import { userQueries } from '@/features/users/queries'
import { postQueries } from '@/features/blog/queries'
import { registrationQueries } from '@/features/registration/queries'
import { financeQueries } from '@/features/finance/queries'
import { eventQueries } from '@/features/events/queries'
import { reportQueries } from '@/features/reports/queries'
import { letterQueries } from '@/features/letters/queries'
import { documentArchiveQueries } from '@/features/document-archives/queries'
import { contentPlanQueries } from '@/features/content-plan/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type RoleDashboard = {
  title: string
  subtitle: string
  focus: string[]
}

const roleDashboards: Record<string, RoleDashboard> = {
  super_admin: {
    title: 'Command Center Organisasi',
    subtitle: 'Pantau anggota, program aktif, kas terkini, LPJ, dan publikasi lintas modul.',
    focus: ['Overview', 'User & Role', 'LPJ Token', 'Read Access'],
  },
  admin_komdigi: {
    title: 'Dashboard Komdigi',
    subtitle: 'Kelola landing page, blog, media publikasi, content plan, dan kebutuhan publik website IKMI.',
    focus: [],
  },
  admin_sekretaris: {
    title: 'Dashboard Sekretaris',
    subtitle: 'Kelola kalender kegiatan, pengumuman, persuratan, pengurus, dan pendaftar baru.',
    focus: [],
  },
  admin_bendahara: {
    title: 'Dashboard Bendahara',
    subtitle: 'Pantau buku kas, laporan keuangan, LPJ pending, dan token submission.',
    focus: [],
  },
  user: {
    title: 'Dashboard Anggota',
    subtitle: 'Akses kalender, pengumuman, transparansi keuangan, request pamflet, dan submit LPJ token.',
    focus: ['Kalender', 'Pengumuman', 'Keuangan', 'Profil'],
  },
}

const roleGroups = {
  superAdmin: ['super_admin'],
  komdigi: ['super_admin', 'admin_komdigi'],
  sekretaris: ['super_admin', 'admin_sekretaris'],
  bendahara: ['super_admin', 'admin_bendahara'],
  user: ['super_admin', 'admin_komdigi', 'admin_sekretaris', 'admin_bendahara', 'user'],
}

export default async function AdminDashboardPage() {
  const session = await auth()
  const currentUser = session?.user.id ? await userQueries.getUserById(session.user.id) : null
  const roleId = currentUser?.roleId ?? session?.user.roleId ?? 'user'
  const dashboard = roleDashboards[roleId] ?? roleDashboards.user
  const departmentLabel = currentUser?.department?.name
  const canManageSystem = await can('system.manage', session?.user as SessionUser)

  const [users, posts, registrations, financeSummary, events, pendingReports, letters, documentArchives, contentPlanCounts] =
    await Promise.all([
      userQueries.getPaginatedUsers(1, 1),
      postQueries.getPaginatedPosts(1, 1),
      registrationQueries.getPaginatedRegistrations(1, 1),
      financeQueries.getSummary(),
      eventQueries.getEvents(undefined, 0, 10),
      reportQueries.getPendingCount(),
      letterQueries.getLetters(),
      documentArchiveQueries.getDocuments(),
      contentPlanQueries.getStatusCounts(),
    ])

  const plannedContent = contentPlanCounts.reduce(
    (total: number, item: { _count: { id: number } }) => total + item._count.id,
    0,
  )

  const allKpis = [
    {
      key: 'users',
      icon: Users,
      label: 'Anggota Aktif',
      value: users.meta.total,
      trend: 'Aktif',
      roles: roleGroups.superAdmin,
    },
    {
      key: 'events',
      icon: CheckCircle2,
      label: 'Kalender',
      value: events.length,
      trend: '7 hari ke depan',
      roles: [...roleGroups.sekretaris, ...roleGroups.user],
    },
    {
      key: 'balance',
      icon: WalletCards,
      label: 'Saldo Kas',
      value: `Rp ${financeSummary.balance.toLocaleString('id-ID')}`,
      trend: 'Terkini',
      roles: roleGroups.bendahara,
    },
    {
      key: 'reports',
      icon: FileText,
      label: 'LPJ Pending',
      value: pendingReports,
      trend: 'Review',
      roles: roleGroups.bendahara,
    },
    {
      key: 'letters',
      icon: Mail,
      label: 'Persuratan',
      value: letters.length,
      trend: 'Arsip',
      roles: roleGroups.sekretaris,
    },
    {
      key: 'documents',
      icon: Archive,
      label: 'Dokumen',
      value: documentArchives.length,
      trend: 'Arsip',
      roles: roleGroups.sekretaris,
    },
    {
      key: 'registrations',
      icon: BookOpen,
      label: 'Pendaftar',
      value: registrations.meta.total,
      trend: 'Arsip',
      roles: roleGroups.sekretaris,
    },
    {
      key: 'posts',
      icon: Newspaper,
      label: 'Artikel',
      value: posts.meta.total,
      trend: 'CMS',
      roles: roleGroups.komdigi,
    },
    {
      key: 'content-plan',
      icon: FileText,
      label: 'Content Plan',
      value: plannedContent,
      trend: 'Mingguan',
      roles: roleGroups.komdigi,
    },
  ]

  const visibleKpis = allKpis.filter((kpi) => canManageSystem || kpi.roles.includes(roleId))
  const displayKpis = visibleKpis.length > 0 ? (canManageSystem ? visibleKpis : visibleKpis.slice(0, 4)) : allKpis.slice(0, 4)
  const secretaryHeroKpis = allKpis.filter((kpi) => ['events', 'letters', 'documents'].includes(kpi.key))

  // Sections per role
  const dashboardSections = [
    {
      title: 'Komdigi',
      roles: roleGroups.komdigi,
      items: [
        ['Artikel', posts.meta.total],
        ['Content plan', plannedContent],
      ],
    },
    {
      title: 'Sekretaris',
      roles: roleGroups.sekretaris,
      items: [
        ['Pendaftar', registrations.meta.total],
        ['Surat arsip', letters.length],
        ['Dokumen', documentArchives.length],
      ],
    },
    {
      title: 'Bendahara',
      roles: roleGroups.bendahara,
      items: [
        ['Saldo kas', `Rp ${financeSummary.balance.toLocaleString('id-ID')}`],
        ['LPJ pending', pendingReports],
      ],
    },
    {
      title: 'Kegiatan',
      roles: roleGroups.user,
      items: [
        ['Kalender', events.length],
        ['Anggota aktif', users.meta.total],
      ],
    },
  ]

  const visibleSections = dashboardSections.filter(
    (section) => canManageSystem || section.roles.includes(roleId)
  )
  const compactSecretaryMobile = roleId === 'admin_sekretaris' && !canManageSystem
  const compactKomdigiMobile = roleId === 'admin_komdigi' && !canManageSystem
  const compactBendaharaMobile = roleId === 'admin_bendahara' && !canManageSystem
  const secretaryQuickActions = [
    {
      title: 'Kalender Kegiatan',
      description: 'Lihat dan kelola agenda organisasi.',
      href: '/admin/events',
      icon: CalendarDays,
      metric: `${events.length} agenda`,
    },
    {
      title: 'Persuratan',
      description: 'Arsip surat masuk dan keluar.',
      href: '/admin/letters',
      icon: Mail,
      metric: `${letters.length} surat`,
    },
    {
      title: 'Arsip Dokumen',
      description: 'Simpan dokumen internal sekretaris.',
      href: '/admin/documents',
      icon: Archive,
      metric: `${documentArchives.length} dokumen`,
    },
    {
      title: 'Pengumuman',
      description: 'Buat info dan blast WA anggota.',
      href: '/admin/announcements',
      icon: Megaphone,
      metric: 'WA blast',
    },
    {
      title: 'Pengurus',
      description: 'Rapikan struktur dan status pengurus.',
      href: '/admin/management',
      icon: Users,
      metric: 'Struktur',
    },
    {
      title: 'Anggota Baru',
      description: 'Pantau arsip pendaftar public.',
      href: '/admin/registrations',
      icon: BookOpen,
      metric: `${registrations.meta.total} data`,
    },
  ]
  const komdigiQuickActions = [
    {
      title: 'CMS Landing Page',
      description: 'Hero, tentang, CTA, SEO, kontak, dan section publik.',
      href: '/admin/cms/settings',
      icon: Megaphone,
      metric: 'Full CMS',
    },
    {
      title: 'Content Plan',
      description: 'Kalender publikasi Komdigi per bulan.',
      href: '/admin/cms/content-plan',
      icon: CalendarDays,
      metric: `${plannedContent} plan`,
    },
    {
      title: 'Blog & Berita Acara',
      description: 'Draft, edit, dan publish artikel website.',
      href: '/admin/cms/posts',
      icon: Newspaper,
      metric: `${posts.meta.total} artikel`,
    },
    {
      title: 'Kategori',
      description: 'Kelola kategori blog dan berita acara.',
      href: '/admin/cms/categories',
      icon: BookOpen,
      metric: 'Taxonomy',
    },
    {
      title: 'Media Library',
      description: 'Upload aset gambar untuk landing dan artikel.',
      href: '/admin/cms/media',
      icon: Archive,
      metric: 'Cloudinary',
    },
    {
      title: 'Preview Publik',
      description: 'Cek tampilan landing, struktur, tentang, dan blog.',
      href: '/',
      icon: ArrowRight,
      metric: 'Website',
    },
  ]
  
  const bendaharaQuickActions = [
    {
      title: 'Iuran & Laporan',
      description: 'Kelola pemasukan iuran dan laporan keuangan.',
      href: '/admin/finance',
      icon: WalletCards,
      metric: 'Finance',
    },
    {
      title: 'LPJ Token',
      description: 'Generate token submit LPJ.',
      href: '/admin/finance/tokens',
      icon: Archive,
      metric: 'Token',
    },
    {
      title: 'Review LPJ',
      description: 'Verifikasi arsip LPJ yang masuk.',
      href: '/admin/reports',
      icon: FileText,
      metric: `${pendingReports} pending`,
    },
  ]

  const komdigiHeroKpis = allKpis.filter((kpi) => ['posts', 'content-plan'].includes(kpi.key))
  const bendaharaHeroKpis = allKpis.filter((kpi) => ['balance', 'reports'].includes(kpi.key))
  
  const showSecretaryMobileMenu = canManageSystem || roleId === 'admin_sekretaris'
  const showKomdigiMobileMenu = canManageSystem || roleId === 'admin_komdigi'
  const showBendaharaMobileMenu = canManageSystem || roleId === 'admin_bendahara'

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <section className="rounded-2xl bg-gradient-card p-5 text-surface shadow-card md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge tone="surface" className="w-fit">
              {currentUser?.role?.name ?? 'Dashboard'}
              {departmentLabel ? ` - ${departmentLabel}` : ''}
            </Badge>
            <div className="space-y-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                {dashboard.title}
              </h1>
              <p className="text-sm leading-7 text-surface/78 md:text-base">{dashboard.subtitle}</p>
            </div>
            {compactSecretaryMobile || compactKomdigiMobile || compactBendaharaMobile ? (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-1 md:hidden">
                {(compactBendaharaMobile ? bendaharaHeroKpis : compactKomdigiMobile ? komdigiHeroKpis : secretaryHeroKpis).map((kpi) => (
                  <div
                    key={kpi.key}
                    className="flex flex-1 min-w-[8.5rem] items-center gap-3 rounded-2xl bg-surface/12 p-3 ring-1 ring-surface/15"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-primary">
                      <kpi.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading text-xl font-extrabold leading-none text-surface">{kpi.value}</p>
                      <p className="mt-1 truncate text-[11px] font-semibold text-surface/78">{kpi.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {dashboard.focus.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {dashboard.focus.map((item) => (
                <span key={item} className="rounded-full bg-surface/10 px-3 py-1 text-xs font-semibold">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {showSecretaryMobileMenu ? (
        <section className="space-y-3 lg:hidden" aria-labelledby="sekretaris-mobile-menu">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Menu Sekretaris</p>
              <h2 id="sekretaris-mobile-menu" className="font-heading text-xl font-extrabold text-primary">
                Akses cepat harian
              </h2>
            </div>
            <Badge tone="surface">Mobile</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {secretaryQuickActions.map((item, index) => {
              const Icon = item.icon
              const featured = index === 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    featured
                      ? 'group rounded-2xl bg-gradient-card p-4 text-surface shadow-card ring-1 ring-primary/10 transition active:scale-[0.99]'
                      : 'group rounded-2xl bg-surface p-4 shadow-card ring-1 ring-border transition active:scale-[0.99]'
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={
                        featured
                          ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-surface/14 text-surface ring-1 ring-surface/16'
                          : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary'
                      }
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <ArrowRight
                      className={
                        featured
                          ? 'h-4 w-4 text-surface/70 transition group-hover:translate-x-0.5'
                          : 'h-4 w-4 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-accent'
                      }
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className={featured ? 'font-heading text-base font-extrabold text-surface' : 'font-heading text-sm font-extrabold text-primary'}>
                      {item.title}
                    </p>
                    <p className={featured ? 'text-xs leading-5 text-surface/72' : 'line-clamp-2 text-xs leading-5 text-text-secondary'}>
                      {item.description}
                    </p>
                    <p className={featured ? 'text-xs font-bold text-surface/86' : 'text-xs font-bold text-accent'}>
                      {item.metric}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {showKomdigiMobileMenu ? (
        <section className="space-y-3 lg:hidden" aria-labelledby="komdigi-mobile-menu">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Menu Komdigi</p>
              <h2 id="komdigi-mobile-menu" className="font-heading text-xl font-extrabold text-primary">
                Akses cepat publikasi
              </h2>
            </div>
            <Badge tone="surface">Mobile</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {komdigiQuickActions.map((item, index) => {
              const Icon = item.icon
              const featured = index === 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    featured
                      ? 'group rounded-2xl bg-gradient-card p-4 text-surface shadow-card ring-1 ring-primary/10 transition active:scale-[0.99]'
                      : 'group rounded-2xl bg-surface p-4 shadow-card ring-1 ring-border transition active:scale-[0.99]'
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={
                        featured
                          ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-surface/14 text-surface ring-1 ring-surface/16'
                          : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary'
                      }
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <ArrowRight
                      className={
                        featured
                          ? 'h-4 w-4 text-surface/70 transition group-hover:translate-x-0.5'
                          : 'h-4 w-4 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-accent'
                      }
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className={featured ? 'font-heading text-base font-extrabold text-surface' : 'font-heading text-sm font-extrabold text-primary'}>
                      {item.title}
                    </p>
                    <p className={featured ? 'text-xs leading-5 text-surface/72' : 'line-clamp-2 text-xs leading-5 text-text-secondary'}>
                      {item.description}
                    </p>
                    <p className={featured ? 'text-xs font-bold text-surface/86' : 'text-xs font-bold text-accent'}>
                      {item.metric}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {showBendaharaMobileMenu ? (
        <section className="space-y-3 lg:hidden" aria-labelledby="bendahara-mobile-menu">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Menu Bendahara</p>
              <h2 id="bendahara-mobile-menu" className="font-heading text-xl font-extrabold text-primary">
                Akses cepat keuangan
              </h2>
            </div>
            <Badge tone="surface">Mobile</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {bendaharaQuickActions.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-xl flex flex-col justify-between bg-surface p-3 shadow-card ring-1 ring-border transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-1 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/8 text-primary">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <ArrowRight
                      className="h-3 w-3 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-heading text-xs font-extrabold text-primary leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[10px] font-bold text-accent">
                      {item.metric}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* KPI Cards */}
      <section className={compactSecretaryMobile || compactKomdigiMobile || compactBendaharaMobile ? 'hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4'}>
        {displayKpis.map((kpi) => (
          <Card key={kpi.key} className="overflow-hidden">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-card text-surface">
                  <kpi.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <Badge tone="success">
                  <TrendingUp className="mr-1 h-3 w-3" aria-hidden="true" />
                  {kpi.trend}
                </Badge>
              </div>
              <div className="min-w-0">
                <p className="break-words font-heading text-2xl font-extrabold leading-tight text-primary md:text-3xl">
                  {kpi.value}
                </p>
                <p className="text-sm font-medium text-text-secondary">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Sections per role */}
      {visibleSections.length > 0 ? (
        <section
          className={
            compactSecretaryMobile || compactKomdigiMobile || compactBendaharaMobile
              ? 'hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4'
              : 'grid gap-4 md:grid-cols-2 xl:grid-cols-4'
          }
        >
          {visibleSections.map((section) => (
            <Card key={section.title}>
              <CardContent className="space-y-4 p-5">
                <h2 className="font-heading text-lg font-bold text-primary">{section.title}</h2>
                <div className="space-y-3">
                  {section.items.map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface-alt px-4 py-3"
                    >
                      <span className="min-w-0 text-sm font-medium text-text-secondary">{label}</span>
                      <span className="min-w-0 text-right font-heading text-lg font-extrabold text-primary">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {/* Ruang tindak lanjut */}
      <section>
        <Card>
          <CardContent className="p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-primary">Ruang Tindak Lanjut</h2>
                <p className="text-sm text-text-secondary">Pekerjaan yang perlu perhatian sesuai role aktif.</p>
              </div>
              <Badge tone="warning">Live</Badge>
            </div>
            <div className="space-y-3">
              {[
                roleGroups.komdigi.includes(roleId) || canManageSystem
                  ? ['Content plan Komdigi', `${plannedContent} item terjadwal`]
                  : null,
                roleGroups.sekretaris.includes(roleId) || canManageSystem
                  ? ['Pendaftar baru', `${registrations.meta.total} data arsip`]
                  : null,
                roleGroups.bendahara.includes(roleId) || canManageSystem
                  ? ['LPJ kegiatan', `${pendingReports} pending verifikasi`]
                  : null,
              ]
                .filter(Boolean)
                .map((item) => {
                  const [title, description] = item as [string, string]
                  return (
                    <div
                      key={title}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-surface-alt p-4"
                    >
                      <div>
                        <p className="font-semibold text-primary">{title}</p>
                        <p className="text-sm text-text-secondary">{description}</p>
                      </div>
                      <Badge tone="surface">Review</Badge>
                    </div>
                  )
                })}
              {[
                roleGroups.komdigi.includes(roleId) || canManageSystem,
                roleGroups.sekretaris.includes(roleId) || canManageSystem,
                roleGroups.bendahara.includes(roleId) || canManageSystem,
              ].every((v) => !v) ? (
                <div className="flex items-center gap-3 rounded-2xl bg-surface-alt p-4">
                  <Megaphone className="h-5 w-5 text-accent" aria-hidden="true" />
                  <p className="text-sm font-semibold text-primary">
                    Gunakan navigasi untuk mengakses fitur sesuai role Anda.
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
