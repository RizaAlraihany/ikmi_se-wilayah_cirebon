import type { LucideIcon } from 'lucide-react'
import {
  ArrowUpRight,
  BookOpen,
  Compass,
  Quote,
  Shield,
  Users,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { defaultWebConfig } from '@/features/web-config/default-config'
import { webConfigQueries } from '@/features/web-config/queries'

export const metadata = {
  title: 'Tentang Kami - IKMI Cirebon',
  description: 'Sejarah, Visi, Misi, dan Nilai Organisasi IKMI Cirebon.',
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

type MisiPoint = {
  num: string
  title: string
  description: string
}

type PhilosophyElement = {
  word: string
  meaning: string
  desc: string
}

type CoreValue = {
  title: string
  desc: string
  Icon: LucideIcon
}

type TimelineItem = {
  period: string
  meta: string
  title: string
  desc: string
  active?: boolean
}

const misiPoints: MisiPoint[] = [
  {
    num: '01',
    title: 'Mengembangkan Kapasitas Intelektual',
    description:
      'Mengembangkan kapasitas intelektual mahasiswa melalui kegiatan diskusi, kajian ilmiah, pelatihan, dan riset yang berpijak pada persoalan daerah.',
  },
  {
    num: '02',
    title: 'Menumbuhkan Kesadaran Identitas',
    description:
      'Menumbuhkan kesadaran historis, sosial, dan kultural terhadap daerah sebagai bagian dari identitas dan tanggung jawab mahasiswa.',
  },
  {
    num: '03',
    title: 'Mendorong Sikap Kritis & Solutif',
    description:
      'Mendorong sikap kritis, progresif, dan solutif dalam merespons isu-isu daerah, nasional, maupun global.',
  },
  {
    num: '04',
    title: 'Wadah Konsolidasi Jejaring',
    description:
      'Menjadi wadah konsolidasi mahasiswa daerah untuk membangun jejaring intelektual, sosial, dan advokasi kebijakan yang berpihak pada kepentingan masyarakat daerah.',
  },
  {
    num: '05',
    title: 'Implementasi Nilai Pengabdian',
    description:
      'Mengimplementasikan nilai keilmuan dan pengabdian melalui program pengabdian masyarakat berbasis kebutuhan dan potensi daerah.',
  },
]

const philosophyElements: PhilosophyElement[] = [
  {
    word: 'Sri',
    meaning: 'Keberkahan & Kesejahteraan',
    desc: 'Mencerminkan harapan agar kabinet ini mampu membawa keberkahan, kejayaan, serta kesejahteraan bagi seluruh anggota dan masyarakat.',
  },
  {
    word: 'Nanggala',
    meaning: 'Ketajaman Visi & Strategi Matang',
    desc: 'Nanggala secara historis merujuk pada senjata tombak atau kekuatan utama dalam peperangan. Filosofinya adalah ketajaman visi, ketegasan sikap, serta kesiapan dalam menghadapi berbagai tantangan organisasi dengan strategi yang matang.',
  },
  {
    word: 'Wira',
    meaning: 'Pahlawan & Semangat Pengabdian',
    desc: 'Wira berarti pahlawan atau sosok pemberani. Ini menggambarkan karakter anggota kabinet yang memiliki keberanisan, jiwa kepemimpinan, dan semangat pengabdian tanpa pamrih.',
  },
  {
    word: 'Perkasa',
    meaning: 'Kuat & Tidak Mudah Goyah',
    desc: 'Perkasa bermakna kuat, tangguh, dan tidak mudah goyah. Kata ini menegaskan bahwa kabinet diharapkan memiliki ketahanan, soliditas, serta kekuatan dalam menjalankan amanah dan menghadapi dinamika organisasi.',
  },
]

const coreValues: CoreValue[] = [
  {
    title: 'Kemahasiswaan',
    desc: 'Meningkatkan kualitas intelektual mahasiswa.',
    Icon: BookOpen,
  },
  {
    title: 'Kekeluargaan',
    desc: 'Mempererat solidaritas dan kebersamaan.',
    Icon: Users,
  },
  {
    title: 'Kedaerahan',
    desc: 'Menjaga identitas dan melestarikan nilai daerah.',
    Icon: Compass,
  },
  {
    title: 'Sosial',
    desc: 'Berperan aktif dalam kegiatan sosial dan pengabdian masyarakat.',
    Icon: Shield,
  },
]

const timelineItems: TimelineItem[] = [
  {
    period: 'DARI DEKADE 2010an',
    meta: 'ERA RUMPUN PAGUYUBAN',
    title: 'Kelahiran Pergerakan & Silaturahmi Kamar Rantau',
    desc: 'Berawal dari forum silaturahmi informal mingguan dikoordinasikan antarkampus UGJ, IAIN, dan UMC guna membantu mahasiswa baru beradaptasi di Cirebon. Forum ini menyatukan simpul kekeluargaan dan meringankan tantangan perantauan.',
  },
  {
    period: 'DESEMBER 2018',
    meta: 'KURSUS TIANG UTAMA',
    title: 'Transformasi Konstitusional & AD/ART Berdaulat',
    desc: 'Formalisasi mutlak Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) secara independen, meresmikan pranata struktur kepengurusan Se-Wilayah Cirebon secara tersistem demi merespon tantangan organisasi modern.',
  },
  {
    period: 'KINI & MASA DEPAN',
    meta: 'DART DIGITAL ADVERTISMENT',
    title: 'Akselerasi Kabinet Sri Nanggala Wira Perkasa',
    desc: 'Mengusung nilai luhur kepemimpinan yang berwibawa, inovatif, dan berfokus pada kesejahteraan daerah pesisir, serta rilis riset digital terpadu demi menyumbang sumbangsih nyata ke Pemkab Indramayu.',
    active: true,
  },
]

export default async function TentangPage() {
  const landingHero = await getConfig('landing_hero', defaultWebConfig.landing_hero)
  const heroImage =
    landingHero.slides?.[1]?.url ?? landingHero.slides?.[0]?.url ?? '/images/blog-hero-city.png'

  return (
    <main className="min-h-screen bg-background" id="tentang-page">
      <section
        className="relative isolate bg-cover bg-center px-4 py-14 text-left md:px-6 md:py-20 lg:px-8"
        style={{ backgroundImage: `url('${heroImage}')` }}
      >
        <div className="absolute inset-0 -z-10 bg-primary/80" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-secondary/85 to-primary/35" />
        <div className="mx-auto max-w-[1200px] space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-surface/75 md:text-xs">
            <span>Beranda</span>
            <span className="text-surface/45">/</span>
            <span className="text-surface">Tentang Kami</span>
          </div>
          <h1 className="max-w-3xl font-heading text-3xl font-extrabold leading-tight text-surface md:text-5xl">
            Tentang IKMI Cirebon
          </h1>
          <p className="max-w-xl text-sm leading-6 text-surface/80 md:text-base md:leading-7">
            Menyelami arah darmabakti, struktur kabinet, perumusan visi utama, serta sejarah pergerakan organisasi kedaerahan.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 md:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-16 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="space-y-5 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-alt px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Visi Utama Organisasi
                </span>
              </div>

              <div className="relative border-l-2 border-accent py-1 pl-5 md:pl-7">
                <Quote className="absolute -left-3 -top-3 h-7 w-7 rotate-180 text-border" aria-hidden="true" />
                <blockquote className="font-heading text-lg font-semibold italic leading-relaxed text-primary md:text-2xl">
                  &quot;Mewujudkan organisasi mahasiswa kedaerahan yang berperan sebagai ruang pengembangan intelektual, penguatan identitas daerah, serta penggerak kesadaran kritis dan kontribusi nyata bagi kemajuan daerah.&quot;
                </blockquote>
                <div className="mt-4 flex items-center gap-3">
                  <span className="h-px w-8 bg-border" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                    Kabinet Sri Nanggala Wira Perkasa
                  </p>
                </div>
              </div>

              <p className="max-w-3xl text-sm leading-7 text-text-secondary">
                Visi ini dirakit sebagai falsafah perjuangan kolektif yang mengintegrasikan tiga pilar esensial pergerakan mahasiswa kedaerahan saat ini. Pondasi awal dimulai dengan menyediakan wadah yang memfasilitasi pengembangan intelektual secara akademis maupun non-akademis. Di saat yang sama, komunitas ini memperkokoh penguatan identitas daerah agar para kader tetap menjaga nilai budaya tanah kelahiran. Kesadaran kritis mahasiswa juga dipacu secara konsisten agar peka terhadap dinamika sosial di sekitarnya. Melalui sinergi komprehensif ini, seluruh elemen kepengurusan bergerak bersama guna menyalurkan kontribusi nyata demi kemajuan daerah asal. Wadah ini pun bertransformasi menjadi katalisator perubahan yang melahirkan generasi pemimpin masa depan berkarakter cerdas, solutif, serta berdedikasi tinggi. Upaya masif tersebut dilakukan dengan menanamkan nilai luhur gotong royong, rasa kepedulian sosial yang mendalam, serta komitmen penuh dalam mengabdi pada kemaslahatan masyarakat luas.
              </p>
            </div>

            <aside className="space-y-6 rounded-3xl bg-surface p-6 ring-1 ring-border lg:col-span-5 md:p-8">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-text-muted">
                  Filosofi Nama Kabinet
                </p>
                <h2 className="mt-1 font-heading text-xl font-extrabold text-primary">
                  Sri Nanggala Wira Perkasa
                </h2>
              </div>

              <div className="space-y-5">
                {philosophyElements.map((elem) => (
                  <div key={elem.word} className="border-l border-border pl-4">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h3 className="font-heading text-base font-extrabold text-primary">{elem.word}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                        {elem.meaning}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-6 text-text-secondary">{elem.desc}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="mb-16 border-y border-border py-10">
            <div className="mb-9 space-y-4">
              <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                Pilar Utama Organisasi
              </span>
              <div className="grid gap-4 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:items-start md:gap-8">
                <h2 className="font-heading text-2xl font-extrabold leading-tight text-primary md:border-r md:border-border md:pr-8 md:text-3xl">
                  Garis Besar Haluan IKMI se-wilayah cirebon
                </h2>
                <p className="max-w-md text-sm leading-6 text-text-secondary md:pt-1">
                  Arus kemudi pergerakan organisasi yang mengikat erat empat sendi darmabakti demi kesinambungan visi luhur Bumi Wiralodra.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {coreValues.map(({ title, desc, Icon }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary">{title}</h3>
                    <p className="text-xs leading-5 text-text-secondary">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <div className="mb-9 space-y-4">
              <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                Darmabakti
              </span>
              <div className="grid gap-4 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:items-start md:gap-8">
                <h2 className="font-heading text-2xl font-extrabold leading-tight text-primary md:border-r md:border-border md:pr-8 md:text-3xl">
                  Lima Tiang <br /> Pengabdian Strategis
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-text-secondary md:pt-1">
                Misi luhur IKMI se-wilayah Cirebon diartikulasikan dalam lima poros gerak strategis. Setiap poros dirancang sebagai acuan kerja konkret eksekutif dalam merefleksikan pengabdian tulus bagi daerah.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {misiPoints.map((point) => (
                <div
                  key={point.num}
                  className="flex flex-col gap-3 border-b border-border py-4 last:border-0 sm:flex-row sm:gap-5"
                >
                  <div className="shrink-0 font-heading text-2xl font-extrabold text-text-muted">
                    {point.num}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold tracking-wide text-primary">{point.title}</h3>
                    <p className="text-xs leading-6 text-text-secondary md:text-sm">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-surface md:p-10 lg:p-12">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-secondary/45 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
            <div className="relative grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="space-y-5 lg:col-span-5">
                <span className="inline-flex rounded bg-accent/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                  Kronologi Perjalanan
                </span>
                <h2 className="font-heading text-3xl font-extrabold leading-tight md:text-4xl">
                  Merajut Rantai Kebersamaan
                </h2>
                <div className="space-y-4 text-sm leading-7 text-surface/75">
                  <p>
                    IKMI Se-Wilayah Cirebon didirikan sebagai ikatan rasa rindu, tanggung jawab moral, dan dialektika kritis para mahasiswa asal Indramayu yang menempuh jalan studi di Kota Udang (Cirebon). Sejak awal perintisannya, organisasi ini memfokuskan tujuannya untuk mengikis sekat primordialisme kampus, mengumpulkan mahasiswa daerah asal Indramayu ke dalam satu dekap kehangatan kekeluargaan.
                  </p>
                  <p>
                    Seiring pergulatan waktu, IKMI bertransformasi menjadi laboratorium kepemimpinan yang tangguh. Melalui pembinaan rutin dan konsolidasi pemikiran, IKMI senantiasa mencetak kader-kader yang sadar akan pentingnya melestarikan identitas lokal Bumi Wiralodra serta menyumbangkan gagasan solutif demi pembangunan.
                  </p>
                </div>
                <ButtonLink href="/event" className="bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] !text-surface hover:bg-accent/90">
                  Jelajahi Aksi Nyata Kami
                  <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>

              <div className="space-y-8 border-l border-surface/15 pl-6 lg:col-span-7">
                {timelineItems.map((item) => (
                  <div key={item.title} className="relative space-y-2">
                    <span className="absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-surface/20 bg-primary">
                      <span className={`h-1.5 w-1.5 rounded-full bg-accent ${item.active ? 'animate-pulse' : ''}`} />
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-accent">
                      <span>{item.period}</span>
                      <span className="text-surface/35">/</span>
                      <span className="text-surface/55">{item.meta}</span>
                    </div>
                    <h3 className="font-heading text-base font-extrabold text-surface">{item.title}</h3>
                    <p className="max-w-xl text-xs leading-6 text-surface/65 md:text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

    </main>
  )
}
