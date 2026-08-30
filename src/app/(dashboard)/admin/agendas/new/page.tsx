import { ArrowLeft } from 'lucide-react'
import { agendaQueries } from '@/features/agendas/queries'
import { ButtonLink } from '@/components/ui/button'
import { AgendaForm } from '../components/agenda-form'

export default async function NewAgendaPage() {
  const options = await agendaQueries.getFormOptions()
  return <div className="mx-auto max-w-5xl space-y-5"><ButtonLink href="/admin/agendas" prefetch={false} variant="ghost" className="w-fit px-0 hover:bg-transparent"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Kembali ke Agenda</ButtonLink><AgendaForm {...options} /></div>
}
