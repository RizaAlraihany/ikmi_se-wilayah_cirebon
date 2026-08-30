import { contentPlanQueries } from '@/features/content-plan/queries'
import { KomdigiPageHeader, KomdigiPanel } from '../../_components/komdigi-page-header'
import { ContentPlanCalendar } from './components/ContentPlanCalendar'
import { ContentPlanFilters } from './components/ContentPlanFilters'

export const metadata = { title: 'Content Plan' }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ContentPlanPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams
  const workspace = await contentPlanQueries.getWorkspace({
    month: first(raw.month),
    platform: first(raw.platform),
    contentType: first(raw.contentType),
    authorId: first(raw.authorId),
    status: first(raw.status),
    programId: first(raw.programId),
    agendaId: first(raw.agendaId),
  })

  return (
    <div className="space-y-6">
      <KomdigiPageHeader
        title="Content Plan"
        description="Kalender utama produksi konten Komdigi: jadwal, PIC, platform, status, aset, dan tautan publikasi."
        action={<ContentPlanFilters month={workspace.filters.month} authors={workspace.authors} programs={workspace.programs} agendas={workspace.agendas} />}
      />

      <KomdigiPanel className="overflow-hidden">
        <ContentPlanCalendar
          month={workspace.filters.month}
          plans={workspace.plans}
          authors={workspace.authors}
          programs={workspace.programs}
          agendas={workspace.agendas}
        />
      </KomdigiPanel>
    </div>
  )
}
