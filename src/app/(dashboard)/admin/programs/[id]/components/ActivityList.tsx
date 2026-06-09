'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Trash2, Plus, PlayCircle } from 'lucide-react'
import { createActivityAction, updateActivityAction, deleteActivityAction } from '@/features/programs/actions'

export function ActivityList({ activities, programId }: { activities: { id: string, name: string, description: string | null, status: string, createdAt?: Date, updatedAt?: Date }[], programId: string }) {
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await createActivityAction({
      programId,
      name: formData.get('name') as string,
      description: formData.get('description') as string
    })
    setLoading(false)
    setIsAdding(false)
  }

  const handleStatusChange = async (id: string, status: 'PLANNED' | 'ONGOING' | 'COMPLETED') => {
    await updateActivityAction(id, { status })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus aktivitas ini?')) {
      await deleteActivityAction(id)
    }
  }

  const completedActivities = activities.filter(a => a.status === 'COMPLETED').length
  const totalActivities = activities.length
  const progress = totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100)

  return (
    <div className="space-y-4">
      {totalActivities > 0 && (
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-sm font-medium">
            <span>Program Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {activities.length === 0 && !isAdding && (
        <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground">
          Belum ada aktivitas.
        </div>
      )}

      <div className="space-y-3">
        {activities.map(activity => (
          <div key={activity.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card items-start sm:items-center justify-between group">
            <div>
              <h4 className="font-semibold text-primary flex items-center gap-2">
                {activity.name}
                <Badge tone={activity.status === 'COMPLETED' ? 'success' : activity.status === 'ONGOING' ? 'primary' : 'surface'} className="text-[10px] px-1.5 py-0">
                  {activity.status}
                </Badge>
              </h4>
              <p className="text-sm text-muted-foreground mt-1">{activity.description || 'Tidak ada deskripsi.'}</p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                {activity.createdAt && <span>Direncanakan: {new Date(activity.createdAt).toLocaleDateString('id-ID')}</span>}
                {activity.status === 'COMPLETED' && activity.updatedAt && (
                  <span className="text-green-600 font-medium">Selesai: {new Date(activity.updatedAt).toLocaleDateString('id-ID')}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              {activity.status === 'PLANNED' && (
                <Button size="sm" variant="secondary" onClick={() => handleStatusChange(activity.id, 'ONGOING')}>
                  <PlayCircle className="w-4 h-4 mr-1" /> Mulai
                </Button>
              )}
              {activity.status === 'ONGOING' && (
                <Button size="sm" variant="secondary" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleStatusChange(activity.id, 'COMPLETED')}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Selesai
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(activity.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {isAdding ? (
        <form onSubmit={handleAdd} className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <Input name="name" required placeholder="Nama Aktivitas" disabled={loading} />
          <Textarea name="description" placeholder="Deskripsi (Opsional)" disabled={loading} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={loading}>Simpan</Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Aktivitas
        </Button>
      )}
    </div>
  )
}
