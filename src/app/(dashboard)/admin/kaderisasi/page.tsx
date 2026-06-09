import { BookOpen, Search, ShieldCheck } from 'lucide-react'
import { membershipQueries } from '@/features/membership/queries'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { BatchKaderisasiList } from './components/BatchKaderisasiList'

export default async function AdminKaderisasiPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>
}) {
  const params = await searchParams
  const tab = params.tab || 'pending'
  const q = params.q?.toLowerCase() || ''

  const isPending = tab === 'pending'
  const rawData = await membershipQueries.getRegistrationsByStatus(isPending ? 'PENDING' : 'APPROVED')
  
  const data = rawData.filter(d => 
    d.fullName.toLowerCase().includes(q) || 
    d.campus.toLowerCase().includes(q)
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Kaderisasi" description="Kelola pendaftar baru dan proses verifikasi calon anggota." />
      
      <div className="flex border-b border-line mb-4">
        <Link 
          href="?tab=pending" 
          className={`pb-2 px-4 font-semibold text-sm ${isPending ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-primary'}`}
        >
          Pendaftar Baru
        </Link>
        <Link 
          href="?tab=approved" 
          className={`pb-2 px-4 font-semibold text-sm ${!isPending ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-primary'}`}
        >
          Calon Anggota (Disetujui)
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <form className="relative max-w-md">
            <input type="hidden" name="tab" value={tab} />
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input name="q" defaultValue={q} placeholder="Cari nama atau kampus..." className="pl-11" aria-label="Cari pendaftar" />
          </form>

          {data.length === 0 ? (
            <EmptyState 
              icon={isPending ? BookOpen : ShieldCheck} 
              title={isPending ? "Belum ada pendaftar" : "Belum ada calon anggota"} 
              description="" 
            />
          ) : (
            <BatchKaderisasiList data={data} isPending={isPending} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold text-primary">{title}</h1>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  )
}
