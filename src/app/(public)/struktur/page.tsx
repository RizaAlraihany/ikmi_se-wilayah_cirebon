import { ButtonLink } from '@/components/ui/button'
import { ArrowRight, Users } from 'lucide-react'
import { prisma } from '@/core/database/prisma'
import type { Prisma } from '@prisma/client'
import { masterDataSeed } from '../../../../prisma/master-data.generated'
import { StrukturCard, type StrukturCardMember } from './struktur-card'
import { DepartmentGrid, type DepartmentData } from './department-grid'

export const metadata = {
  title: 'Struktur Pengurus - IKMI Cirebon',
  description: 'Daftar pengurus kabinet IKMI Cirebon.',
}

export const dynamic = 'force-dynamic'



const publicDepartmentNames: Record<string, string> = {
  HPM: 'Hubungan & Pengabdian Masyarakat',
  KAJ: 'Kajian & Advokasi',
  KOMDIGI: 'Komunikasi & Digitalisasi',
  PSDA: 'Pengembangan Sumber Daya Anggota',
  EKRAF: 'Ekonomi Kreatif',
}

const publicPositionDepartmentNames: Record<string, string> = {
  HPM: 'HPM',
  KAJ: 'Kajian & Advokasi',
  KOMDIGI: 'Komdigi',
  PSDA: 'PSDA',
  EKRAF: 'Ekotif',
}

const structureDepartmentOrder = ['KAD', 'KAJ', 'PSDA', 'EKRAF', 'KOMDIGI', 'HPM']

const bphPositionOrder = new Map([
  ['ketum', 0],
  ['waketum', 1],
  ['sekum_1', 2],
  ['sekum_2', 3],
  ['bendum_1', 4],
  ['bendum_2', 5],
])



const memberDataByEmail = new Map(
  masterDataSeed.members.map((member) => [member.email.toLowerCase(), member]),
)

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

type PublicDepartmentRef = {
  id?: string | null
  code?: string | null
  name?: string | null
}

type PublicPositionRef = {
  id?: string | null
  name?: string | null
  departmentId?: string | null
  department?: PublicDepartmentRef | null
}

type KabinetUser = Prisma.UserGetPayload<{ include: { position: true } }> & {
  department?: PublicDepartmentRef | null
  position?: PublicPositionRef | null
  memberData?: {
    address?: string | null
    birthInfo?: string | null
    campus?: string | null
    sourceEmail?: string | null
  } | null
}

function toStrukturCardMember(user: KabinetUser): StrukturCardMember {
  return {
    id: user.id,
    name: user.name,
    positionName: publicPositionName(user),
    photoUrl: user.photoUrl,
    campus: user.memberData?.campus ?? null,
    address: user.memberData?.address ?? null,
  }
}

function publicDepartmentName(department: PublicDepartmentRef) {
  return department.code ? publicDepartmentNames[department.code] ?? department.name : department.name
}

function publicPositionName(user: {
  department?: PublicDepartmentRef | null
  position?: PublicPositionRef | null
}) {
  const departmentCode =
    user.department?.code ?? user.position?.department?.code ?? user.position?.departmentId
  const departmentName = departmentCode ? publicPositionDepartmentNames[departmentCode] : undefined

  if (!departmentName || !user.position?.id) return user.position?.name || 'Pengurus'

  if (user.position.id.startsWith('kadep_')) return `Ketua Departemen ${departmentName}`
  if (user.position.id.startsWith('sekdep_')) return `Sekretaris Departemen ${departmentName}`
  if (user.position.id.startsWith('anggota_')) return `Anggota Departemen ${departmentName}`

  return user.position.name || 'Pengurus'
}

function departmentSortValue(department: PublicDepartmentRef) {
  const index = structureDepartmentOrder.indexOf(department.code ?? department.id ?? '')
  return index === -1 ? structureDepartmentOrder.length : index
}

function bphSortValue(user: KabinetUser) {
  const order = user.position?.id ? bphPositionOrder.get(user.position.id) : undefined
  return order ?? bphPositionOrder.size
}

