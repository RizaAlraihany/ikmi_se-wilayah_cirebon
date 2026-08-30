import { ArrowLeft, Banknote, CalendarDays, GitBranch } from 'lucide-react'
import { notFound } from 'next/navigation'
import { programQueries } from '@/features/programs/queries'
import { deriveProgramStatus, programStatusLabel, programVisibilityLabel } from '@/features/programs/domain'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgramEditor } from '../components/program-editor'
import { ProgramRelationshipEditor } from '../components/program-relationship-editor'
import { ProgramStatusEditor } from '../components/program-status-editor'

function dateValue(value: Date | null) { return value ? new Date(value).toISOString().slice(0, 10) : '' }
function formatDate(value: Date | null) { return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(value) : 'Belum ditentukan' }

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, options] = await Promise.all([programQueries.getProgramById(id), programQueries.getProgramFormOptions()])
  if (!program) notFound()

  const status = deriveProgramStatus(program)
  const relatedPrograms = options.programs.filter((candidate) => candidate.id !== program.id)
  const relationRows = [
    ...program.relationshipSources.map((relation) => ({ direction: '→', type: relation.relationshipType, name: relation.targetProgram.name, note: relation.note })),
    ...program.relationshipTargets.map((relation) => ({ direction: '←', type: relation.relationshipType, name: relation.sourceProgram.name, note: relation.note })),
  ]

  return <div className="space-y-6">
    <ButtonLink href="/admin/programs" prefetch={false} variant="ghost" className="w-fit px-0 hover:bg-transparent"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Kembali ke Program</ButtonLink>
    <div className="flex flex-col gap-4 rounded-3xl bg-gradient-card p-6 text-surface shadow-card lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-surface/70">Program organisasi</p><h1 className="mt-2 font-heading text-3xl font-extrabold">{program.fullName || program.name}</h1><p className="mt-2 text-sm text-surface/80">{program.department.name} · {program.period?.name ?? 'Periode belum ditentukan'}</p></div><Badge tone="surface" className="w-fit">{programStatusLabel(status)}</Badge></div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]"><div className="space-y-6"><Card><CardHeader><CardTitle>Informasi Program</CardTitle></CardHeader><CardContent className="space-y-5"><p className="whitespace-pre-wrap text-sm leading-7 text-text-secondary">{program.description}</p><dl className="grid gap-4 sm:grid-cols-2"><Data label="PIC" value={program.pic?.fullName ?? 'Belum ditentukan'} /><Data label="Rencana" value={`${formatDate(program.plannedStart)} — ${formatDate(program.plannedEnd)}`} /><Data label="Lokasi" value={program.location ?? 'Belum ditentukan'} /><Data label="Visibilitas" value={programVisibilityLabel(program.visibility)} /><Data label="Tujuan" value={program.objective ?? 'Belum diisi'} /><Data label="Sasaran" value={program.targetAudience ?? 'Belum diisi'} /><Data label="Metode" value={program.method ?? 'Belum diisi'} /><Data label="Output" value={program.output ?? 'Belum diisi'} /></dl><div className="flex flex-wrap gap-2"><Badge tone={program.campaignEnabled ? 'primary' : 'surface'}>{program.campaignEnabled ? 'Campaign diaktifkan' : 'Tanpa campaign'}</Badge><Badge tone={program.featured ? 'primary' : 'surface'}>{program.featured ? 'Program unggulan' : 'Bukan unggulan'}</Badge>{program.requiresRegistration ? <Badge tone="surface">Memerlukan pendaftaran</Badge> : null}</div><div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm font-semibold text-primary"><Banknote className="h-5 w-5 text-accent" />{program.plannedBudget === null ? 'Anggaran rencana belum diverifikasi' : `Anggaran rencana: Rp ${Number(program.plannedBudget).toLocaleString('id-ID')}`}</div></CardContent></Card><ProgramEditor program={{ id: program.id, name: program.name, fullName: program.fullName, description: program.description, objective: program.objective, targetAudience: program.targetAudience, method: program.method, output: program.output, departmentId: program.departmentId, periodId: program.periodId, picId: program.picId, plannedStart: dateValue(program.plannedStart), plannedEnd: dateValue(program.plannedEnd), location: program.location, plannedBudget: program.plannedBudget?.toString() ?? '', visibility: program.visibility ?? 'HIDDEN', campaignEnabled: program.campaignEnabled, featured: program.featured, requiresRegistration: program.requiresRegistration, registrationType: program.registrationType }} units={options.units} periods={options.periods} members={options.members} /><Card><CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5" />Program terkait</CardTitle></CardHeader><CardContent className="space-y-4">{relationRows.length ? <ul className="space-y-2">{relationRows.map((relation, index) => <li key={`${relation.direction}-${relation.type}-${index}`} className="rounded-xl border border-border bg-surface-alt p-3 text-sm"><span className="font-bold text-primary">{relation.direction} {relation.name}</span><span className="ml-2 text-xs font-semibold text-accent">{relation.type}</span>{relation.note ? <p className="mt-1 text-text-secondary">{relation.note}</p> : null}</li>)}</ul> : <p className="text-sm text-text-secondary">Belum ada hubungan Program.</p>}<ProgramRelationshipEditor sourceProgramId={program.id} programs={relatedPrograms} /></CardContent></Card></div><div className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Status Program</CardTitle></CardHeader><CardContent><ProgramStatusEditor id={program.id} derivedStatus={status} statusOverride={program.statusOverride} /></CardContent></Card></div></div>
  </div>
}

function Data({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-text-muted">{label}</dt><dd className="mt-1 text-sm leading-6 text-primary">{value}</dd></div> }
