import { auth } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import { letterQueries } from '@/features/letters/queries'
import { can } from '@/core/authorization/rbac'
import { LetterBoard } from './components/LetterBoard'
import { LetterForm } from './components/LetterForm'

export const metadata = {
  title: 'Manajemen Persuratan | IKMI Cirebon',
}

export default async function AdminLettersPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.id || !session.user.departmentId) redirect('/login')

  const isAuthorized = await can('letter.view', {
    id: session.user.id,
    roleId: session.user.roleId as string,
    departmentId: session.user.departmentId,
    positionId: null
  })

  if (!isAuthorized) {
    redirect('/admin')
  }

  const resolvedParams = await searchParams
  const typeFilter = typeof resolvedParams.type === 'string' && (resolvedParams.type === 'IN' || resolvedParams.type === 'OUT') ? resolvedParams.type : undefined
  const searchFilter = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined

  const letters = await letterQueries.getLetters(typeFilter, searchFilter)

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-0 py-1 md:space-y-6 md:py-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Persuratan</h1>
          <p className="mt-1 text-sm text-text-secondary">Kelola arsip surat masuk dan surat keluar.</p>
        </div>
        <LetterForm />
      </div>

      <LetterBoard initialLetters={letters} currentFilter={typeFilter} currentSearch={searchFilter} />
    </div>
  )
}
