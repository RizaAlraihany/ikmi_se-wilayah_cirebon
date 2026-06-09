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
      <section className="bg-primary px-4 py-20 text-center md:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent mb-4 flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4" /> Ruang Gagasan
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-surface sm:text-5xl md:text-6xl">
            Blog & Pemikiran
          </h1>
          <p className="mt-6 text-base leading-relaxed text-surface/80 md:text-lg">
            Kumpulan berita, opini, kajian, dan karya tulis dari anggota IKMI Cirebon. 
            Menyuarakan gagasan untuk kemajuan daerah.
          </p>
        </div>
      </section>

      {/* ─── DAFTAR ARTIKEL ──────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <BlogList initialPosts={serializedPosts} categories={serializedCategories} />
        </div>
      </section>

      {/* ─── CTA KONVERSI ────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-20 md:px-6 md:py-28 lg:px-8 text-center">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-heading text-3xl font-extrabold text-surface md:text-5xl">
            Sumbangkan Gagasanmu
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-surface/80 md:text-lg">
            Setiap anggota IKMI berhak dan didorong untuk menulis di ruang gagasan ini. 
            Bergabunglah dan suarakan pemikiranmu.
          </p>
          <ButtonLink 
            href="/gabung" 
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
