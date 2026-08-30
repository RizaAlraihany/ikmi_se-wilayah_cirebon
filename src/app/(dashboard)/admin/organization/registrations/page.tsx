import { prisma } from '@/core/database/prisma'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { REGISTRATION_STATUS_LABELS as statusLabelMap, REGISTRATION_STATUS_TONES as statusColorMap } from '@/features/registration/domain'
import { requireRegistrationReviewAccess } from '@/features/registration/access'

export const metadata = {
  title: 'Data Pendaftaran - Admin',
}

export default function AdminRegistrationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Pendaftaran Anggota</h1>
          <p className="text-sm text-muted-foreground">Kelola pendaftaran anggota baru IKMI Cirebon.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <RegistrationTable />
      </div>
    </div>
  )
}

async function RegistrationTable() {
  await requireRegistrationReviewAccess()

  const registrations = await prisma.registration.findMany({
    where: { deletedAt: null }, orderBy: { createdAt: 'desc' },
  })

  if (registrations.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Belum ada pendaftaran.
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-3 p-4 md:hidden">
        {registrations.map((reg) => (
          <article key={reg.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h2 className="truncate font-semibold text-primary">{reg.fullName}</h2><p className="mt-1 text-xs text-muted-foreground">{reg.registrationNumber || '-'} · {reg.campus}</p></div>
              <Badge tone={statusColorMap[reg.status]}>{statusLabelMap[reg.status]}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span>{format(reg.createdAt, 'dd MMM yyyy', { locale: localeId })}</span><Link href={`/admin/organization/registrations/${reg.id}`}><Button variant="outline" size="sm">Detail</Button></Link></div>
          </article>
        ))}
      </div>
      <div className="hidden md:block">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-6 py-3 font-medium">Tanggal</th>
            <th className="px-6 py-3 font-medium">Nomor / Nama</th>
            <th className="px-6 py-3 font-medium">Kampus</th>
            <th className="px-6 py-3 font-medium">Status</th>
            <th className="px-6 py-3 text-right font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {registrations.map((reg) => (
            <tr key={reg.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                {format(reg.createdAt, 'dd MMM yyyy', { locale: localeId })}
              </td>
              <td className="px-6 py-4">
                <div className="font-semibold text-primary">{reg.fullName}</div>
                <div className="text-xs text-muted-foreground">{reg.registrationNumber || '-'}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-primary">{reg.campus}</div>
                <div className="text-xs text-muted-foreground">{reg.major} ({reg.semester})</div>
              </td>
              <td className="px-6 py-4">
                <Badge tone={statusColorMap[reg.status]}>
                  {statusLabelMap[reg.status]}
                </Badge>
              </td>
              <td className="px-6 py-4 text-right">
                <Link href={`/admin/organization/registrations/${reg.id}`}>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Detail</span>
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}
