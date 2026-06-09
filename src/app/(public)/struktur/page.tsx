import { Card, CardContent } from '@/components/ui/card'
import { ButtonLink } from '@/components/ui/button'
import { ArrowRight, Users } from 'lucide-react'
import { prisma } from '@/core/database/prisma'
import type { Prisma } from '@prisma/client'

export const metadata = {
  title: 'Struktur Pengurus - IKMI Cirebon',
  description: 'Daftar pengurus kabinet IKMI Cirebon.',
}

export const dynamic = 'force-dynamic'

export default async function PengurusPage() {
  // Fetch Departments, their Positions, and Users with Profiles
  const departments = await prisma.department.findMany({
    include: {
      positions: {
        include: {
          users: {
            where: { isActive: true },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    // We can order departments or just let them be
  })

  // Grouping logic:
  // We can just iterate through departments, and for each department iterate through its positions and users.
  // We might want to handle users who have no department (e.g. BPH maybe, if they don't have departmentId set)
  // Let's also fetch users with position but NO department.
  const bphUsers = await prisma.user.findMany({
    where: { isActive: true, position: { departmentId: null } },
    include: { position: true },
    orderBy: { createdAt: 'asc' }
  })

  return (
    <main className="bg-background min-h-screen">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-20 text-center md:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent mb-4 flex items-center justify-center gap-2">
            <Users className="h-4 w-4" /> Struktur Organisasi
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-surface sm:text-5xl md:text-6xl">
            Kabinet Sri Nawikasa
          </h1>
          <p className="mt-6 text-base leading-relaxed text-surface/80 md:text-lg">
            Mengenal lebih dekat para penggerak roda organisasi IKMI Cirebon. 
            Mahasiswa dari berbagai kampus dan kecamatan yang bersatu untuk mengabdi.
          </p>
        </div>
      </section>

      {/* ─── DAFTAR PENGURUS ─────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px] space-y-20">
          
          {/* BPH (Non-Department) */}
          {bphUsers.length > 0 && (
            <div className="space-y-8">
              <h2 className="font-heading text-2xl font-bold text-primary border-b border-line pb-4">
                Badan Pengurus Harian
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {bphUsers.map((user) => (
                  <KabinetCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}

          {/* Departments */}
          {departments.map((dept) => {
            // Collect all active users in this department
            const deptUsers = dept.positions.flatMap(p => p.users.map(u => ({...u, position: p})))
            if (deptUsers.length === 0) return null

            return (
              <div key={dept.id} className="space-y-8">
                <div className="space-y-2 border-b border-line pb-4">
                  <h2 className="font-heading text-2xl font-bold text-primary">
                    Departemen {dept.name}
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {deptUsers.map((user) => (
                    <KabinetCard key={user.id} user={user} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── CTA KONVERSI ────────────────────────────────────────────────── */}
      <section className="bg-background-warm px-4 py-20 md:px-6 md:py-28 lg:px-8 text-center border-t border-line">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-heading text-3xl font-extrabold text-primary md:text-5xl">
            Ingin Menjadi Bagian dari Kami?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-primary/70 md:text-lg">
            Terbuka kesempatan untuk belajar, berorganisasi, dan mengembangkan diri 
            bersama IKMI Cirebon.
          </p>
          <ButtonLink 
            href="/gabung" 
            className="mt-10 px-8 py-3 text-base"
          >
            Daftar Menjadi Anggota
            <ArrowRight className="ml-2 h-5 w-5" />
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}

function KabinetCard({
  user,
}: {
  user: Prisma.UserGetPayload<{ include: { position: true } }> & {
    profile?: { university?: string | null; major?: string | null; district?: string | null } | null
  }
}) {
  const names = user.name.split(' ')
  const initials = names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0].slice(0, 2).toUpperCase()
  
  return (
    <Card className="h-full transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
      <div className="h-24 bg-gradient-to-r from-primary/10 to-accent/10 w-full" />
      <CardContent className="flex flex-col items-center gap-4 p-6 pt-0 text-center flex-grow">
        {/* Avatar placeholder */}
        <div
          className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-extrabold text-surface ring-4 ring-surface"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="space-y-1 w-full">
          <p className="font-heading text-lg font-bold text-primary">
            {user.name}
          </p>
          <p className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-3">
            {user.position?.name || 'Pengurus'}
          </p>
          
          <div className="space-y-2 text-sm text-left bg-background-warm p-4 rounded-xl mt-4 border border-line">
            <div className="grid grid-cols-[1fr_2fr] gap-2 border-b border-line/50 pb-2">
              <span className="text-muted font-medium">Kampus</span>
              <span className="text-primary font-semibold text-right truncate" title={user.profile?.university || '-'}>
                {user.profile?.university || '-'}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-2 border-b border-line/50 pb-2">
              <span className="text-muted font-medium">Jurusan</span>
              <span className="text-primary font-semibold text-right truncate" title={user.profile?.major || '-'}>
                {user.profile?.major || '-'}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <span className="text-muted font-medium">Kecamatan</span>
              <span className="text-primary font-semibold text-right truncate" title={user.profile?.district || '-'}>
                {user.profile?.district || '-'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
