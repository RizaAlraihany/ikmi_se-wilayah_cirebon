import { prisma } from '@/core/database/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ArrowLeft, User, Phone, MapPin, GraduationCap, FileText, Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RegistrationDetailActions } from './registration-detail-actions'
import { REGISTRATION_STATUS_LABELS as statusLabelMap, REGISTRATION_STATUS_TONES as statusColorMap } from '@/features/registration/domain'
import { requireRegistrationReviewAccess } from '@/features/registration/access'

export default async function RegistrationDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireRegistrationReviewAccess()
  const params = await props.params

  const registration = await prisma.registration.findUnique({
    where: { id: params.id, deletedAt: null },
    include: { member: { select: { id: true, membershipStatus: true } } },
  })

  if (!registration) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organization/registrations">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Detail Pendaftaran</h1>
          <p className="text-sm text-muted-foreground">{registration.registrationNumber || 'Belum ada nomor'}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary">{registration.fullName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge tone={statusColorMap[registration.status]}>
                      {statusLabelMap[registration.status]}
                    </Badge>
                    {registration.member?.membershipStatus === 'ACTIVE_MEMBER' ? <Badge tone="success">Anggota Aktif</Badge> : null}
                    <span className="text-xs text-muted-foreground">
                      Mendaftar: {format(registration.createdAt, 'dd MMM yyyy HH:mm', { locale: localeId })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Mail className="h-4 w-4" />Email</div><p className="break-all font-medium text-foreground">{registration.email ?? 'Tidak tersedia'}</p></div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  WhatsApp
                </div>
                <p className="font-medium text-foreground">{registration.whatsapp}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  Kampus
                </div>
                <p className="font-medium text-foreground">{registration.campus}</p>
                <p className="text-sm text-muted-foreground">{registration.major} · Masuk {registration.entryYear ?? '-'} · Semester {registration.semester}</p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Alamat Domisili
                </div>
                <p className="font-medium text-foreground">{[registration.village, registration.district, registration.address].filter(Boolean).join(', ')}</p>
              </div>

              {registration.organizationExperience ? <div className="space-y-1 sm:col-span-2"><p className="text-sm font-medium text-muted-foreground">Pengalaman Organisasi</p><p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-foreground">{registration.organizationExperience}</p></div> : null}
              {registration.interests ? <div className="space-y-1 sm:col-span-2"><p className="text-sm font-medium text-muted-foreground">Minat</p><p className="whitespace-pre-wrap text-foreground">{registration.interests}</p></div> : null}

              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Alasan / Motivasi
                </div>
                <p className="text-foreground whitespace-pre-wrap rounded-lg bg-muted/30 p-4 border border-border">
                  {registration.reasons}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <RegistrationDetailActions
            id={registration.id}
            status={registration.status}
          />
        </div>
      </div>
    </div>
  )
}
