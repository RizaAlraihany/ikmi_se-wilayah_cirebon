import { notFound } from 'next/navigation'
import { membershipQueries } from '@/features/membership/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Phone, GraduationCap, School, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { KaderisasiNotes } from './components/KaderisasiNotes'
import { KaderisasiHistory } from './components/KaderisasiHistory'
import { KaderisasiActions } from '../components/KaderisasiActions'

export default async function KaderisasiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const p = await params
  const registration = await membershipQueries.getRegistrationProfile(p.id)
  const logs = await membershipQueries.getRegistrationLogs(p.id)

  if (!registration) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/kaderisasi" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Detail Kaderisasi</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={registration.status === 'PENDING' ? 'secondary' : registration.status === 'APPROVED' ? 'default' : 'destructive'}>
            {registration.status}
          </Badge>
          <KaderisasiActions registrationId={registration.id} status={registration.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-primary/50 font-bold">
                {registration.fullName.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold font-heading">{registration.fullName}</h2>
              <p className="text-sm text-muted-foreground mb-4">Daftar: {new Date(registration.createdAt).toLocaleDateString('id-ID')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Kontak & Lokasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{registration.whatsapp}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span>{registration.address}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Riwayat Proses (Timeline)</CardTitle>
            </CardHeader>
            <CardContent>
              <KaderisasiHistory logs={logs} />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Biodata Kampus & Alasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><School className="w-3 h-3" /> Kampus</p>
                  <p className="font-medium">{registration.campus}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen className="w-3 h-3" /> Jurusan</p>
                  <p className="font-medium">{registration.major}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Semester</p>
                  <p className="font-medium">{registration.semester}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-line">
                <p className="text-xs text-muted-foreground mb-1">Alasan Bergabung</p>
                <p className="text-sm italic">&quot;{registration.reasons}&quot;</p>
              </div>
            </CardContent>
          </Card>

          {/* Kaderisasi Notes */}
          <KaderisasiNotes registrationId={registration.id} logs={logs} />
        </div>
      </div>
    </div>
  )
}
