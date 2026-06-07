import { MapPin, CalendarDays, ArrowRight, Target } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'

export const metadata = {
  title: 'Event dan Program Kerja - IKMI Cirebon',
  description: 'Daftar Event dan Program Kerja dari IKMI Cirebon.',
}

const agendaList = [
  {
    tanggal: '14 Jun',
    judul: 'Makrab & Penerimaan Anggota Baru',
    lokasi: 'Bumi Perkemahan Gunung Ciremai',
    deskripsi: 'Kegiatan orientasi dan pengenalan bagi mahasiswa baru asal Indramayu yang berkuliah di Cirebon.',
  },
  {
    tanggal: '21 Jun',
    judul: 'Kajian Isu Pesisir Utara',
    lokasi: 'Gedung Serbaguna IKMI',
    deskripsi: 'Diskusi publik mengenai tantangan sosial dan lingkungan di kawasan pesisir Indramayu-Cirebon.',
  },
  {
    tanggal: '5 Jul',
    judul: 'Rapat Koordinasi Lintas Departemen',
    lokasi: 'Sekretariat IKMI Cirebon',
    deskripsi: 'Evaluasi program kerja tengah tahun dan sinkronisasi agenda antar departemen pengurus.',
  },
  {
    tanggal: '17 Agu',
    judul: 'Bakti Sosial & Pengobatan Gratis',
    lokasi: 'Desa Krangkeng, Indramayu',
    deskripsi: 'Kegiatan pengabdian masyarakat berupa layanan kesehatan gratis dan pembagian sembako.',
  }
]

const programKerja = [
  {
    nama: 'Desa Binaan IKMI',
    departemen: 'Sosial Masyarakat',
    status: 'Berjalan',
  },
  {
    nama: 'IKMI Scholarship Mentoring',
    departemen: 'Kaderisasi',
    status: 'Berjalan',
  },
  {
    nama: 'Festival Budaya Dermayu',
    departemen: 'Ekonomi Kreatif',
    status: 'Perencanaan',
  },
  {
    nama: 'Pelatihan Jurnalistik Digital',
    departemen: 'Komdigi',
    status: 'Selesai',
  }
]

export default function KegiatanPage() {
  return (
    <main className="bg-background">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-20 text-center md:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent mb-4 flex items-center justify-center gap-2">
            <CalendarDays className="h-4 w-4" /> Jejak Langkah
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-surface sm:text-5xl md:text-6xl">
            Event & Program Kerja
          </h1>
          <p className="mt-6 text-base leading-relaxed text-surface/80 md:text-lg">
            Aksi nyata IKMI Cirebon dalam mengembangkan potensi anggota dan memberikan dampak 
            langsung kepada masyarakat.
          </p>
        </div>
      </section>

      {/* ─── EVENT / AGENDA ──────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12 flex items-center gap-4">
            <div className="h-10 w-2 bg-accent rounded-full" />
            <h2 className="font-heading text-3xl font-extrabold text-primary">Agenda Terdekat</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {agendaList.map((agenda) => (
              <div
                key={agenda.judul}
                className="flex flex-col sm:flex-row gap-5 rounded-2xl bg-surface p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] ring-1 ring-line transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
              >
                <div className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/8 text-center">
                  <span className="text-xs font-bold uppercase text-muted">
                    {agenda.tanggal.split(' ')[1]}
                  </span>
                  <span className="font-heading text-2xl font-extrabold text-primary">
                    {agenda.tanggal.split(' ')[0]}
                  </span>
                </div>
                <div className="space-y-2 min-w-0 flex-1">
                  <p className="font-heading text-xl font-bold text-primary leading-snug">
                    {agenda.judul}
                  </p>
                  <p className="text-sm text-muted">
                    {agenda.deskripsi}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-accent pt-2 border-t border-line">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    {agenda.lokasi}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROGRAM KERJA ───────────────────────────────────────────────── */}
      <section className="bg-background-warm px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12 flex items-center gap-4">
            <div className="h-10 w-2 bg-primary rounded-full" />
            <h2 className="font-heading text-3xl font-extrabold text-primary">Program Kerja Unggulan</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {programKerja.map((proker, idx) => (
              <div key={idx} className="bg-surface rounded-2xl p-6 ring-1 ring-line flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 text-primary">
                    <Target className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-primary">{proker.nama}</h3>
                  <p className="text-sm text-muted">Dept. {proker.departemen}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-line flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wide text-primary/60">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    proker.status === 'Berjalan' ? 'bg-green-100 text-green-700' :
                    proker.status === 'Selesai' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {proker.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA KONVERSI ────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-20 md:px-6 md:py-28 lg:px-8 text-center">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-heading text-3xl font-extrabold text-surface md:text-5xl">
            Mari Berkontribusi Nyata
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-surface/80 md:text-lg">
            Bergabunglah bersama kami dan jadilah bagian dari setiap program kerja dan agenda aksi nyata IKMI Cirebon.
          </p>
          <ButtonLink 
            href="/register" 
            className="mt-10 bg-surface !text-primary hover:bg-surface/90 px-8 py-3 text-base"
          >
            Gabung Bersama IKMI
            <ArrowRight className="ml-2 h-5 w-5" />
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}
