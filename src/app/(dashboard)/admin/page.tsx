import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Megaphone,
  Newspaper,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { requireAuth } from '@/core/authorization/guards'
import { userQueries } from '@/features/users/queries'
import { postQueries } from '@/features/blog/queries'
import { registrationQueries } from '@/features/registration/queries'
import { logger } from '@/core/monitoring/logger'
import { OverviewActivityChart } from './overview-activity-chart'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RoleDashboard = {
  title: string
  subtitle: string
}

const roleDashboards: Record<string, RoleDashboard> = {
  super_admin: {
    title: 'Ringkasan Sistem IKMI',
    subtitle: 'Pantau layanan organisasi dan Komdigi dari satu ruang kerja terotorisasi.',
  },
  admin_komdigi: {
    title: 'Dashboard Komdigi',
    subtitle: 'Kelola konten Beranda, publikasi, media, dan naskah untuk website publik IKMI.',
  },
  admin_organization: {
    title: 'Dashboard Organisasi',
    subtitle: 'Kelola agenda, pendaftaran, struktur, profil organisasi, dan informasi kontak publik.',
  },
}

const roleGroups = {
  superAdmin: ['super_admin'],
  komdigi: ['super_admin', 'admin_komdigi'],
  organization: ['super_admin', 'admin_organization'],
}

export default async function AdminDashboardPage() {
  try {
    return await renderAdminDashboardPage()
  } catch (error) {
    logger.error(error, { scope: 'dashboard.admin', phase: 'render' })
    throw error
  }
}

