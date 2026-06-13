'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createTransactionAction } from '@/features/finance/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FinanceTransactionCreateInput } from '@/features/finance/schemas'

type FormState = { success?: boolean; error?: string } | null

async function formAction(_: FormState, formData: FormData): Promise<FormState> {
  const input: FinanceTransactionCreateInput = {
    type: String(formData.get('type')) as 'INCOME' | 'EXPENSE',
    amount: Number(formData.get('amount')),
    description: String(formData.get('description')),
    category: String(formData.get('category')) || 'Umum',
    date: new Date(String(formData.get('date'))),
    proofUrl: String(formData.get('proofUrl') ?? '') || undefined,
  }
  return createTransactionAction(input)
}

export default function NewTransactionPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(formAction, null)

  if (state?.success) {
    router.push('/admin/finance')
  }

  const defaultDateStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Catat Transaksi Kas</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Catat pemasukan atau pengeluaran dana organisasi (Buku Kas).
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {state?.error ? (
            <div className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {state.error}
            </div>
          ) : null}

          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="type" className="mb-1.5 block text-sm font-semibold text-primary">
                Tipe Transaksi <span className="text-danger">*</span>
              </label>
              <Select
                id="type"
                name="type"
                required
              >
                <option value="INCOME">Pemasukan (Income)</option>
                <option value="EXPENSE">Pengeluaran (Expense)</option>
              </Select>
            </div>

            <div>
              <label htmlFor="date" className="mb-1.5 block text-sm font-semibold text-primary">
                Tanggal <span className="text-danger">*</span>
              </label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={defaultDateStr}
              />
            </div>

            <div>
              <label htmlFor="amount" className="mb-1.5 block text-sm font-semibold text-primary">
                Nominal (Rp) <span className="text-danger">*</span>
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                required
                placeholder="Contoh: 150000"
              />
            </div>

            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm font-semibold text-primary">
                Kategori <span className="text-danger">*</span>
              </label>
              <Input
                id="category"
                name="category"
                type="text"
                required
                defaultValue="Umum"
                placeholder="Contoh: Operasional"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-primary">
                Deskripsi <span className="text-danger">*</span>
              </label>
              <Textarea
                id="description"
                name="description"
                required
                rows={3}
                placeholder="Contoh: Iuran anggota bulan Maret"
              />
            </div>

            <div>
              <label htmlFor="proofUrl" className="mb-1.5 block text-sm font-semibold text-primary">
                URL Bukti (Opsional)
              </label>
              <Input
                id="proofUrl"
                name="proofUrl"
                type="url"
                placeholder="https://link-ke-bukti-transfer-atau-nota"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={pending}>
                {pending ? 'Menyimpan...' : 'Simpan Transaksi'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
