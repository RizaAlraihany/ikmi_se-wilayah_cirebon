'use client'

import { useState } from 'react'
import { BookOpen, Search, ArrowRight, Filter } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const posts = [
  {
    id: '1',
    kategori: 'Berita' as const,
    judul: 'IKMI Cirebon Sukses Gelar Rapat Kerja Tahunan',
    ringkasan: 'Konsolidasi program kerja lintas departemen untuk satu periode ke depan.',
    tanggal: '2 Jun 2026',
    tone: 'accent' as const,
  },
  {
    id: '2',
    kategori: 'Opini' as const,
    judul: 'Peran Mahasiswa Daerah Menghadapi Digitalisasi',
    ringkasan: 'Membaca ulang peran mahasiswa Indramayu di ruang akademik dan sosial.',
    tanggal: '28 Mei 2026',
    tone: 'primary' as const,
  },
  {
    id: '3',
    kategori: 'Kajian' as const,
    judul: 'Menjaga Kearifan Lokal Pesisir Utara',
    ringkasan: 'Refleksi nilai historis dan budaya Indramayu di tengah arus modernisasi.',
    tanggal: '20 Mei 2026',
    tone: 'success' as const,
  },
  {
    id: '4',
    kategori: 'Berita' as const,
    judul: 'Penyambutan Mahasiswa Baru Asal Indramayu 2026',
    ringkasan: 'Ribuan mahasiswa baru asal Indramayu mulai memadati berbagai kampus di Cirebon.',
    tanggal: '15 Mei 2026',
    tone: 'accent' as const,
  },
  {
    id: '5',
    kategori: 'Sastra' as const,
    judul: 'Puisi: Di Bawah Langit Cirebon, Mengingat Pantai Karangsong',
    ringkasan: 'Sebuah puisi karya anggota IKMI tentang kerinduan pada kampung halaman.',
    tanggal: '10 Mei 2026',
    tone: 'destructive' as const,
  }
]

const categories = ['Semua', 'Berita', 'Opini', 'Kajian', 'Sastra']

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')

  const filteredPosts = posts.filter(post => {
    const matchCategory = activeCategory === 'Semua' || post.kategori === activeCategory
    const matchSearch = post.judul.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        post.ringkasan.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <main className="bg-background">
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
          
          {/* Filter & Search Bar */}
          <div className="mb-10 flex flex-col md:flex-row justify-between gap-4 items-center bg-surface p-4 rounded-2xl shadow-sm border border-line">
            
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
              <div className="flex items-center gap-2 mr-2 text-muted md:hidden">
                <Filter className="h-4 w-4" />
              </div>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className="rounded-full whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input 
                type="text"
                placeholder="Cari artikel..."
                className="pl-9 rounded-full bg-background-warm border-transparent focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Grid Artikel */}
          {filteredPosts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] flex flex-col"
                >
                  <div
                    className={`flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${
                      post.kategori === 'Berita'
                        ? 'from-blue-50 to-blue-100'
                        : post.kategori === 'Opini'
                          ? 'from-amber-50 to-amber-100'
                          : post.kategori === 'Kajian'
                            ? 'from-green-50 to-green-100'
                            : 'from-rose-50 to-rose-100'
                    }`}
                    aria-hidden="true"
                  >
                    <BookOpen className="h-10 w-10 text-primary/20" />
                  </div>
                  <CardContent className="space-y-3 p-5 flex flex-col flex-grow">
                    <Badge tone={post.tone}>{post.kategori}</Badge>
                    <h3 className="font-heading text-lg font-bold leading-snug text-primary flex-grow">
                      {post.judul}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted line-clamp-3">
                      {post.ringkasan}
                    </p>
                    <div className="pt-4 mt-auto border-t border-line/50 flex justify-between items-center">
                      <p className="text-xs font-semibold text-muted">
                        {post.tanggal}
                      </p>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-accent hover:text-accent hover:bg-accent/10">
                        Baca <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-background-warm rounded-3xl border border-line border-dashed">
              <BookOpen className="mx-auto h-12 w-12 text-muted mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-primary mb-2">Tidak ada artikel ditemukan</h3>
              <p className="text-muted">Cobalah kata kunci lain atau ubah filter kategori.</p>
              <Button 
                variant="secondary" 
                className="mt-6"
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('Semua')
                }}
              >
                Reset Filter
              </Button>
            </div>
          )}
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
