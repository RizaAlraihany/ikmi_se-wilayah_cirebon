import { membershipQueries } from '@/features/membership/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function DataIntegrityPage() {
  const anomalies = await membershipQueries.checkDataIntegrity()

  const hasAnomalies = 
    anomalies.usersWithoutRole.length > 0 || 
    anomalies.pengurusWithoutPosition.length > 0 || 
    anomalies.activeWithPosition.length > 0 || 
    anomalies.alumniWithoutRole.length > 0 || 
    anomalies.duplicates.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-primary flex items-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          Data Integrity Report
        </h1>
        <p className="mt-1 text-sm text-muted">Laporan anomali data membership IKMI Cirebon.</p>
      </div>

      {!hasAnomalies ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-900">Data Clean & Valid</h2>
            <p className="text-green-700 mt-2">Tidak ditemukan anomali pada data membership saat ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <AnomalySection 
            title="User tanpa Role" 
            description="Anggota yang tidak memiliki peran (Role) yang valid di sistem."
            data={anomalies.usersWithoutRole}
          />
          <AnomalySection 
            title="Pengurus tanpa Position" 
            description="Anggota yang berada di departemen tetapi tidak memiliki jabatan."
            data={anomalies.pengurusWithoutPosition}
          />
          <AnomalySection 
            title="Anggota Aktif salah Position" 
            description="Anggota yang memiliki jabatan tetapi tidak tergabung dalam departemen (atau sebaliknya)."
            data={anomalies.activeWithPosition}
          />
          <AnomalySection 
            title="Alumni tanpa Role Alumni" 
            description="Status anggota Inactive namun role bukan Alumni/Demisioner."
            data={anomalies.alumniWithoutRole}
          />
          <AnomalySection 
            title="Duplikat Membership" 
            description="Terdeteksi memiliki email atau data yang sama."
            data={anomalies.duplicates}
          />
        </div>
      )}
    </div>
  )
}

type AnomalyUser = {
  id: string
  name: string
  email: string
}

function AnomalySection({ title, description, data }: { title: string, description: string, data: AnomalyUser[] }) {
  if (data.length === 0) return null

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-red-50/50 pb-4 border-b border-red-100">
        <CardTitle className="text-lg text-red-900 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs">
            {data.length}
          </span>
          {title}
        </CardTitle>
        <p className="text-sm text-red-700">{description}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-line">
          {data.map((user, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Link 
                href={`/admin/membership/profile/${user.id}`}
                className="text-sm text-primary hover:underline font-medium"
              >
                Review & Fix
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
