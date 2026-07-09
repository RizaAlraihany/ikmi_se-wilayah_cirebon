import { redirect } from 'next/navigation'
import { auth } from '@/core/auth/auth'
import { can } from '@/core/authorization/rbac'
import { documentArchiveCategories } from '@/features/document-archives/schemas'
import { documentArchiveQueries } from '@/features/document-archives/queries'
import { DocumentArchiveBoard } from './components/DocumentArchiveBoard'
import { DocumentArchiveForm } from './components/DocumentArchiveForm'

export const metadata = {
  title: 'Arsip Dokumen | IKMI Cirebon',
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id || !session.user.roleId) redirect('/login')

  const sessionUser = {
    id: session.user.id,
    roleId: session.user.roleId,
    departmentId: session.user.departmentId ?? null,
    positionId: session.user.positionId ?? null,
  }

  const isAuthorized = await can('letter.view', sessionUser)
  if (!isAuthorized) redirect('/admin')

  const resolvedParams = await searchParams
  const rawCategory = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined
  const categoryFilter = rawCategory && documentArchiveCategories.includes(rawCategory as (typeof documentArchiveCategories)[number])
    ? rawCategory
    : undefined
  const searchFilter = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined
  const documents = await documentArchiveQueries.getDocuments(categoryFilter, searchFilter)

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-0 py-1 md:space-y-6 md:py-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Arsip Dokumen</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Kelola dokumen internal sekretaris, notulen, formulir, dan arsip organisasi.
          </p>
        </div>
        <DocumentArchiveForm />
      </div>

      <DocumentArchiveBoard
        initialDocuments={documents}
        currentCategory={categoryFilter}
        currentSearch={searchFilter}
      />
    </div>
  )
}
