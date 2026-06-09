import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createFinanceRequestAction } from '@/features/finance/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NewFinanceRequestPage() {
  async function submitRequest(formData: FormData) {
    'use server'
    const amount = Number(formData.get('amount'))
    const description = formData.get('description') as string
    const proofUrl = formData.get('proofUrl') as string

    const res = await createFinanceRequestAction({ amount, description, proofUrl })
    if (res.success) {
      redirect(`/admin/finance`)
    } else {
      throw new Error(res.error || 'Failed to submit request')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/finance" className="text-muted-foreground hover:text-primary">
          &larr; Kembali
        </Link>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Buat Pengajuan Dana</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={submitRequest} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nominal (Rp)</label>
              <Input name="amount" type="number" required placeholder="Contoh: 1000000" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Keperluan / Deskripsi</label>
              <Textarea name="description" required placeholder="Deskripsikan keperluan dana..." rows={3} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Link Bukti / RAB (Opsional)</label>
              <Input name="proofUrl" type="url" placeholder="https://drive.google.com/..." />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Kirim Pengajuan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
