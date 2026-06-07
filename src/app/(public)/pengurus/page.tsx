import { Card, CardContent } from '@/components/ui/card'
import { ButtonLink } from '@/components/ui/button'
import { ArrowRight, Users } from 'lucide-react'

export const metadata = {
  title: 'Struktur Pengurus - IKMI Cirebon',
  description: 'Daftar pengurus kabinet IKMI Cirebon.',
}

const kabinet = [
  {
    nama: 'Muhammad Naufal',
    jabatan: 'Ketua Umum',
    kampus: 'Universitas Swadaya Gunung Jati',
    jurusan: 'Ilmu Hukum',
    kecamatan: 'Indramayu',
    initials: 'MN',
  },
  {
    nama: 'Derly Agustian',
    jabatan: 'Wakil Ketua Umum',
    kampus: 'Universitas Gadjah Mada',
    jurusan: 'Teknik Sipil',
    kecamatan: 'Jatibarang',
    initials: 'DA',
  },
  {
    nama: 'Siti Rahmawati',
    jabatan: 'Sekretaris Umum',
    kampus: 'Universitas Islam Al-Ihya Kuningan',
    jurusan: 'Pendidikan Agama Islam',
    kecamatan: 'Sindang',
    initials: 'SR',
  },
  {
    nama: 'Fajar Nugraha',
    jabatan: 'Bendahara Umum',
    kampus: 'Universitas Muhammadiyah Cirebon',
    jurusan: 'Akuntansi',
    kecamatan: 'Karangampel',
    initials: 'FN',
  },
  {
    nama: 'Rina Karlina',
    jabatan: 'Kadep Kaderisasi',
    kampus: 'Institut Agama Islam Bunga Bangsa',
    jurusan: 'Manajemen Pendidikan',
    kecamatan: 'Krangkeng',
    initials: 'RK',
  },
  {
    nama: 'Ahmad Yusuf',
    jabatan: 'Kadep Komdigi',
    kampus: 'Universitas Swadaya Gunung Jati',
    jurusan: 'Teknik Informatika',
    kecamatan: 'Lohbener',
    initials: 'AY',
  },
  {
    nama: 'Dewi Lestari',
    jabatan: 'Kadep Sosial Masyarakat',
    kampus: 'IAIN Syekh Nurjati Cirebon',
    jurusan: 'Bimbingan Konseling Islam',
    kecamatan: 'Gabuswetan',
    initials: 'DL',
  },
  {
    nama: 'Budi Santoso',
    jabatan: 'Kadep Ekonomi Kreatif',
    kampus: 'Universitas 17 Agustus 1945 Cirebon',
    jurusan: 'Manajemen Bisnis',
    kecamatan: 'Haurgeulis',
    initials: 'BS',
  }
]

export default function PengurusPage() {
  return (
    <main className="bg-background">
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
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {kabinet.map((member) => (
              <KabinetCard key={member.nama} member={member} />
            ))}
          </div>
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
            href="/register" 
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
  member,
}: {
  member: {
    nama: string
    jabatan: string
    kampus: string
    jurusan: string
    kecamatan: string
    initials: string
  }
}) {
  return (
    <Card className="h-full transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
      <div className="h-24 bg-gradient-to-r from-primary/10 to-accent/10 w-full" />
      <CardContent className="flex flex-col items-center gap-4 p-6 pt-0 text-center flex-grow">
        {/* Avatar placeholder */}
        <div
          className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-extrabold text-surface ring-4 ring-surface"
          aria-hidden="true"
        >
          {member.initials}
        </div>
        <div className="space-y-1 w-full">
          <p className="font-heading text-lg font-bold text-primary">
            {member.nama}
          </p>
          <p className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-3">
            {member.jabatan}
          </p>
          
          <div className="space-y-2 text-sm text-left bg-background-warm p-4 rounded-xl mt-4 border border-line">
            <div className="grid grid-cols-[1fr_2fr] gap-2 border-b border-line/50 pb-2">
              <span className="text-muted font-medium">Kampus</span>
              <span className="text-primary font-semibold text-right truncate" title={member.kampus}>{member.kampus}</span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-2 border-b border-line/50 pb-2">
              <span className="text-muted font-medium">Jurusan</span>
              <span className="text-primary font-semibold text-right truncate" title={member.jurusan}>{member.jurusan}</span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <span className="text-muted font-medium">Kecamatan</span>
              <span className="text-primary font-semibold text-right truncate" title={member.kecamatan}>{member.kecamatan}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
