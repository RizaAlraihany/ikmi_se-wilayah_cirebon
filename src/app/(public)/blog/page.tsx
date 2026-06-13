import { BookOpen, ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { prisma } from '@/core/database/prisma'
import { BlogList } from '../_components/blog-list'
import { postQueries } from '@/features/blog/queries'

export const metadata = {
  title: 'Blog dan Ruang Gagasan - IKMI Cirebon',
  description: 'Kumpulan opini, kajian, berita, dan pemikiran dari anggota IKMI Cirebon.',
}

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const posts = await postQueries.getPublishedPosts()

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  })

  // We map posts to ensure they can be serialized to Client Component correctly
  const serializedPosts = posts.map(p => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    content: p.content,
    thumbnailUrl: p.thumbnailUrl,
    publishedAt: p.publishedAt,
    category: {
      slug: p.category.slug,
      name: p.category.name,
    }
  }))

  const serializedCategories = categories.map(c => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <main className="bg-background min-h-screen">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-10 text-center md:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent md:mb-4 md:gap-2 md:text-sm">
            <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" /> Ruang Gagasan
          </p>
          <h1 className="font-heading text-3xl font-extrabold text-surface sm:text-5xl md:text-6xl">
            Blog & Pemikiran
          </h1>
          <p className="mt-4 text-sm leading-6 text-surface/80 md:mt-6 md:text-lg md:leading-relaxed">
            Kumpulan berita, opini, kajian, dan karya tulis dari anggota IKMI Cirebon. 
            Menyuarakan gagasan untuk kemajuan daerah.
          </p>
        </div>
      </section>

      {/* ─── DAFTAR ARTIKEL ──────────────────────────────────────────────── */}
      <section className="px-4 py-8 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <BlogList initialPosts={serializedPosts} categories={serializedCategories} />
        </div>
      </section>

      {/* ─── CTA KONVERSI ────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-10 text-center md:px-6 md:py-28 lg:px-8">
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
