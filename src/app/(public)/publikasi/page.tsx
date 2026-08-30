import Image from "next/image";
import { ArrowRight, PenLine } from "lucide-react";
import Link from "next/link";
import { siteUrl } from "@/core/seo/site";
import { postQueries } from "@/features/blog/queries";
import { BlogList } from "../_components/blog-list";
import { PublicBreadcrumb } from "../_components/public-breadcrumb";

export const metadata = {
  title: "Publikasi dan Ruang Gagasan",
  description:
    "Kumpulan opini, kajian, berita, dan pemikiran dari anggota IKMI Cirebon.",
  alternates: { canonical: `${siteUrl}/publikasi` },
  openGraph: {
    title: "Publikasi dan Ruang Gagasan IKMI Cirebon",
    description:
      "Kumpulan opini, kajian, berita, dan pemikiran dari anggota IKMI Cirebon.",
    url: `${siteUrl}/publikasi`,
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const posts = await postQueries.getPublishedPosts();
  const serializedPosts = posts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    thumbnailUrl: post.thumbnailUrl,
    publishedAt: post.publishedAt,
    author: {
      name: post.authorName || post.author.name,
      position: post.author.position?.name ?? null,
    },
    category: {
      slug: post.category.slug,
      name: post.category.name,
    },
  }));
  const categoryCount = new Set(
    serializedPosts.map((post) => post.category.slug),
  ).size;

  return (
    <main
      className="publication-page public-page-root flex-1 w-full bg-base"
      id="publikasi-page"
    >
      <header className="publication-hero">
        <Image
          src="https://res.cloudinary.com/dsgldeuuy/image/upload/v1781230578/komdigi_mht7vt.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="publication-hero-image"
          aria-hidden="true"
        />
        <div className="publication-hero-overlay" aria-hidden="true" />
        <div className="publication-container publication-hero-inner">
          <PublicBreadcrumb
            items={[{ label: "Publikasi" }]}
            tone="inverse"
            className="publication-breadcrumb"
          />

          <div className="publication-hero-grid">
            <div className="publication-hero-copy">
              <h1>Indeks Publikasi</h1>

              <p className="publication-hero-lead">
                Berita, kajian, artikel, dan opini yang diterbitkan IKMI Cirebon
                untuk merawat pengetahuan, percakapan, dan gagasan bersama.
              </p>
            </div>

            <dl
              className="publication-archive-facts"
              aria-label="Ringkasan publikasi"
            >
              <div>
                <dt>Terbit</dt>
                <dd>{serializedPosts.length}</dd>
              </div>
              <div>
                <dt>Kategori aktif</dt>
                <dd>{categoryCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <section
        className="publication-index-section"
        aria-labelledby="publication-index-title"
      >
        <div className="publication-container">
          <h2 id="publication-index-title" className="sr-only">
            Arsip publikasi
          </h2>

          <BlogList
            initialPosts={serializedPosts}
            initialCategory={params.category}
          />
        </div>
      </section>

      <section
        className="publication-contribution"
        aria-labelledby="publication-cta-title"
      >
        <div className="publication-container">
          <div className="publication-contribution-grid">
            <div className="publication-contribution-icon" aria-hidden="true">
              <PenLine />
            </div>

            <div>
              <h2 id="publication-cta-title">Punya gagasan untuk dibagikan?</h2>
              <p>
                Kirim tulisanmu untuk ditinjau dan dipublikasikan melalui ruang
                gagasan organisasi.
              </p>
            </div>

            <Link href="/kirim-tulisan" className="public-text-link about-closing-action">
              Kirim gagasan Anda
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
