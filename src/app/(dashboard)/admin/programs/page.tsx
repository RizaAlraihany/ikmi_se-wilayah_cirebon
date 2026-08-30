import Link from 'next/link'
import { FolderKanban, Plus } from 'lucide-react'
import { programQueries } from '@/features/programs/queries'
import { deriveProgramStatus, programStatusLabel, programVisibilityLabel } from '@/features/programs/domain'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

function statusTone(status: ReturnType<typeof deriveProgramStatus>) {
  if (status === 'COMPLETED') return 'success'
  if (status === 'ONGOING') return 'primary'
  if (status === 'POSTPONED' || status === 'CANCELLED') return 'danger'
  return 'warning'
}

export default async function AdminProgramsPage() {
  const programs = await programQueries.getPrograms()
  const now = new Date()

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="font-heading text-3xl font-extrabold text-primary">Program</h1><p className="mt-1 text-sm text-muted">Kelola Program organisasi, jadwal, publikasi, dan relasinya.</p></div>
      <ButtonLink href="/admin/programs/new" prefetch={false}><Plus className="h-4 w-4" />Program Baru</ButtonLink>
    </div>

    {programs.length === 0 ? (
      <EmptyState
        icon={FolderKanban}
        title="Belum ada Program"
        description="Silakan buat Program pertama untuk organisasi."
      />
    ) : (
      <ul className="divide-y divide-border border-y border-border bg-surface">
        {programs.map((program) => {
          const status = deriveProgramStatus(program, now)

          return (
            <li key={program.id}>
              <Link
                href={`/admin/programs/${program.id}`}
                prefetch={false}
                className="grid min-h-24 gap-4 px-1 py-5 transition-colors hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">
                      {program.department.name}
                    </p>
                    <Badge tone={statusTone(status)}>{programStatusLabel(status)}</Badge>
                  </div>
                  <h2 className="mt-2 font-heading text-lg font-bold text-primary">{program.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-text-secondary">{program.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-text-secondary md:max-w-64 md:justify-end">
                  <span>{programVisibilityLabel(program.visibility)}</span>
                  <span>{program._count.agendas} Agenda</span>
                  {program.featured ? <span className="text-accent">Unggulan</span> : null}
                  {program.campaignEnabled ? <span className="text-accent">Campaign aktif</span> : null}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    )}
  </div>
}
