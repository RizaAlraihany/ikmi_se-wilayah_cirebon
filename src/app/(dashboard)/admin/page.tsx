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
  Users,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'
import { requireAuth } from '@/core/authorization/guards'
import { userQueries } from '@/features/users/queries'
import { postQueries } from '@/features/blog/queries'
import { registrationQueries } from '@/features/registration/queries'
import { financeQueries } from '@/features/finance/queries'
import { eventQueries } from '@/features/events/queries'
import { reportQueries } from '@/features/reports/queries'
import { letterQueries } from '@/features/letters/queries'
import { documentArchiveQueries } from '@/features/document-archives/queries'
import { contentPlanQueries } from '@/features/content-plan/queries'
import { getPamfletRequests } from '@/features/request-pamflet/admin-actions'
import { getKaryaTulisQueue } from '@/features/kirim-tulisan/actions'
import { ButtonLink } from '@/components/ui/button'

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
    subtitle: 'Kelola landing page, blog, media publikasi, content plan, dan kebutuhan publik website IKMI.',
  },
  admin_organization: {
    title: 'Dashboard Organisasi',
    subtitle: 'Kelola program, agenda, anggota, struktur, dokumen, dan operasional organisasi.',
  },
}

const roleGroups = {
  superAdmin: ['super_admin'],
  komdigi: ['super_admin', 'admin_komdigi'],
  organization: ['super_admin', 'admin_organization'],
}

