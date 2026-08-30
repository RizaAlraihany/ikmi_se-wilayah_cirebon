import { ArrowLeft } from 'lucide-react'
import { programQueries } from '@/features/programs/queries'
import { ProgramForm } from '../components/program-form'
import { ButtonLink } from '@/components/ui/button'

export default async function NewProgramPage() {
  const options = await programQueries.getProgramFormOptions()

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <ButtonLink href="/admin/programs" prefetch={false} variant="ghost" className="w-fit px-0 hover:bg-transparent">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />Kembali ke program
      </ButtonLink>
      <ProgramForm units={options.units} periods={options.periods} members={options.members} />
    </div>
  )
}
