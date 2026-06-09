import {
  BookOpen,
  CheckCircle2,
  FileText,
  MessageSquareWarning,
  Newspaper,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { userQueries } from '@/features/users/queries'
import { postQueries } from '@/features/blog/queries'
import { registrationQueries } from '@/features/registration/queries'
import { financeQueries } from '@/features/finance/queries'
import { complaintQueries } from '@/features/complaints/queries'
import { eventQueries } from '@/features/events/queries'
import { reportQueries } from '@/features/reports/queries'
import { letterQueries } from '@/features/letters/queries'
import { programQueries } from '@/features/programs/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Mail, CalendarDays } from 'lucide-react'

type RoleDashboard = {
  title: string
  subtitle: string
  focus: string[]
}

const roleDashboards: Record<string, RoleDashboard> = {
  super_admin: {
    title: 'Command Center Organisasi',
    subtitle: 'Pantau seluruh modul, approval, publikasi, dan operasional lintas departemen.',
    focus: ['Semua widget', 'Governance', 'Audit readiness'],
  },
  bph_sekum: {
    title: 'Dashboard Ketua/Sekum',
    subtitle: 'Fokus pada KPI strategis, administrasi organisasi, LPJ, dan approval operasional.',
    focus: ['Strategic KPI', 'Approval center', 'LPJ'],
  },
  bph_bendum: {
    title: 'Dashboard Bendahara',
    subtitle: 'Prioritaskan approval dana, cashflow, dan status pencairan organisasi.',
    focus: ['Finance approval', 'Cashflow', 'Audit keuangan'],
  },
  kadep_komdigi: {
    title: 'Dashboard Komdigi',
    subtitle: 'Pantau publikasi, draft artikel, agenda, dan kesiapan kanal digital IKMI.',
    focus: ['Blog analytics', 'Agenda', 'Web config'],
  },
  staff_komdigi: {
    title: 'Dashboard Komdigi',
    subtitle: 'Kelola draft artikel, publikasi, dan kalender konten organisasi.',
    focus: ['Draft artikel', 'Publikasi', 'Agenda'],
  },
  kadep_kaderisasi: {
    title: 'Dashboard Kaderisasi',
    subtitle: 'Pantau pendaftaran, statistik anggota, dan tindak lanjut calon kader.',
    focus: ['Registration', 'Member stats', 'Follow up'],
  },
  staff_kaderisasi: {
    title: 'Dashboard Kaderisasi',
    subtitle: 'Kelola data pendaftar dan progres kaderisasi yang masuk.',
    focus: ['Registration', 'Member stats', 'Follow up'],
  },
  kadep_advokasi: {
    title: 'Dashboard Advokasi',
    subtitle: 'Pantau aduan baru, tindak lanjut, dan penyelesaian isu mahasiswa.',
    focus: ['Aduan baru', 'Tracking aduan', 'Resolution'],
  },
  staff_advokasi: {
    title: 'Dashboard Advokasi',
    subtitle: 'Tindak lanjuti aduan mahasiswa secara rapi dan terukur.',
    focus: ['Aduan baru', 'Tracking aduan', 'Resolution'],
  },
}

export default async function AdminDashboardPage() {
  const session = await auth()
  const currentUser = session?.user.id ? await userQueries.getUserById(session.user.id) : null
  const roleId = currentUser?.roleId ?? session?.user.roleId ?? 'staff_komdigi'
  const dashboard = roleDashboards[roleId] ?? roleDashboards.staff_komdigi

  const [users, posts, registrations, financeRequests, complaints, events, reports, letters, programs] = await Promise.all([
    userQueries.getPaginatedUsers(1, 1),
    postQueries.getPaginatedPosts(1, 1),
    registrationQueries.getPaginatedRegistrations(1, 1),
    financeQueries.getRequests(undefined, 0, 10),
    complaintQueries.getUnreadCount(),
    eventQueries.getEvents(undefined, 0, 10),
    reportQueries.getReports(undefined, 0, 10),
    letterQueries.getLetters(),
    programQueries.getPrograms(),
  ])

  const allKpis = [
    { key: 'users', icon: Users, label: 'Anggota Aktif', value: users.meta.total, trend: '+12%', roles: ['super_admin', 'bph_sekum', 'kadep_kaderisasi', 'staff_kaderisasi'] },
    { key: 'programs', icon: CalendarDays, label: 'Program', value: programs.length, trend: 'Aktif', roles: ['super_admin', 'bph_sekum'] },
    { key: 'events', icon: CheckCircle2, label: 'Agenda', value: events.length, trend: '+6%', roles: ['super_admin', 'bph_sekum', 'kadep_komdigi', 'staff_komdigi'] },
    { key: 'finance', icon: WalletCards, label: 'Approval Dana', value: financeRequests.length, trend: 'Prioritas', roles: ['super_admin', 'bph_bendum'] },
    { key: 'reports', icon: FileText, label: 'LPJ', value: reports.length, trend: 'Review', roles: ['super_admin', 'bph_sekum'] },
    { key: 'letters', icon: Mail, label: 'Persuratan', value: letters.length, trend: 'Arsip', roles: ['super_admin', 'bph_sekum'] },
    { key: 'registrations', icon: BookOpen, label: 'Pendaftar', value: registrations.meta.total, trend: '+18%', roles: ['super_admin', 'kadep_kaderisasi', 'staff_kaderisasi'] },
    { key: 'complaints', icon: MessageSquareWarning, label: 'Aduan Baru', value: complaints, trend: 'Butuh respons', roles: ['super_admin', 'kadep_advokasi', 'staff_advokasi'] },
    { key: 'posts', icon: Newspaper, label: 'Publikasi', value: posts.meta.total, trend: '+8%', roles: ['super_admin', 'kadep_komdigi', 'staff_komdigi'] },
  ]

  const visibleKpis = allKpis.filter((kpi) => roleId === 'super_admin' || kpi.roles.includes(roleId))
  const displayKpis = visibleKpis.length > 0 ? visibleKpis : allKpis.slice(0, 4)

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] bg-primary p-6 text-surface shadow-elevated md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge tone="surface" className="w-fit">
              {currentUser?.role?.name ?? 'Dashboard'}
            </Badge>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-extrabold md:text-4xl">{dashboard.title}</h1>
              <p className="text-surface/78">{dashboard.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {dashboard.focus.map((item) => (
              <span key={item} className="rounded-full bg-surface/10 px-3 py-1 text-xs font-semibold">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {displayKpis.map((kpi) => (
          <Card key={kpi.key}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <kpi.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <Badge tone="success">
                  <TrendingUp className="mr-1 h-3 w-3" aria-hidden="true" />
                  {kpi.trend}
                </Badge>
              </div>
              <div>
                <p className="font-heading text-3xl font-extrabold text-primary">{kpi.value}</p>
                <p className="text-sm font-medium text-muted">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-primary">Approval Center</h2>
                <p className="text-sm text-muted">Pekerjaan yang perlu perhatian pengurus.</p>
              </div>
              <Badge tone="warning">Live</Badge>
            </div>
            <div className="space-y-3">
              {[
                ['Finance request', `${financeRequests.length} item menunggu review`],
                ['LPJ kegiatan', `${reports.length} dokumen aktif`],
                ['Persuratan', `${letters.length} arsip surat`],
              ].map(([title, description]) => (
                <div key={title} className="flex items-center justify-between rounded-2xl bg-background p-4">
                  <div>
                    <p className="font-semibold text-primary">{title}</p>
                    <p className="text-sm text-muted">{description}</p>
                  </div>
                  <Badge tone="surface">Review</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={CheckCircle2}
              title="Ruang kerja terkendali"
              description="Gunakan navigasi modul untuk melihat detail, memfilter data, dan menindaklanjuti pekerjaan sesuai role."
              actionHref="/admin/notifications"
              actionLabel="Lihat notifikasi"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
