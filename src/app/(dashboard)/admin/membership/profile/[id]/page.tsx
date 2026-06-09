import { notFound } from 'next/navigation'
import { membershipQueries } from '@/features/membership/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Phone, GraduationCap, School, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { MembershipTimeline } from './components/MembershipTimeline'

export default async function MembershipProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const p = await params
  const profile = await membershipQueries.getMemberProfile(p.id)

  if (!profile || !profile.user) {
    notFound()
  }

  const { user, registration } = profile

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/membership" className="text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Profil Anggota</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-primary/50 font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold font-heading">{user.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {user.role && (
                  <Badge tone={user.role.id === 'alumni' ? 'surface' : 'primary'}>
                    {user.role.name}
                  </Badge>
                )}
                {user.department && (
                  <Badge tone="accent">{user.department.name}</Badge>
                )}
                {user.position && (
                  <Badge tone="surface">{user.position.name}</Badge>
                )}
                {!user.isActive && <Badge tone="danger">Inactive</Badge>}
              </div>
            </CardContent>
          </Card>

          {registration && (
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
          )}
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {registration ? (
            <Card>
              <CardHeader>
                <CardTitle>Biodata Kampus</CardTitle>
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
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Data pendaftaran tidak ditemukan untuk anggota ini.</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Lifecycle Keanggotaan</CardTitle>
            </CardHeader>
            <CardContent>
              <MembershipTimeline logs={user.auditLogs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
