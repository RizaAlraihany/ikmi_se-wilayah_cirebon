import { notFound } from 'next/navigation'
import { membershipQueries } from '@/features/membership/queries'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { BatchMembershipList } from './components/BatchMembershipList'

export default async function MembershipPhasePage({
  params,
  searchParams,
}: {
  params: Promise<{ phase: string }>
  searchParams: Promise<{ q?: string; campus?: string; major?: string; district?: string; batch?: string; department?: string; position?: string }>
}) {
  const p = await params
  const s = await searchParams
  
  const validPhases = ['active', 'management', 'demisioner', 'alumni']
  if (!validPhases.includes(p.phase)) {
    notFound()
  }

  const phaseKey = p.phase.toUpperCase() as 'ACTIVE' | 'MANAGEMENT' | 'DEMISIONER' | 'ALUMNI'
  const allMembers = await membershipQueries.getMembersByPhase(phaseKey)

  const q = s.q?.toLowerCase() || ''
  const campusFilter = s.campus?.toLowerCase() || ''
  const majorFilter = s.major?.toLowerCase() || ''
  const districtFilter = s.district?.toLowerCase() || ''
  const batchFilter = s.batch || ''
  const deptFilter = s.department?.toLowerCase() || ''
  const posFilter = s.position?.toLowerCase() || ''

  const members = allMembers.filter(m => {
    const nameMatch = m.name.toLowerCase().includes(q)
    const waMatch = m.email.toLowerCase().includes(q)
    const campusMatch = m.registration?.campus.toLowerCase().includes(q) || false
    const matchSearch = q === '' || nameMatch || waMatch || campusMatch

    const matchCampus = campusFilter === '' || m.registration?.campus.toLowerCase().includes(campusFilter)
    const matchMajor = majorFilter === '' || m.registration?.major.toLowerCase().includes(majorFilter)
    const matchDistrict = districtFilter === '' || m.registration?.address.toLowerCase().includes(districtFilter)
    const matchBatch = batchFilter === '' || (m.registration && new Date(m.registration.createdAt).getFullYear().toString() === batchFilter)
    const matchDept = deptFilter === '' || m.department?.name.toLowerCase().includes(deptFilter)
    const matchPos = posFilter === '' || m.position?.name.toLowerCase().includes(posFilter)

    return matchSearch && matchCampus && matchMajor && matchDistrict && matchBatch && matchDept && matchPos
  })

  const titles: Record<string, string> = {
    'ACTIVE': 'Anggota Aktif',
    'MANAGEMENT': 'Pengurus',
    'DEMISIONER': 'Demisioner',
    'ALUMNI': 'Alumni'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/membership" className="text-muted-foreground hover:text-primary">
          &larr; Kembali
        </Link>
        <PageHeader title={titles[phaseKey]} description={`Daftar ${titles[phaseKey].toLowerCase()} IKMI Cirebon.`} />
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">
          <form className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <input type="text" name="q" defaultValue={q} placeholder="Global Search (Nama, WA, Email, Kampus)..." className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex-1" />
              <input type="text" name="campus" defaultValue={campusFilter} placeholder="Filter Kampus..." className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input type="text" name="major" defaultValue={majorFilter} placeholder="Filter Jurusan..." className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button type="submit" className="h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium">
                Cari
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input type="text" name="district" defaultValue={districtFilter} placeholder="Filter Kecamatan..." className="flex h-10 w-full md:w-1/4 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input type="text" name="batch" defaultValue={batchFilter} placeholder="Angkatan (Tahun)..." className="flex h-10 w-full md:w-1/4 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input type="text" name="department" defaultValue={deptFilter} placeholder="Filter Department..." className="flex h-10 w-full md:w-1/4 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input type="text" name="position" defaultValue={posFilter} placeholder="Filter Jabatan..." className="flex h-10 w-full md:w-1/4 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </form>

          {members.length === 0 ? (
            <EmptyState icon={Users} title={`Belum ada data ${titles[phaseKey].toLowerCase()} yang sesuai`} description="" />
          ) : (
            <BatchMembershipList members={members} phaseKey={phaseKey} />
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
