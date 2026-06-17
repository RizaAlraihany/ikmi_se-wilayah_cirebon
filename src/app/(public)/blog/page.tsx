import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { BlogList } from '../_components/blog-list'
import { postQueries } from '@/features/blog/queries'

export const metadata = {
  title: 'Blog dan Ruang Gagasan - IKMI Cirebon',
  description: 'Kumpulan opini, kajian, berita, dan pemikiran dari anggota IKMI Cirebon.',
}

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const posts = await postQueries.getPublishedPosts()

  // We map posts to ensure they can be serialized to Client Component correctly
  const serializedPosts = posts.map(p => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    content: p.content,
    thumbnailUrl: p.thumbnailUrl,
    publishedAt: p.publishedAt,
    author: {
      name: p.author.name,
      position: p.author.position?.name ?? null,
    },
    category: {
      slug: p.category.slug,
      name: p.category.name,
    }
  }))

  return (
    <main className="bg-background min-h-screen">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <section className="pb-0">
        <div
          className="relative min-h-[230px] overflow-hidden bg-primary pb-16 pt-12 shadow-soft md:min-h-[310px] md:pb-20 md:pt-20 lg:min-h-[330px]"
          style={{
            backgroundImage: 'url("/images/blog-hero-city.png")',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <div className="absolute inset-0 bg-primary/80" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary via-secondary/80 to-primary/30"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-inverse md:text-xs">
              Beranda <span className="mx-2 text-text-inverse/50">/</span> Blog
            </p>
            <h1 className="mt-4 max-w-2xl font-heading text-[2rem] font-extrabold leading-[1.08] text-text-inverse sm:text-[2.35rem] md:text-[2.75rem] lg:text-[3rem]">
              Kanal Intelektual
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-text-inverse/80 md:text-[0.95rem] md:leading-7">
              Arsip publikasi berita, gagasan opini kritis, serta rilis media resmi IKMI Se-Wilayah Cirebon.
            </p>
          </div>
        </div>
      </section>

      {/* ─── DAFTAR ARTIKEL ──────────────────────────────────────────────── */}
      <section className="px-4 pb-8 pt-0 md:px-6 md:pb-14 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <BlogList initialPosts={serializedPosts} />
        </div>
      </section>

      {/* ─── CTA KONVERSI ────────────────────────────────────────────────── */}
      <section className="public-cta px-4 pb-12 pt-16 text-center md:px-6 md:pb-16 md:pt-20 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-heading text-2xl font-extrabold text-surface md:text-5xl">
            Sumbangkan Gagasanmu
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-surface/80 md:mt-6 md:text-lg md:leading-relaxed">
            Setiap anggota IKMI berhak dan didorong untuk menulis di ruang gagasan ini. 
            Bergabunglah dan suarakan pemikiranmu.
          </p>
          <ButtonLink 
            href="/gabung" 
            className="mt-6 min-h-10 bg-surface px-6 py-2.5 text-sm !text-primary hover:bg-surface/90 md:mt-10 md:min-h-11 md:px-8 md:py-3 md:text-base"
          >
            Gabung Bersama IKMI
            <ArrowRight className="ml-1 h-4 w-4 md:ml-2 md:h-5 md:w-5" />
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}
