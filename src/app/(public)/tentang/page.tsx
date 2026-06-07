import Image from 'next/image'
import { BookOpen, Sparkles, Heart, ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'

export const metadata = {
  title: 'Tentang Kami - IKMI Cirebon',
  description: 'Sejarah, Visi, Misi, dan Nilai Organisasi IKMI Cirebon.',
}

export default function TentangPage() {
  return (
    <main className="bg-background" id="tentang-page">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-20 text-center md:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent mb-4">
            Tentang IKMI
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-surface sm:text-5xl md:text-6xl">
            Memayu Ing Jagat
          </h1>
          <p className="mt-6 text-base leading-relaxed text-surface/80 md:text-lg">
            Kami hadir bukan sekadar sebagai organisasi kedaerahan, melainkan ruang bertumbuh. 
            IKMI menyatukan mahasiswa Indramayu di Cirebon untuk menjadi penggerak kesadaran kritis, 
            menjaga nilai historis, dan membangun jejaring yang berdampak positif bagi kemajuan daerah.
          </p>
        </div>
      </section>

      {/* ─── SEJARAH ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 to-accent/10">
            <Image
              src="/ikmi-logo.png"
              alt="Sejarah IKMI"
              width={180}
              height={180}
              className="opacity-80"
            />
            <span className="absolute bottom-6 right-6 rounded-full bg-primary px-4 py-2 text-xs font-bold text-surface">
              Est. 2020
            </span>
          </div>
          <div className="space-y-6">
            <h2 className="font-heading text-3xl font-extrabold text-primary md:text-4xl">
              Sejarah IKMI
            </h2>
            <div className="space-y-4 text-base leading-[1.8] text-primary/70">
              <p>
                Ikatan Keluarga Mahasiswa Indramayu (IKMI) Se-Wilayah Cirebon didirikan sebagai respons 
                atas kebutuhan mahasiswa asal Indramayu yang menempuh pendidikan di Cirebon untuk 
                memiliki wadah silaturahmi, diskusi, dan aksi.
              </p>
              <p>
                Berdiri sejak tahun 2020, IKMI telah menjadi rumah kedua bagi ratusan mahasiswa yang 
                berasal dari berbagai kecamatan di Indramayu. Kami percaya bahwa kekuatan solidaritas 
                kedaerahan jika dipadukan dengan wawasan keilmuan akan menghasilkan karya nyata 
                untuk memajukan Indramayu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VISI & MISI ─────────────────────────────────────────────────── */}
      <section className="bg-background-warm px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px] grid gap-12 lg:grid-cols-2">
          {/* VISI */}
          <div className="space-y-6 bg-surface p-8 rounded-3xl shadow-sm border border-line">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-3xl font-extrabold text-primary">Visi</h2>
            <p className="text-base leading-[1.8] text-primary/70">
              Mewujudkan organisasi mahasiswa daerah yang inklusif, progresif, dan berdaya saing 
              sebagai katalisator perubahan sosial di Indramayu melalui kolaborasi di tanah Cirebon.
            </p>
          </div>

          {/* MISI */}
          <div className="space-y-6 bg-surface p-8 rounded-3xl shadow-sm border border-line">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-3xl font-extrabold text-primary">Misi</h2>
            <ul className="space-y-4 text-base leading-[1.8] text-primary/70 list-disc pl-5">
              <li>Membangun solidaritas dan kepedulian antar mahasiswa Indramayu di Cirebon.</li>
              <li>Meningkatkan kapasitas akademik, intelektual, dan kepemimpinan anggota.</li>
              <li>Menjaga dan melestarikan nilai-nilai kearifan lokal Indramayu.</li>
              <li>Memberikan kontribusi nyata berupa pengabdian masyarakat.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── NILAI ORGANISASI ────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-6 md:py-24 lg:px-8 text-center">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="font-heading text-3xl font-extrabold text-primary md:text-4xl mb-12">
            Nilai Organisasi
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Heart,
                title: 'Humanis',
                desc: 'Menjunjung tinggi nilai kemanusiaan, empati, dan kepedulian terhadap sesama.',
                color: 'text-accent',
                bg: 'bg-accent/10'
              },
              {
                icon: BookOpen,
                title: 'Akademis',
                desc: 'Mengedepankan nalar kritis, riset, dan budaya literasi dalam setiap tindakan.',
                color: 'text-primary',
                bg: 'bg-primary/10'
              },
              {
                icon: Sparkles,
                title: 'Progresif',
                desc: 'Terus berinovasi dan tidak anti terhadap perubahan zaman demi kemajuan.',
                color: 'text-green-600',
                bg: 'bg-green-100'
              }
            ].map((nilai, idx) => (
              <div key={idx} className="flex flex-col items-center gap-4 p-6">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${nilai.bg} ${nilai.color}`}>
                  <nilai.icon className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-xl font-bold text-primary">{nilai.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{nilai.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA KONVERSI ────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-20 md:px-6 md:py-28 lg:px-8 text-center">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-heading text-3xl font-extrabold text-surface md:text-5xl">
            Mari Bergabung dan Tumbuh Bersama
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-surface/80 md:text-lg">
            Jadilah bagian dari keluarga besar IKMI Cirebon. Mari kita rajut persaudaraan 
            dan ciptakan dampak positif untuk Indramayu.
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
