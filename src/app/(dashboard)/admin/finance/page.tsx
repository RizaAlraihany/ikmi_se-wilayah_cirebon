import { WalletCards, Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { financeQueries } from '@/features/finance/queries'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminFinancePage() {
  const session = await auth()
  if (!session?.user) return null

  // Buku Kas (FinanceTransaction) tidak menggunakan tier approval. Semua transaksi langsung dicatat.
  const transactions = await financeQueries.getTransactions(undefined, 0, 50)
  const summary = await financeQueries.getSummary()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Buku Kas (Keuangan)</h1>
          <p className="mt-1 text-sm text-text-secondary">Pantau pemasukan dan pengeluaran keuangan organisasi.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/finance/tokens">
            <Button variant="secondary">
              LPJ Token
            </Button>
          </Link>
          <Link href="/admin/finance/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Catat Transaksi
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-t-4 border-t-success">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-full">
              <ArrowDownRight className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-text-secondary">Total Pemasukan</p>
              <div className="mt-1 font-heading text-2xl font-extrabold text-primary">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(summary.totalIncome)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-danger">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-danger/10 rounded-full">
              <ArrowUpRight className="w-6 h-6 text-danger" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-text-secondary">Total Pengeluaran</p>
              <div className="mt-1 font-heading text-2xl font-extrabold text-primary">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(summary.totalExpense)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-primary">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ArrowRightLeft className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-text-secondary">Saldo Saat Ini</p>
              <div className="mt-1 font-heading text-2xl font-extrabold text-primary">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(summary.balance)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <EmptyState icon={WalletCards} title="Belum ada transaksi" description="Catat pemasukan atau pengeluaran pertama organisasi." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-alt text-xs font-semibold uppercase tracking-wide text-text-secondary">
                <tr>
                  <th className="px-5 py-4">Tanggal</th>
                  <th className="px-5 py-4">Tipe</th>
                  <th className="px-5 py-4">Deskripsi</th>
                  <th className="px-5 py-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((trx) => (
                  <tr key={trx.id} className="transition-colors hover:bg-surface-alt/50">
                    <td className="px-5 py-4 font-medium">
                      {trx.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={trx.type === 'INCOME' ? 'success' : 'danger'}>
                        {trx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-primary">{trx.description}</p>
                      {trx.proofUrl && (
                        <a href={trx.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                          Lihat Bukti
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-heading font-bold text-base">
                      <span className={trx.type === 'INCOME' ? 'text-success' : 'text-danger'}>
                        {trx.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(trx.amount))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
