'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Trash2 } from 'lucide-react'
import { deletePengurusAction, updatePengurusAction } from '@/features/management/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ListboxSelect } from '@/components/ui/listbox-select'

type Option = {
  id: string
  name: string
}

type Pengurus = {
  id: string
  name: string
  isActive: boolean
  departmentId: string | null
  positionId: string | null
  whatsappNumber: string | null
  photoUrl: string | null
}

export function PengurusEditor({
  pengurus,
  departments,
  positions,
}: {
  pengurus: Pengurus
  departments: Option[]
  positions: (Option & { departmentId: string | null })[]
}) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError('')

    const result = await updatePengurusAction(pengurus.id, {
      name: getValue(formData, 'name'),
      departmentId: getNullableValue(formData, 'departmentId'),
      positionId: getNullableValue(formData, 'positionId'),
      whatsappNumber: getNullableValue(formData, 'whatsappNumber'),
      photoUrl: getNullableValue(formData, 'photoUrl'),
      isActive: formData.get('isActive') === 'on',
    })

    setIsSubmitting(false)
    if (result?.error) {
      setError(result.error)
      return
    }

    router.push('/admin/management')
    router.refresh()
  }

  async function handleDelete() {
    const confirmed = window.confirm('Hapus dari daftar pengurus? Akun tidak dihapus total, tetapi jabatan dan departemennya dikosongkan.')
    if (!confirmed) return

    setIsDeleting(true)
    setError('')
    const result = await deletePengurusAction(pengurus.id)
    setIsDeleting(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    router.push('/admin/management')
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-5 md:p-6">
        {error ? (
          <div className="flex gap-2 rounded-2xl bg-danger/15 px-4 py-3 text-sm font-semibold text-primary ring-1 ring-danger/25">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        ) : null}

        <form action={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-primary">Nama Pengurus</label>
              <Input id="name" name="name" defaultValue={pengurus.name} required className="rounded-2xl" disabled={isSubmitting || isDeleting} />
            </div>

            <div className="space-y-2">
              <label htmlFor="whatsappNumber" className="text-sm font-semibold text-primary">Nomor WhatsApp</label>
              <Input id="whatsappNumber" name="whatsappNumber" defaultValue={pengurus.whatsappNumber ?? ''} className="rounded-2xl" disabled={isSubmitting || isDeleting} />
            </div>

            <div className="space-y-2">
              <label htmlFor="departmentId" className="text-sm font-semibold text-primary">Departemen</label>
              <ListboxSelect
                id="departmentId"
                name="departmentId"
                defaultValue={pengurus.departmentId ?? ''}
                disabled={isSubmitting || isDeleting}
                options={[
                  { value: '', label: 'BPH / Tanpa Departemen' },
                  ...departments.map((department) => ({ value: department.id, label: department.name })),
                ]}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="positionId" className="text-sm font-semibold text-primary">Jabatan</label>
              <ListboxSelect
                id="positionId"
                name="positionId"
                defaultValue={pengurus.positionId ?? ''}
                disabled={isSubmitting || isDeleting}
                options={[
                  { value: '', label: 'Tanpa Jabatan' },
                  ...positions.map((position) => ({ value: position.id, label: position.name })),
                ]}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="photoUrl" className="text-sm font-semibold text-primary">URL Foto</label>
              <Input id="photoUrl" name="photoUrl" defaultValue={pengurus.photoUrl ?? ''} className="rounded-2xl" placeholder="https://..." disabled={isSubmitting || isDeleting} />
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-2xl bg-surface-alt p-4 text-sm font-semibold text-primary">
            <span>
              Status pengurus aktif
              <span className="block text-xs font-medium text-text-secondary">Matikan jika sudah demisioner atau tidak aktif.</span>
            </span>
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={pengurus.isActive}
              className="h-5 w-5 rounded border-border text-accent focus:ring-accent"
              disabled={isSubmitting || isDeleting}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="danger" onClick={handleDelete} disabled={isSubmitting || isDeleting} className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {isDeleting ? 'Menghapus...' : 'Hapus dari Pengurus'}
            </Button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button type="button" variant="secondary" onClick={() => router.push('/admin/management')} disabled={isSubmitting || isDeleting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function getValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function getNullableValue(formData: FormData, key: string) {
  const value = getValue(formData, key).trim()
  return value.length > 0 ? value : null
}
