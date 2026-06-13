'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, FileText, Trash2 } from 'lucide-react'
import { deleteLetterAction } from '@/features/letters/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type LetterType = 'IN' | 'OUT'

type Letter = {
  id: string
  letterNumber: string
  type: LetterType
  subject: string
  fileUrl: string
  date: Date
}

type FilterValue = '' | LetterType

const filters: { value: FilterValue; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'IN', label: 'Surat Masuk' },
  { value: 'OUT', label: 'Surat Keluar' },
]

export function LetterBoard({ initialLetters, currentFilter, currentSearch }: { initialLetters: Letter[]; currentFilter?: string; currentSearch?: string }) {
  const router = useRouter()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(currentSearch || '')

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError('')
    const result = await deleteLetterAction(id)
    if (result?.error) {
      setError(result.error)
    } else {
      setPendingDeleteId(null)
      router.refresh()
    }
    setDeletingId(null)
  }

  function handleFilter(type: FilterValue) {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (search) params.set('q', search)
    router.push(`/admin/letters?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (currentFilter) params.set('type', currentFilter)
    if (search) params.set('q', search)
    router.push(`/admin/letters?${params.toString()}`)
  }

  const pendingLetter = initialLetters.find((letter) => letter.id === pendingDeleteId)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = (currentFilter || '') === filter.value
            return (
              <Button
                key={filter.label}
                variant={isActive ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleFilter(filter.value)}
              >
                {filter.label}
              </Button>
            )
          })}
        </div>
        <form onSubmit={handleSearch} className="flex max-w-sm w-full gap-2">
          <Input
            placeholder="Cari surat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">Cari</Button>
        </form>
      </div>

      {error && (
        <div className="rounded-2xl bg-danger/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-danger/30">
          {error}
        </div>
      )}

      {initialLetters.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada arsip surat"
          description="Surat masuk dan keluar yang ditambahkan akan tampil di sini."
        />
      ) : (
        <>
          <div className="grid gap-4 md:hidden">
            {initialLetters.map((letter) => (
              <Card key={letter.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-base font-bold text-primary">{letter.letterNumber}</p>
                      <p className="text-sm text-text-secondary">{new Date(letter.date).toLocaleDateString('id-ID')}</p>
                    </div>
                    <Badge tone={letter.type === 'IN' ? 'success' : 'warning'}>
                      {letter.type === 'IN' ? 'Masuk' : 'Keluar'}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-primary/80">{letter.subject}</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={letter.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background text-primary transition-colors hover:bg-primary/5"
                      aria-label={`Lihat dokumen ${letter.letterNumber}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(letter.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-danger/15 text-primary transition-colors hover:bg-danger/25"
                      aria-label={`Hapus surat ${letter.letterNumber}`}
                    >
                      <Trash2 className="h-4 w-4" />
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
                    <th className="px-5 py-4">No. Surat</th>
                    <th className="px-5 py-4">Tipe</th>
                    <th className="px-5 py-4">Perihal</th>
                    <th className="px-5 py-4">Tanggal</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {initialLetters.map((letter) => (
                    <tr key={letter.id} className="transition-colors hover:bg-surface-alt">
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-primary">
                        {letter.letterNumber}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <Badge tone={letter.type === 'IN' ? 'success' : 'warning'}>
                          {letter.type === 'IN' ? 'Masuk' : 'Keluar'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-primary/80">{letter.subject}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-text-secondary">
                        {new Date(letter.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={letter.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5"
                            aria-label={`Lihat dokumen ${letter.letterNumber}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(letter.id)}
                            className={cn(
                              'inline-flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-danger/20',
                              deletingId === letter.id && 'opacity-50',
                            )}
                            disabled={deletingId === letter.id}
                            aria-label={`Hapus surat ${letter.letterNumber}`}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {pendingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-letter-title">
          <Card className="w-full max-w-md rounded-2xl border-t-4 border-t-danger">
            <CardContent className="space-y-5 p-6">
              <div>
                <h2 id="delete-letter-title" className="font-heading text-xl font-bold text-primary">
                  Hapus arsip surat?
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Arsip {pendingLetter.letterNumber} akan dihapus dari daftar persuratan.
                </p>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setPendingDeleteId(null)} disabled={deletingId === pendingLetter.id}>
                  Batal
                </Button>
                <Button variant="danger" onClick={() => handleDelete(pendingLetter.id)} disabled={deletingId === pendingLetter.id}>
                  {deletingId === pendingLetter.id ? 'Menghapus...' : 'Hapus'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