export default async function AdminDashboardPage() {
  const actor = await requireAuth()
  const currentUser = await userQueries.getUserById(actor.id)
  const roleId = actor.roleId
  const dashboard = roleDashboards[roleId]
  const departmentLabel = currentUser?.department?.name
  const canManageSystem = roleId === 'super_admin'
  const canAccessOrganization = canManageSystem || roleId === 'admin_organization'
  const canAccessKomdigi = canManageSystem || roleId === 'admin_komdigi'

  const [users, posts, registrations, financeSummary, events, pendingReports, letters, documentArchives, contentPlanCounts] =
    await Promise.all([
      canManageSystem ? userQueries.getPaginatedUsers(1, 1) : Promise.resolve({ meta: { total: 0 } }),
      canAccessKomdigi ? postQueries.getPaginatedPosts(1, 1) : Promise.resolve({ meta: { total: 0 } }),
      canAccessOrganization ? registrationQueries.getPaginatedRegistrations(1, 1) : Promise.resolve({ meta: { total: 0 } }),
      canAccessOrganization ? financeQueries.getSummary() : Promise.resolve({ balance: 0 }),
      canAccessOrganization ? eventQueries.getEvents(undefined, 0, 10) : Promise.resolve([]),
      canAccessOrganization ? reportQueries.getPendingCount() : Promise.resolve(0),
      canAccessOrganization ? letterQueries.getLetters() : Promise.resolve([]),
      canAccessOrganization ? documentArchiveQueries.getDocuments() : Promise.resolve([]),
      canAccessKomdigi ? contentPlanQueries.getStatusCounts() : Promise.resolve([]),
    ])

  const plannedContent = contentPlanCounts.reduce(
    (total: number, item: { _count: { id: number } }) => total + item._count.id,
    0,
  )

  const [pamfletQueue, writingQueue] = roleId === 'admin_komdigi' && !canManageSystem
    ? await Promise.all([getPamfletRequests(), getKaryaTulisQueue()])
    : [[], []]

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
      roles: roleGroups.organization,
    },
    {
      key: 'balance',
      icon: WalletCards,
      label: 'Saldo Kas',
      value: `Rp ${financeSummary.balance.toLocaleString('id-ID')}`,
      trend: 'Terkini',
      roles: roleGroups.organization,
    },
    {
      key: 'reports',
      icon: FileText,
      label: 'LPJ Pending',
      value: pendingReports,
      trend: 'Review',
      roles: roleGroups.organization,
    },
    {
      key: 'letters',
      icon: Mail,
      label: 'Persuratan',
      value: letters.length,
      trend: 'Arsip',
      roles: roleGroups.organization,
    },
    {
      key: 'documents',
      icon: Archive,
      label: 'Dokumen',
      value: documentArchives.length,
      trend: 'Arsip',
      roles: roleGroups.organization,
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
    {
      key: 'content-plan',
      icon: FileText,
      label: 'Content Plan',
      value: plannedContent,
      trend: 'Mingguan',
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
        ['Content plan', plannedContent],
      ],
    },
    {
      title: 'Operasional Organisasi',
      roles: roleGroups.organization,
      items: [
        ['Pendaftar', registrations.meta.total],
        ['Surat arsip', letters.length],
        ['Dokumen', documentArchives.length],
        ['Saldo kas', `Rp ${financeSummary.balance.toLocaleString('id-ID')}`],
        ['LPJ pending', pendingReports],
      ],
    },
  ]

  const visibleSections = dashboardSections.filter((section) => section.roles.includes(roleId))
  const compactOrganizationMobile = roleId === 'admin_organization' && !canManageSystem
  const compactKomdigiMobile = roleId === 'admin_komdigi' && !canManageSystem
  const organizationQuickActions = [
    {
      title: 'Program',
      description: 'Kelola arah kerja organisasi.',
      href: '/admin/programs',
      icon: CalendarDays,
      metric: 'Kelola',
    },
    {
      title: 'Agenda',
      description: 'Atur jadwal kegiatan terdekat.',
      href: '/admin/agendas',
      icon: CalendarDays,
      metric: `${events.length} jadwal`,
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
      title: 'Dokumen',
      description: 'Buka arsip dokumen organisasi.',
      href: '/admin/documents',
      icon: Archive,
      metric: `${documentArchives.length} dokumen`,
    },
    {
      title: 'Periode',
      description: 'Atur periode dan unit organisasi.',
      href: '/admin/organization#periode',
      icon: CalendarDays,
      metric: 'Kelola',
    },
  ]
  const komdigiHeroKpis = allKpis.filter((kpi) => ['posts', 'content-plan'].includes(kpi.key))
  const organizationHeroKpis = allKpis.filter((kpi) => ['events', 'registrations', 'documents', 'reports'].includes(kpi.key))
  
  const showOrganizationMobileMenu = roleId === 'admin_organization'

  if (roleId === 'admin_komdigi' && !canManageSystem) {
    return (
      <KomdigiOverview
        userName={currentUser?.name ?? actor.name ?? 'Admin Komdigi'}
        plannedContent={plannedContent}
        pamfletQueue={pamfletQueue}
        writingQueue={writingQueue}
      />
    )
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero border-l-4 border-accent bg-primary p-5 text-white md:p-6">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/75">
              {currentUser?.role?.name ?? 'Dashboard'}
              {departmentLabel ? ` - ${departmentLabel}` : ''}
            </p>
            <div className="space-y-2">
              <h1 className="font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
                {dashboard.title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/80 md:text-base">{dashboard.subtitle}</p>
            </div>
            {compactOrganizationMobile || compactKomdigiMobile ? (
              <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/20 bg-white/20 md:hidden">
                {(compactKomdigiMobile ? komdigiHeroKpis : organizationHeroKpis).map((kpi) => (
                  <div
                    key={kpi.key}
                    className="flex min-w-0 items-center gap-3 bg-primary p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
                      <kpi.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading text-xl font-extrabold leading-none text-white">{kpi.value}</p>
                      <p className="mt-1 truncate text-[11px] font-semibold text-white/72">{kpi.label}</p>
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
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Menu Organisasi</p>
              <h2 id="organization-mobile-menu" className="font-heading text-xl font-extrabold text-primary">
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
                  className="group flex min-h-16 items-center gap-3 px-1 py-3 transition-colors hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-sm font-extrabold text-primary">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-text-secondary">{item.description}</span>
                  </span>
                  <span className="shrink-0 text-right text-xs font-bold text-accent">{item.metric}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
              <kpi.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="break-words font-heading text-2xl font-extrabold leading-tight text-primary md:text-3xl">{kpi.value}</p>
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
              <h2 className="font-heading text-lg font-bold text-primary">{section.title}</h2>
              <dl className="mt-3 divide-y divide-border">
                  {section.items.map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="flex min-h-12 items-center justify-between gap-3 py-3"
                    >
                      <dt className="min-w-0 text-sm font-medium text-text-secondary">{label}</dt>
                      <dd className="min-w-0 text-right font-heading text-lg font-extrabold text-primary">{value}</dd>
                    </div>
                  ))}
              </dl>
            </article>
          ))}
        </section>
      ) : null}

      <section className="border-t-2 border-primary pt-5">
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Tindak lanjut</p>
          <h2 className="font-heading text-xl font-bold text-primary">Pekerjaan yang perlu diperiksa</h2>
        </div>
        <div className="divide-y divide-border border-y border-border bg-surface">
              {[
                roleGroups.komdigi.includes(roleId) || canManageSystem
                  ? ['Content plan Komdigi', `${plannedContent} item terjadwal`]
                  : null,
                roleGroups.organization.includes(roleId) || canManageSystem
                  ? ['Pendaftar baru', `${registrations.meta.total} data arsip`]
                  : null,
                roleGroups.organization.includes(roleId) || canManageSystem
                  ? ['LPJ kegiatan', `${pendingReports} pending verifikasi`]
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
    </div>
  )
}

