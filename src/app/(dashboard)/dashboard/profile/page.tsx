import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Mail, ShieldCheck, UserCircle } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { prisma } from '@/core/database/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Profil Saya | IKMI Cirebon',
}

export default async function DashboardProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    include: {
      role: true,
      department: true,
      position: true,
    },
  })

  if (!user) redirect('/login')

  const avatarSrc = user.photoUrl || '/images/avatar-placeholder.png'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Profil Saya</h1>
        <p className="mt-1 text-sm text-muted">Identitas pengurus sesuai data organisasi IKMI.</p>
      </div>

      <Card>
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="relative h-32 w-32 overflow-hidden rounded-full bg-surface-alt ring-4 ring-surface shadow-sm">
            <Image
              src={avatarSrc}
              alt={user.name}
              fill
              className="object-cover object-top"
              sizes="128px"
              unoptimized
            />
          </div>

          <div className="min-w-0 space-y-4">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-primary">{user.name}</h2>
              <p className="mt-1 text-sm text-muted">{user.position?.name || 'Pengurus IKMI Cirebon'}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">{user.role.name}</Badge>
              {user.department ? <Badge tone="surface">{user.department.name}</Badge> : null}
            </div>

            <div className="grid gap-3 text-sm text-primary sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl bg-surface-alt px-3 py-2">
                <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-surface-alt px-3 py-2">
                {user.isActive ? (
                  <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
                ) : (
                  <UserCircle className="h-4 w-4 text-muted" aria-hidden="true" />
                )}
                <span>{user.isActive ? 'Aktif' : 'Nonaktif'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
