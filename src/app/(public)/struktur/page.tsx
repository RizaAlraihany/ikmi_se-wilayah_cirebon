import { ButtonLink } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { prisma } from '@/core/database/prisma'
import type { Prisma } from '@prisma/client'
import { defaultWebConfig } from '@/features/web-config/default-config'
import { webConfigQueries } from '@/features/web-config/queries'
import { masterDataSeed } from '../../../../prisma/master-data.generated'
import { StrukturCard, type StrukturCardMember } from './struktur-card'
import { DepartmentGrid, type DepartmentData } from './department-grid'

export const metadata = {
  title: 'Struktur Pengurus - IKMI Cirebon',
  description: 'Daftar pengurus kabinet IKMI Cirebon.',
}

export const dynamic = 'force-dynamic'

async function getConfig<T>(key: keyof typeof defaultWebConfig, fallback: T): Promise<T> {
  const config = await webConfigQueries.getWebConfigByKey(key)
  if (!config) return fallback
  try {
    return { ...fallback, ...JSON.parse(config.valueJson) }
  } catch {
    return fallback
  }
}

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
  const landingHero = await getConfig('landing_hero', defaultWebConfig.landing_hero)
  const fallbackHeroSlides = defaultWebConfig.landing_hero.slides.filter((slide) => slide.url)
  const configuredHeroSlides = landingHero.slides?.filter((slide) => slide.url) ?? []
  const structureHeroSlides = [...configuredHeroSlides, ...fallbackHeroSlides]
    .filter((slide, index, slides) => slides.findIndex((item) => item.url === slide.url) === index)
    .slice(0, 4)

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
      <section className="relative isolate overflow-hidden px-4 py-14 text-left sm:px-6 md:py-20 lg:px-8">
        <div className="absolute inset-0 -z-20 grid grid-cols-2" aria-hidden="true">
          {structureHeroSlides.map((slide, index) => (
            <div
              key={`${slide.url}-${index}`}
              className="min-h-full bg-cover bg-center"
              style={{ backgroundImage: `url('${slide.url}')` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-primary/82" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-secondary/85 to-primary/35" aria-hidden="true" />
        <div className="mx-auto max-w-[1200px] space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-surface/75 md:text-xs">
            <span>Beranda</span>
            <span className="text-surface/45">/</span>
            <span className="text-surface">Struktur Organisasi</span>
          </div>
          <h1 className="max-w-3xl font-heading text-3xl font-extrabold leading-tight tracking-tight text-surface md:text-5xl">
            Kabinet Sri Nawikasa
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-surface/80 md:text-base md:leading-7">
            Mengenal lebih dekat para penggerak roda organisasi IKMI Cirebon.
            Mahasiswa dari berbagai kampus dan kecamatan yang bersatu untuk mengabdi.
          </p>
        </div>
      </section>

      {/* ─── DAFTAR PENGURUS ─────────────────────────────────────────────── */}
      <section className="public-section-alt px-4 pb-10 pt-2 sm:px-6 md:pb-16 md:pt-4 lg:px-8">
        <div className="mx-auto max-w-[1200px] space-y-8 md:space-y-12">

          {/* BPH (Non-Department) */}
          {sortedBphUsers.length > 0 && (
            <div className="space-y-5 md:space-y-8">
              <div className="space-y-3">
                <h2 className="font-heading text-lg font-bold tracking-tight text-primary sm:text-2xl">
                  Badan Pengurus Harian
                </h2>
                <div className="soft-divider" aria-hidden="true" />
              </div>
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
      <section className="public-section-alt px-4 py-10 text-center sm:px-6 md:py-14 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <div className="mb-4 space-y-2 md:mb-8 md:space-y-3 md:text-center">
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