function departmentUserSortValue(user: KabinetUser) {
  let roleOrder = 2
  if (user.position?.id?.startsWith('kadep_')) roleOrder = 0
  else if (user.position?.id?.startsWith('sekdep_')) roleOrder = 1
  return roleOrder * 100 + (user.name || '').localeCompare(user.name || '', 'id-ID')
}

function attachMemberData<T extends { email: string; name: string }>(
  user: T,
  registrationByName: Map<string, { campus: string; address: string }>,
) {
  const seedMember = memberDataByEmail.get(user.email.toLowerCase())
  const registration = registrationByName.get(normalizeLookup(user.name))

  return {
    ...user,
    memberData: seedMember
      ? {
          ...seedMember,
          address: seedMember.address || registration?.address || null,
          campus: registration?.campus || null,
        }
      : registration
        ? {
            address: registration.address,
            birthInfo: null,
            campus: registration.campus,
            sourceEmail: user.email,
          }
        : null,
  }
}

export default async function PengurusPage() {
  // Fetch Departments, their Positions, and Users with Profiles
  const departments = await prisma.department.findMany({
    include: {
      positions: {
        include: {
          users: {
            where: {
              isActive: true,
              deletedAt: null,
            },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    // We can order departments or just let them be
  })
  const sortedDepartments = departments
    .filter((department) => department.code !== 'BPH' && department.id !== 'BPH')
    .sort((a, b) => departmentSortValue(a) - departmentSortValue(b))

  // Grouping logic:
  // We can just iterate through departments, and for each department iterate through its positions and users.
  // We might want to handle users who have no department (e.g. BPH maybe, if they don't have departmentId set)
  // Let's also fetch users with position but NO department.
  const bphUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      OR: [
        { departmentId: 'BPH' },
        { position: { departmentId: 'BPH' } },
        { position: { departmentId: null } },
      ],
    },
    include: { position: true },
    orderBy: { createdAt: 'asc' }
  })
  const activeStructureNames = [
    ...bphUsers.map((user) => user.name),
    ...sortedDepartments.flatMap((department) =>
      department.positions.flatMap((position) => position.users.map((user) => user.name)),
    ),
  ]
  const registrations = await prisma.registration.findMany({
    where: {
      deletedAt: null,
      fullName: { in: activeStructureNames },
    },
    select: {
      fullName: true,
      campus: true,
      address: true,
    },
  })
  const registrationByName = new Map(
    registrations.map((registration) => [normalizeLookup(registration.fullName), registration]),
  )
  const sortedBphUsers = bphUsers
    .map((user) => attachMemberData(user, registrationByName))
    .sort((a, b) => bphSortValue(a) - bphSortValue(b))
  const bphLeaders = sortedBphUsers.filter(
    (user) => user.positionId === 'ketum' || user.positionId === 'waketum',
  )
  const bphOfficers = sortedBphUsers.filter(
    (user) => user.positionId !== 'ketum' && user.positionId !== 'waketum',
  )

  return (
    <main className="bg-background min-h-screen">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-hero px-4 pb-5 pt-12 text-center sm:px-6 md:pb-6 md:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/90 md:mb-4 md:gap-2 md:text-sm">
            <Users className="h-3.5 w-3.5 md:h-4 md:w-4" /> Struktur Organisasi
          </p>
          <h1 className="mb-3 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:mb-4 md:text-5xl lg:text-6xl">
            Kabinet Sri Nawikasa
          </h1>
          <p className="mt-4 text-sm leading-6 text-surface/80 md:mt-6 md:text-lg md:leading-relaxed">
            Mengenal lebih dekat para penggerak roda organisasi IKMI Cirebon.
            Mahasiswa dari berbagai kampus dan kecamatan yang bersatu untuk mengabdi.
          </p>
        </div>
      </section>

      {/* ─── DAFTAR PENGURUS ─────────────────────────────────────────────── */}
      <section className="bg-surface-alt px-4 pb-10 pt-6 sm:px-6 md:pb-24 md:pt-8 lg:px-8">
        <div className="mx-auto max-w-[1200px] space-y-8 md:space-y-12">

          {/* BPH (Non-Department) */}
          {sortedBphUsers.length > 0 && (
            <div className="space-y-5 md:space-y-8">
              <h2 className="border-b border-border pb-3 font-heading text-lg font-bold tracking-tight text-primary sm:text-2xl md:pb-4">
                Badan Pengurus Harian
              </h2>
              <div className="grid grid-cols-2 justify-center gap-3 sm:flex sm:flex-wrap sm:gap-6">
                {bphLeaders.map((user) => (
                  <StrukturCard key={user.id} member={toStrukturCardMember(user)} />
                ))}
              </div>
              {bphOfficers.length > 0 && (
                <div className="grid grid-cols-2 justify-center gap-3 sm:gap-6 sm:[grid-template-columns:repeat(auto-fit,minmax(220px,280px))]">
                  {bphOfficers.map((user) => (
                    <StrukturCard key={user.id} member={toStrukturCardMember(user)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Departments */}
          {sortedDepartments.length > 0 && (
            <DepartmentGrid
              departments={sortedDepartments
                .map((dept): DepartmentData | null => {
                  const deptUsers = dept.positions
                    .flatMap((p) =>
                      p.users.map((u) =>
                        attachMemberData({ ...u, position: p, department: dept }, registrationByName),
                      ),
                    )
                    .sort((a, b) => {
                      const orderA = departmentUserSortValue(a)
                      const orderB = departmentUserSortValue(b)
                      if (orderA !== orderB) return orderA - orderB
                      return a.name.localeCompare(b.name, 'id-ID')
                    })

                  if (deptUsers.length === 0) return null

                  const iconType = dept.code as DepartmentData['iconType']
                  const publicName = publicDepartmentName(dept)

                  let description = ''
                  if (dept.code === 'KAD') description = 'Bertanggung jawab atas proses rekrutmen, pembinaan, serta pengembangan karakter keorganisasian anggota.'
                  if (dept.code === 'KAJ') description = 'Menjembatani aspirasi mahasiswa, mengkaji isu-isu strategis, dan memberikan pendampingan kesejahteraan.'
                  if (dept.code === 'PSDA') description = 'Mewadahi antusiasme non-akademik di bidang e-sports, olahraga lapangan, seni, hingga minat bakat lainnya.'
                  if (dept.code === 'EKRAF') description = 'Berfokus pada kemandirian finansial organisasi melalui kewirausahaan, merchandise, dan inovasi bisnis.'
                  if (dept.code === 'KOMDIGI') description = 'Mengelola branding media sosial resmi, publikasi event, dokumentasi kegiatan, serta pembuatan aset digital.'
                  if (dept.code === 'HPM') description = 'Membangun relasi eksternal organisasi serta merancang program pengabdian sosial berdampak bagi masyarakat.'

                  // Cari Kadiv
                  const kadivUser = deptUsers.find((u) => u.position?.id?.startsWith('kadep_'))
                  const kadivName = kadivUser ? kadivUser.name : 'Belum Ditunjuk'

                  return {
                    id: dept.id,
                    code: dept.code ?? '',
                    name: publicName ?? dept.name ?? 'Departemen',
                    description,
                    iconType,
                    memberCount: deptUsers.length,
                    kadivName,
                    users: deptUsers.map((u) => toStrukturCardMember(u)),
                  }
                })
                .filter((d): d is DepartmentData => d !== null)}
            />
          )}
        </div>
      </section>

      {/* ─── CTA KONVERSI ────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-surface-alt px-4 py-10 text-center sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <div className="mb-4 space-y-2 md:mb-16 md:space-y-3 md:text-center">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-primary sm:text-3xl md:text-4xl">
              Ingin Menjadi Bagian dari Kami?
            </h2>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-primary/70 md:mt-6 md:text-lg md:leading-relaxed">
            Terbuka kesempatan untuk belajar, berorganisasi, dan mengembangkan diri
            bersama IKMI Cirebon.
          </p>
          <ButtonLink
            href="/gabung"
            className="mt-6 min-h-10 px-6 py-2.5 text-sm md:mt-10 md:min-h-11 md:px-8 md:py-3 md:text-base"
          >
            Daftar Menjadi Anggota
            <ArrowRight className="ml-1 h-4 w-4 md:ml-2 md:h-5 md:w-5" />
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}
