'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ExternalLink, Search, Trash2 } from 'lucide-react'
import { deleteDocumentArchiveAction } from '@/features/document-archives/actions'
import { documentArchiveCategories } from '@/features/document-archives/schemas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type DocumentArchive = {
  id: string
  title: string
  category: string
  description: string | null
  fileUrl: string
  archivedAt: Date
}

type FilterValue = '' | (typeof documentArchiveCategories)[number]

const filters: { value: FilterValue; label: string }[] = [
  { value: '', label: 'Semua' },
  ...documentArchiveCategories.map((category) => ({ value: category, label: category })),
]

const archiveDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

function formatArchiveDate(value: Date | string) {
  return archiveDateFormatter.format(new Date(value))
}

export function DocumentArchiveBoard({
  initialDocuments,
  currentCategory,
  currentSearch,
}: {
  initialDocuments: DocumentArchive[]
  currentCategory?: string
  currentSearch?: string
}) {
  const router = useRouter()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(currentSearch || '')

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError('')
    const result = await deleteDocumentArchiveAction(id)
    if (result?.error) {
      setError(result.error)
    } else {
      setPendingDeleteId(null)
      router.refresh()
    }
    setDeletingId(null)
  }

  function buildUrl(category?: string, q?: string) {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (q) params.set('q', q)
    const query = params.toString()
    return query ? `/admin/documents?${query}` : '/admin/documents'
  }

  function handleFilter(category: FilterValue) {
    router.push(buildUrl(category, search))
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    router.push(buildUrl(currentCategory, search))
  }

  const pendingDocument = initialDocuments.find((document) => document.id === pendingDeleteId)

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-surface p-3 shadow-soft ring-1 ring-border">
        <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0">
          {filters.map((filter) => {
            const isActive = (currentCategory || '') === filter.value
            return (
              <Button
                key={filter.label}
                variant={isActive ? 'primary' : 'secondary'}
                size="sm"
                className="shrink-0 px-3 text-xs md:px-4 md:text-sm"
                onClick={() => handleFilter(filter.value)}
              >
                {filter.label}
              </Button>
            )
          })}
        </div>
        <form onSubmit={handleSearch} className="mt-3 grid w-full grid-cols-[1fr_auto] gap-2 md:max-w-md">
          <Input
            placeholder="Cari dokumen..."
            value={search}
            className="rounded-2xl"
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button type="submit" variant="secondary" className="px-5">
            <Search className="h-4 w-4 md:hidden" aria-hidden="true" />
            <span className="hidden md:inline">Cari</span>
          </Button>
        </form>
      </div>

      {error ? (
        <div className="rounded-2xl bg-danger/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-danger/30">
          {error}
        </div>
      ) : null}

      {initialDocuments.length === 0 ? (
        <Card className="border-dashed bg-surface/80">
          <EmptyState
            icon={Archive}
            title="Belum ada arsip dokumen"
            description="Dokumen internal sekretaris yang diunggah akan tampil di sini."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:hidden">
            {initialDocuments.map((document) => (
              <Card key={document.id} className="overflow-hidden">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-base font-bold leading-tight text-primary">{document.title}</p>
                      <p className="mt-1 text-xs font-semibold text-text-secondary">
                        {formatArchiveDate(document.archivedAt)}
                      </p>
                    </div>
                    <Badge tone="surface" className="shrink-0">{document.category}</Badge>
                  </div>
                  {document.description ? (
                    <p className="line-clamp-2 text-sm leading-6 text-primary/80">{document.description}</p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-surface transition-colors hover:bg-secondary"
                      aria-label={`Lihat dokumen ${document.title}`}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Lihat
                    </a>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(document.id)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-danger/15 text-sm font-semibold text-primary transition-colors hover:bg-danger/25"
                      aria-label={`Hapus dokumen ${document.title}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Hapus
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-alt text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-5 py-4">Judul</th>
                    <th className="px-5 py-4">Kategori</th>
                    <th className="px-5 py-4">Tanggal Arsip</th>
                    <th className="px-5 py-4">Keterangan</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {initialDocuments.map((document) => (
                    <tr key={document.id} className="transition-colors hover:bg-surface-alt">
                      <td className="px-5 py-4 font-semibold text-primary">{document.title}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <Badge tone="surface">{document.category}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-text-secondary">
                        {formatArchiveDate(document.archivedAt)}
                      </td>
                      <td className="max-w-sm px-5 py-4 text-primary/80">
                        <span className="line-clamp-2">{document.description || '-'}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5"
                            aria-label={`Lihat dokumen ${document.title}`}
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(document.id)}
                            className={cn(
                              'inline-flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-danger/20',
                              deletingId === document.id && 'opacity-50',
                            )}
                            disabled={deletingId === document.id}
                            aria-label={`Hapus dokumen ${document.title}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {pendingDocument ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-document-title">
          <Card className="w-full max-w-md rounded-2xl border-t-4 border-t-danger">
            <CardContent className="space-y-5 p-6">
              <div>
                <h2 id="delete-document-title" className="font-heading text-xl font-bold text-primary">
                  Hapus arsip dokumen?
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Dokumen {pendingDocument.title} akan dihapus dari daftar arsip.
                </p>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setPendingDeleteId(null)} disabled={deletingId === pendingDocument.id}>
                  Batal
                </Button>
                <Button variant="danger" onClick={() => handleDelete(pendingDocument.id)} disabled={deletingId === pendingDocument.id}>
                  {deletingId === pendingDocument.id ? 'Menghapus...' : 'Hapus'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
