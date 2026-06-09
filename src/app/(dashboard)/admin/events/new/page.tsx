import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createEventAction } from '@/features/events/actions'
import { programQueries } from '@/features/programs/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ programId?: string }> }) {
  const sp = await searchParams
  const programs = await programQueries.getPrograms()

  async function createEvent(formData: FormData) {
    'use server'
    const programId = formData.get('programId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const location = formData.get('location') as string
    const startDate = new Date(formData.get('startDate') as string)
    const endDate = new Date(formData.get('endDate') as string)

    const res = await createEventAction({ programId, title, description, location, startDate, endDate })
    if (res.success) {
      redirect(`/admin/programs/${programId}`)
    } else {
      throw new Error(res.error || 'Failed to create event')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/events" className="text-muted-foreground hover:text-primary">
          &larr; Kembali
        </Link>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Buat Event Baru</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={createEvent} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Program Terkait</label>
              <select name="programId" required defaultValue={sp.programId} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {programs.map((p: { id: string, name: string }) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Judul Event</label>
              <Input name="title" required placeholder="Contoh: Seminar Nasional" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Mulai</label>
                <Input name="startDate" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Selesai</label>
                <Input name="endDate" type="datetime-local" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lokasi</label>
              <Input name="location" required placeholder="Contoh: Aula Kampus" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi Kegiatan</label>
              <Textarea name="description" required placeholder="Detail kegiatan..." rows={4} />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Simpan Event</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