async function renderAdminDashboardPage() {
  const actor = await requireAuth()
  const currentUser = await userQueries.getUserById(actor.id)
  const roleId = actor.roleId
  const dashboard = roleDashboards[roleId]
  const departmentLabel = currentUser?.department?.name
  const canManageSystem = roleId === 'super_admin'
  const canAccessOrganization = canManageSystem || roleId === 'admin_organization'
  const canAccessKomdigi = canManageSystem || roleId === 'admin_komdigi'

  const [users, posts, registrations, postAnalytics, registrationAnalytics] = await Promise.all([
    canManageSystem ? userQueries.getPaginatedUsers(1, 1) : Promise.resolve({ meta: { total: 0 } }),
    canAccessKomdigi ? postQueries.getPaginatedPosts(1, 1) : Promise.resolve({ meta: { total: 0 } }),
    canAccessOrganization ? registrationQueries.getPaginatedRegistrations(1, 1) : Promise.resolve({ meta: { total: 0 } }),
    canAccessKomdigi ? postQueries.getAnalytics() : Promise.resolve(null),
    canAccessOrganization ? registrationQueries.getAnalytics() : Promise.resolve(null),
  ])

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
      key: 'registrations',
      icon: BookOpen,
      label: 'Pendaftar',
      value: registrations.meta.total,
      trend: 'Arsip',
      roles: roleGroups.organization,
    },
    {
      key: 'posts',
      icon: Newspaper,
      label: 'Artikel',
      value: posts.meta.total,
      trend: 'CMS',
      roles: roleGroups.komdigi,
    },
  ]

  const visibleKpis = allKpis.filter((kpi) => kpi.roles.includes(roleId))
  const displayKpis = canManageSystem ? visibleKpis : visibleKpis.slice(0, 4)
  // Sections per role
  const dashboardSections = [
    {
      title: 'Komdigi',
      roles: roleGroups.komdigi,
      items: [
        ['Artikel', posts.meta.total],
      ],
    },
    {
      title: 'Operasional Organisasi',
      roles: roleGroups.organization,
      items: [
        ['Pendaftar', registrations.meta.total],
      ],
    },
  ]

  const visibleSections = dashboardSections.filter((section) => section.roles.includes(roleId))
  const compactOrganizationMobile = roleId === 'admin_organization' && !canManageSystem
  const compactKomdigiMobile = roleId === 'admin_komdigi' && !canManageSystem
  const organizationQuickActions = [
    {
      title: 'Agenda',
      description: 'Atur jadwal kegiatan terdekat.',
      href: '/admin/agendas',
      icon: CalendarDays,
      metric: 'Kelola',
    },
    {
      title: 'Anggota',
      description: 'Tinjau pendaftaran keanggotaan.',
      href: '/admin/organization/registrations',
      icon: BookOpen,
      metric: `${registrations.meta.total} data`,
    },
    {
      title: 'Struktur',
      description: 'Kelola penugasan pengurus aktif.',
      href: '/admin/organization/structure',
      icon: Users,
      metric: 'Kelola',
    },
    {
      title: 'Tentang',
      description: 'Perbarui riwayat organisasi untuk halaman publik.',
      href: '/admin/organization/about',
      icon: BookOpen,
      metric: 'Kelola',
    },
    {
      title: 'Kontak',
      description: 'Perbarui informasi kontak untuk publik dan footer.',
      href: '/admin/cms/settings',
      icon: Users,
      metric: 'Kelola',
    },
  ]
  const komdigiHeroKpis = allKpis.filter((kpi) => kpi.key === 'posts')
  const organizationHeroKpis = allKpis.filter((kpi) => kpi.key === 'registrations')
  
  const showOrganizationMobileMenu = roleId === 'admin_organization'

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero border-y-2 border-primary bg-surface p-5 md:p-6">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-extrabold uppercase text-accent">
              {currentUser?.role?.name ?? 'Dashboard'}
              {departmentLabel ? ` - ${departmentLabel}` : ''}
            </p>
            <div className="space-y-2">
              <h1 className="font-heading text-2xl font-bold leading-tight text-balance text-primary sm:text-3xl">
                {dashboard.title}
              </h1>
              <p className="dashboard-hero-subtitle max-w-2xl text-sm leading-7 text-pretty md:text-base">{dashboard.subtitle}</p>
            </div>
            {compactOrganizationMobile || compactKomdigiMobile ? (
              <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border md:hidden">
                {(compactKomdigiMobile ? komdigiHeroKpis : organizationHeroKpis).map((kpi) => (
                  <div
                    key={kpi.key}
                    className="flex min-w-0 items-center gap-3 bg-surface p-3"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
                      <kpi.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading text-xl font-extrabold leading-none tabular-nums text-primary">{kpi.value}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-text-secondary">{kpi.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {showOrganizationMobileMenu ? (
        <section className="space-y-3 lg:hidden" aria-labelledby="organization-mobile-menu">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-accent">Menu Organisasi</p>
              <h2 id="organization-mobile-menu" className="font-heading text-xl font-extrabold text-balance text-primary">
                Akses cepat harian
              </h2>
            </div>
          </div>
          <div className="divide-y divide-border border-y border-border bg-surface">
            {organizationQuickActions.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-16 items-center gap-3 px-1 py-3 hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-sm font-extrabold text-primary">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-text-secondary">{item.description}</span>
                  </span>
                  <span className="shrink-0 text-right text-xs font-bold text-accent">{item.metric}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-text-muted group-hover:text-accent" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      <section
        aria-label="Ringkasan data"
        className={compactOrganizationMobile || compactKomdigiMobile
          ? 'hidden border-y border-border bg-surface sm:grid sm:grid-cols-2 xl:grid-cols-3'
          : 'grid border-y border-border bg-surface sm:grid-cols-2 xl:grid-cols-3'}
      >
        {displayKpis.map((kpi) => (
          <article key={kpi.key} className="flex min-h-28 items-center gap-4 border-b border-border p-5 sm:border-r xl:[&:nth-child(3n)]:border-r-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
              <kpi.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="break-words font-heading text-2xl font-extrabold leading-tight tabular-nums text-primary md:text-3xl">{kpi.value}</p>
              <p className="text-sm font-semibold text-text-secondary">{kpi.label}</p>
              <p className="mt-1 text-xs text-text-muted">{kpi.trend}</p>
            </div>
          </article>
        ))}
      </section>

      {visibleSections.length > 0 ? (
        <section
          className={
            compactOrganizationMobile || compactKomdigiMobile
              ? 'hidden gap-8 md:grid md:grid-cols-2'
              : 'grid gap-8 md:grid-cols-2'
          }
        >
          {visibleSections.map((section) => (
            <article key={section.title} className="border-l-2 border-primary bg-surface px-5 py-4">
              <h2 className="font-heading text-lg font-bold text-balance text-primary">{section.title}</h2>
              <dl className="mt-3 divide-y divide-border">
                  {section.items.map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="flex min-h-12 items-center justify-between gap-3 py-3"
                    >
                      <dt className="min-w-0 text-sm font-medium text-text-secondary">{label}</dt>
                      <dd className="min-w-0 text-right font-heading text-lg font-extrabold tabular-nums text-primary">{value}</dd>
                    </div>
                  ))}
              </dl>
            </article>
          ))}
        </section>
      ) : null}

      <section className="border-t-2 border-primary pt-5">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase text-accent">Tindak lanjut</p>
          <h2 className="font-heading text-xl font-bold text-balance text-primary">Pekerjaan yang perlu diperiksa</h2>
        </div>
        <div className="divide-y divide-border border-y border-border bg-surface">
              {[
                roleGroups.komdigi.includes(roleId) || canManageSystem
                  ? ['Publikasi', `${posts.meta.total} artikel tersedia`]
                  : null,
                roleGroups.organization.includes(roleId) || canManageSystem
                  ? ['Pendaftar baru', `${registrations.meta.total} data arsip`]
                  : null,
              ]
                .filter(Boolean)
                .map((item) => {
                  const [title, description] = item as [string, string]
                  return (
                    <div
                      key={title}
                      className="flex min-h-16 items-center justify-between gap-3 px-1 py-3"
                    >
                      <div>
                        <p className="font-semibold text-primary">{title}</p>
                        <p className="text-sm text-text-secondary">{description}</p>
                      </div>
                      <span className="text-xs font-bold text-accent">Periksa</span>
                    </div>
                  )
                })}
              {[
                roleGroups.komdigi.includes(roleId) || canManageSystem,
                roleGroups.organization.includes(roleId) || canManageSystem,
              ].every((v) => !v) ? (
                <div className="flex min-h-16 items-center gap-3 px-1 py-3">
                  <Megaphone className="h-5 w-5 text-accent" aria-hidden="true" />
                  <p className="text-sm font-semibold text-primary">
                    Gunakan navigasi untuk mengakses fitur sesuai role Anda.
                  </p>
                </div>
              ) : null}
        </div>
      </section>

      <OverviewActivityChart
        series={[
          ...(postAnalytics ? [{ label: 'Publikasi', tone: 'primary' as const, points: postAnalytics.monthly.slice(-6) }] : []),
          ...(registrationAnalytics ? [{ label: 'Pendaftar', tone: 'accent' as const, points: registrationAnalytics.slice(-6) }] : []),
        ]}
      />
    </div>
  )
}
