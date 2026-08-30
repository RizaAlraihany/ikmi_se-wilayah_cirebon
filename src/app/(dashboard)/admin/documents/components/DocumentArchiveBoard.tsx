'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Download, Search, Trash2 } from 'lucide-react'
import { deleteDocumentArchiveAction } from '@/features/document-archives/actions'
import { documentArchiveCategories } from '@/features/document-archives/schemas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type DocumentArchive = {
  id: string
  title: string
  category: string
  description: string | null
  archivedAt: Date
  visibility: 'INTERNAL' | 'PUBLIC' | 'MEMBER_ONLY' | 'PENGURUS_ONLY' | 'BPH_ONLY' | 'HIDDEN'
  fileName: string | null
  fileSize: number | null
  organizationalUnit: { name: string } | null
  period: { name: string } | null
  program: { name: string } | null
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

function formatFileSize(value: number | null) {
  if (value === null) return null
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function relationSummary(document: DocumentArchive) {
  return [document.organizationalUnit?.name, document.period?.name, document.program?.name].filter(Boolean).join(' · ')
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
    if (!result.success) {
      setError(result.message || 'Arsip dokumen tidak dapat diarsipkan.')
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
            id="document-search"
            aria-label="Cari judul atau deskripsi dokumen"
            placeholder="Cari dokumen..."
            value={search}
            className="rounded-2xl"
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button type="submit" variant="secondary" className="px-5" aria-label="Cari dokumen">
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
                  <div className="space-y-1 text-xs leading-5 text-text-secondary">
                    {relationSummary(document) ? <p>{relationSummary(document)}</p> : null}
                    <p>{[document.fileName, formatFileSize(document.fileSize)].filter(Boolean).join(' · ') || 'Metadata file legacy belum tersedia'}</p>
                    <p className="font-semibold uppercase tracking-wide">Internal</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`/api/private/documents/${document.id}`}
                      className="ikmi-liquid-blue inline-flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      aria-label={`Lihat dokumen ${document.title}`}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Unduh
                    </a>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(document.id)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-danger/15 text-sm font-semibold text-primary transition-colors hover:bg-danger/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      aria-label={`Arsipkan dokumen ${document.title}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Arsipkan
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
                        {relationSummary(document) ? <span className="mt-1 block text-xs text-text-secondary">{relationSummary(document)}</span> : null}
                        <span className="mt-1 block text-xs text-text-secondary">{[document.fileName, formatFileSize(document.fileSize)].filter(Boolean).join(' · ') || 'Metadata file legacy belum tersedia'}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/api/private/documents/${document.id}`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            aria-label={`Unduh dokumen ${document.title}`}
                          >
                            <Download className="h-4 w-4" aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(document.id)}
                            className={cn(
                              'inline-flex h-11 w-11 items-center justify-center rounded-md text-primary transition-colors hover:bg-danger/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                              deletingId === document.id && 'opacity-50',
                            )}
                            disabled={deletingId === document.id}
                            aria-label={`Arsipkan dokumen ${document.title}`}
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

      <Dialog
        open={Boolean(pendingDocument)}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null) }}
        title="Arsipkan dokumen?"
        description={pendingDocument ? `Dokumen ${pendingDocument.title} akan disembunyikan dari daftar aktif, namun riwayatnya tetap tersimpan.` : undefined}
      >
        {pendingDocument ? (
            <div className="space-y-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setPendingDeleteId(null)} disabled={deletingId === pendingDocument.id}>
                  Batal
                </Button>
                <Button variant="danger" onClick={() => handleDelete(pendingDocument.id)} disabled={deletingId === pendingDocument.id}>
                  {deletingId === pendingDocument.id ? 'Mengarsipkan...' : 'Arsipkan'}
                </Button>
              </div>
            </div>
        ) : null}
      </Dialog>
    </div>
  )
}
