import { requireAuth, requireRoleForUser } from '@/core/authorization/guards'
import { ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { webConfigQueries } from '@/features/web-config/queries'
import { organizationQueries } from '@/features/organization/queries'
import { AboutContentForm } from './about-content-form'
import { CabinetForm } from '../cabinet-form'

export const metadata = { title: 'CMS Tentang' }

export default async function OrganizationAboutPage() {
  const actor = await requireAuth()
  await requireRoleForUser(actor, ORGANIZATION_DASHBOARD_ROLE_IDS)
  const [initialContent, organization] = await Promise.all([
    webConfigQueries.getPublicAboutContent(),
    organizationQueries.getOverview(),
  ])
  const activePeriod = organization.periods.find((period) => period.status === 'ACTIVE') ?? null

  return (
    <div className="space-y-6">
      <div className="border-y-2 border-primary bg-surface px-1 py-6 sm:px-5">
        <p className="text-xs font-bold uppercase text-accent">Website Publik</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-balance text-primary">CMS Tentang</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-pretty text-text-secondary">Kelola narasi global halaman Tentang dan informasi kabinet pada periode aktif. Pengurus tetap bersumber dari Struktur Pengurus.</p>
      </div>
      {activePeriod ? <CabinetForm periodId={activePeriod.id} cabinet={activePeriod.cabinet} /> : <section className="border-l-2 border-warning bg-surface-alt px-4 py-3 text-sm leading-6 text-text-secondary">Belum ada periode aktif. Mulai periode dari Pengaturan sebelum mengisi kabinet.</section>}
      <AboutContentForm initialContent={initialContent} />
    </div>
  )
}
