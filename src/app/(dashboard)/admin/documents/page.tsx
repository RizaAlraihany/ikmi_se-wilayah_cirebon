import { redirect } from 'next/navigation'
import { isOrganizationAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requirePermission } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { documentArchiveCategories } from '@/features/document-archives/schemas'
import { documentArchiveQueries } from '@/features/document-archives/queries'
import { DocumentArchiveBoard } from './components/DocumentArchiveBoard'
import { DocumentArchiveForm } from './components/DocumentArchiveForm'

export const metadata = { title: 'Arsip Dokumen | IKMI Cirebon' }

export default async function AdminDocumentsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const user = await requirePermission('document_archive.view')
  if (!isOrganizationAdminRole(user.roleId) && !isSuperAdminRole(user.roleId)) redirect('/admin')

  const resolvedParams = await searchParams
  const rawCategory = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined
  const categoryFilter = rawCategory && documentArchiveCategories.includes(rawCategory as (typeof documentArchiveCategories)[number]) ? rawCategory : undefined
  const searchFilter = typeof resolvedParams.q === 'string' ? resolvedParams.q.trim().slice(0, 100) : undefined

  const [documents, periods, units, programs] = await Promise.all([
    documentArchiveQueries.getDocuments(categoryFilter, searchFilter),
    prisma.period.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { createdAt: 'desc' } }),
    prisma.department.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.program.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Arsip Dokumen</h1>
          <p className="mt-1 text-sm text-text-secondary">Kelola dokumen organisasi privat dengan tautan unit, periode, dan program bila diperlukan.</p>
        </div>
        <DocumentArchiveForm periods={periods} units={units} programs={programs} />
      </div>
      <DocumentArchiveBoard initialDocuments={documents} currentCategory={categoryFilter} currentSearch={searchFilter} />
    </div>
  )
}