type PamfletQueue = Awaited<ReturnType<typeof getPamfletRequests>>
type WritingQueue = Awaited<ReturnType<typeof getKaryaTulisQueue>>

function KomdigiOverview({
  userName,
  plannedContent,
  pamfletQueue,
  writingQueue,
}: {
  userName: string
  plannedContent: number
  pamfletQueue: PamfletQueue
  writingQueue: WritingQueue
}) {
  const newRequests = pamfletQueue.filter((item) => item.status === 'BARU')
  const activeRequests = pamfletQueue.filter((item) => !['SELESAI', 'DITOLAK', 'DIBATALKAN'].includes(item.status))
  const reviewQueue = writingQueue.filter((item) => ['PENDING', 'REVISION', 'REVISION_REQUIRED'].includes(item.status))

  const commandCards = [
    {
      href: '/admin/request-pamflet',
      eyebrow: 'Inbox Pamflet',
      value: `${newRequests.length} Request Baru`,
      icon: Mail,
      tone: 'border-white/20 bg-white/10 hover:bg-white/20',
      iconTone: 'bg-white/10 text-white',
    },
    {
      href: '/admin/cms/content-plan',
      eyebrow: 'Content Plan',
      value: `${plannedContent} Item Terencana`,
      icon: CalendarDays,
      tone: 'border-warning/45 bg-warning/15 hover:bg-warning/25',
      iconTone: 'bg-warning/20 text-warning-surface',
    },
    {
      href: '/admin/kirim-tulisan',
      eyebrow: 'Meja Redaksi',
      value: `${reviewQueue.length} Menunggu Review`,
      icon: BookOpen,
      tone: 'border-white/10 bg-white/5 hover:bg-white/10',
      iconTone: 'border border-white/20 bg-white/5 text-white/75',
    },
  ]

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero border-l-4 border-accent bg-primary text-white">
        <div className="p-5 md:p-6">
          <div className="mb-6 border-b border-white/20 pb-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-green-300">Ruang Kerja Komdigi</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">Fokus Redaksi Hari Ini</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/78 md:text-base">
              Ada <strong className="text-white">{newRequests.length} Request Pamflet baru</strong> dan{' '}
              <strong className="text-white">{reviewQueue.length} tulisan</strong> yang perlu ditinjau, {userName}.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {commandCards.map(({ href, eyebrow, value, icon: Icon, tone, iconTone }) => (
              <Link key={href} href={href} className={`group flex min-h-24 items-center justify-between gap-4 rounded-md border p-4 text-left transition ${tone}`}>
                <span className="flex min-w-0 items-center gap-4">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${iconTone}`}>
                    <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-white/65">{eyebrow}</span>
                    <span className="mt-0.5 block font-heading text-base font-extrabold text-white">{value}</span>
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-white/45 transition-transform group-hover:translate-x-1 group-hover:text-white" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="komdigi-design-queue">
          <div className="mb-4 flex items-end justify-between border-b border-border/80 pb-3">
            <h2 id="komdigi-design-queue" className="font-heading text-lg font-extrabold text-primary">Antrean Desain</h2>
            <Link href="/admin/request-pamflet" className="inline-flex min-h-11 items-center rounded-md px-2 text-xs font-semibold text-accent hover:bg-surface-alt hover:underline">Semua Antrean</Link>
          </div>
          <div className="space-y-4">
            {activeRequests.slice(0, 3).map((request) => (
              <article key={request.id} className="glass-subtle flex flex-col justify-between gap-4 rounded-lg p-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${request.status === 'BARU' ? 'bg-info' : 'bg-warning'}`} aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{request.requestNumber}</span>
                  </div>
                  <h3 className="truncate font-heading text-base font-extrabold text-primary">{request.activityName}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{request.requesterName} · Tenggat {formatDashboardDate(request.deadline)}</p>
                </div>
                <ButtonLink href={`/admin/request-pamflet/${request.id}`} size="sm" variant={request.status === 'BARU' ? 'primary' : 'secondary'} className="shrink-0 self-start sm:self-auto">
                  {request.status === 'BARU' ? 'Tinjau Request' : 'Lihat Detail'}
                </ButtonLink>
              </article>
            ))}
            {activeRequests.length === 0 ? <KomdigiEmptyState message="Belum ada Request Pamflet yang perlu ditindaklanjuti." /> : null}
          </div>
        </section>

        <section className="lg:col-span-5" aria-labelledby="komdigi-editorial-queue">
          <div className="mb-4 flex items-end justify-between border-b border-border/80 pb-3">
            <h2 id="komdigi-editorial-queue" className="font-heading text-lg font-extrabold text-primary">Meja Redaksi</h2>
            <Link href="/admin/kirim-tulisan" className="inline-flex min-h-11 items-center rounded-md px-2 text-xs font-semibold text-accent hover:bg-surface-alt hover:underline">Semua Naskah</Link>
          </div>
          <div className="glass-subtle divide-y divide-border rounded-lg p-4">
            {reviewQueue.slice(0, 3).map((writing) => (
              <article key={writing.id} className="py-4 first:pt-0 last:pb-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{writing.status.replaceAll('_', ' ')}</p>
                <h3 className="mt-1 font-heading text-sm font-extrabold leading-snug text-primary">{writing.title}</h3>
                <p className="mt-1 text-xs text-text-secondary">{writing.category ?? 'Tulisan'} · {writing.authorName ?? 'Penulis tidak diketahui'}</p>
                <ButtonLink href="/admin/kirim-tulisan" variant="ghost" size="sm" className="mt-2 px-0 text-accent hover:bg-transparent">Mulai Review</ButtonLink>
              </article>
            ))}
            {reviewQueue.length === 0 ? <p className="py-4 text-sm text-text-secondary">Belum ada naskah yang menunggu review.</p> : null}
          </div>
        </section>
      </div>
    </div>
  )
}

function KomdigiEmptyState({ message }: { message: string }) {
  return <p className="glass-subtle rounded-lg p-4 text-sm text-text-secondary">{message}</p>
}

function formatDashboardDate(value: Date) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(value)
}
