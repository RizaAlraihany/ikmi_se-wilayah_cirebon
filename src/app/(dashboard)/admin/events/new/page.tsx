import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListboxSelect } from '@/components/ui/listbox-select'
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
    <div className="mx-auto max-w-2xl space-y-6">
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
              <label htmlFor="programId" className="text-sm font-semibold text-primary">Pilih Program Terkait</label>
              <ListboxSelect
                id="programId"
                name="programId"
                defaultValue={sp.programId ?? programs[0]?.id ?? ''}
                options={programs.map((program: { id: string, name: string }) => ({ value: program.id, label: program.name }))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold text-primary">Judul Event</label>
              <Input id="title" name="title" required placeholder="Contoh: Seminar Nasional" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-semibold text-primary">Tanggal Mulai</label>
                <Input id="startDate" name="startDate" type="text" required placeholder="YYYY-MM-DDTHH:mm" />
              </div>
              <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-semibold text-primary">Tanggal Selesai</label>
                <Input id="endDate" name="endDate" type="text" required placeholder="YYYY-MM-DDTHH:mm" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-semibold text-primary">Lokasi</label>
              <Input id="location" name="location" required placeholder="Contoh: Aula Kampus" />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-primary">Deskripsi Kegiatan</label>
              <Textarea id="description" name="description" required placeholder="Detail kegiatan..." rows={4} />
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
