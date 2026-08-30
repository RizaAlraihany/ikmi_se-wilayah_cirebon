'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { assignStructureAction } from '@/features/structure/actions'
import { Plus } from 'lucide-react'
import { Alert } from '@/components/ui/alert'

interface AssignStructureFormProps {
  periodId: string
  departments: Array<{ id: string; name: string }>
  positions: Array<{ id: string; name: string; departmentId: string | null }>
  people: Array<{ id: string; name: string; type: 'MEMBER' | 'USER' }>
}

export function AssignStructureForm({ periodId, departments, positions, people }: AssignStructureFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [personKey, setPersonKey] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [positionId, setPositionId] = useState('')
  const [error, setError] = useState('')

  // Filter positions by selected department
  const availablePositions = positions.filter(p => p.departmentId === departmentId)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const [personType, personId] = personKey.split(':') as ['MEMBER' | 'USER', string]
      const res = await assignStructureAction(periodId, { personType, personId, departmentId, positionId, sortOrder: 0 })
      if (res.success) {
        setOpen(false)
        setPersonKey('')
        setDepartmentId('')
        setPositionId('')
        router.refresh()
      } else {
        setError(res.message || 'Penugasan tidak dapat disimpan.')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Penugasan
      </Button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Tambah Penugasan Struktur"
        description="Assign pengurus ke departemen dan jabatan untuk periode ini."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="space-y-2">
            <Label htmlFor="userId">Pengurus</Label>
            <Select
              id="userId"
              value={personKey}
              onChange={(e) => setPersonKey(e.target.value)}
              required
            >
              <option value="" disabled>Pilih pengurus...</option>
              {people.map((person) => (
                <option key={`${person.type}:${person.id}`} value={`${person.type}:${person.id}`}>
                  {person.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="departmentId">Departemen / Unit</Label>
            <Select
              id="departmentId"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value)
                setPositionId('')
              }}
              required
            >
              <option value="" disabled>Pilih departemen...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="positionId">Jabatan</Label>
            <Select
              id="positionId"
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              required
              disabled={!departmentId}
            >
              <option value="" disabled>Pilih jabatan...</option>
              {availablePositions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
              {departmentId && availablePositions.length === 0 && (
                <option value="none" disabled>Tidak ada jabatan di unit ini</option>
              )}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !personKey || !departmentId || !positionId}>
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  )
}
