'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Facebook,
  HandHeart,
  Heart,
  Instagram,
  Lightbulb,
  MapPin,
  Menu,
  Phone,
  QrCode,
  Sparkles,
  Users,
  X,
  Youtube,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// ─── Data ───────────────────────────────────────────────────────────────────

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Tentang Kami', href: '/tentang' },
  { label: 'Event', href: '/kegiatan' },
  { label: 'Struktur', href: '/pengurus' },
  { label: 'Blog', href: '/blog' },
]

const pillars = [
  {
    icon: Brain,
    title: 'Intelektual',
    description: 'Peningkatan kapasitas akademik dan riset.',
  },
  {
    icon: Users,
    title: 'Solidaritas',
    description: 'Membangun keluarga besar yang menguatkan.',
  },
  {
    icon: Lightbulb,
    title: 'Kearifan',
    description: 'Menjaga identitas dan nilai daerah.',
  },
  {
    icon: HandHeart,
    title: 'Kepedulian',
    description: 'Pengabdian langsung kepada masyarakat.',
  },
]

const kabinet = [
  {
    nama: 'Muhammad Naufal',
    jabatan: 'Ketua Umum',
    kampus: 'Universitas Swadaya Gunung Jati',
    initials: 'MN',
  },
  {
    nama: 'Derly Agustian',
    jabatan: 'Wakil Ketua Umum',
    kampus: 'Universitas Gadjah Mada',
    initials: 'DA',
  },
  {
    nama: 'Siti Rahmawati',
    jabatan: 'Sekretaris Umum',
    kampus: 'Universitas Islam Al-Ihya Kuningan',
    initials: 'SR',
  },
  {
    nama: 'Fajar Nugraha',
    jabatan: 'Bendahara Umum',
    kampus: 'Universitas Muhammadiyah Cirebon',
    initials: 'FN',
  },
  {
    nama: 'Rina Karlina',
    jabatan: 'Kadep Kaderisasi',
    kampus: 'Institut Agama Islam Bunga Bangsa',
    initials: 'RK',
  },
  {
    nama: 'Ahmad Yusuf',
    jabatan: 'Kadep Komdigi',
    kampus: 'Universitas Swadaya Gunung Jati',
    initials: 'AY',
  },
]

const agendaList = [
  {
    tanggal: '14 Jun',
    judul: 'Makrab & Penerimaan Anggota Baru',
    lokasi: 'Bumi Perkemahan Gunung Ciremai',
  },
  {
    tanggal: '21 Jun',
    judul: 'Kajian Isu Pesisir Utara',
    lokasi: 'Gedung Serbaguna IKMI',
  },
  {
    tanggal: '5 Jul',
    judul: 'Rapat Koordinasi Lintas Departemen',
    lokasi: 'Sekretariat IKMI Cirebon',
  },
]

const galeriColors = [
  'from-blue-100 to-blue-200',
  'from-amber-100 to-amber-200',
  'from-green-100 to-green-200',
  'from-rose-100 to-rose-200',
]

const posts = [
  {
    kategori: 'Berita' as const,
    judul: 'IKMI Cirebon Sukses Gelar Rapat Kerja Tahunan',
    ringkasan:
      'Konsolidasi program kerja lintas departemen untuk satu periode ke depan.',
    tanggal: '2 Jun 2026',
    tone: 'accent' as const,
  },
  {
    kategori: 'Opini' as const,
    judul: 'Peran Mahasiswa Daerah Menghadapi Digitalisasi',
    ringkasan:
      'Membaca ulang peran mahasiswa Indramayu di ruang akademik dan sosial.',
    tanggal: '28 Mei 2026',
    tone: 'primary' as const,
  },
  {
    kategori: 'Kajian' as const,
    judul: 'Menjaga Kearifan Lokal Pesisir Utara',
    ringkasan:
      'Refleksi nilai historis dan budaya Indramayu di tengah arus modernisasi.',
    tanggal: '20 Mei 2026',
    tone: 'success' as const,
  },
]

const footerNav = [
  { label: 'Tentang Kami', href: '/tentang' },
  { label: 'Agenda', href: '/kegiatan' },
  { label: 'Struktur', href: '/pengurus' },
  { label: 'Blog', href: '/blog' },
]

const sosmed = [
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sliderIndex, setSliderIndex] = useState(0)

  const visibleKabinet = kabinet.slice(sliderIndex, sliderIndex + 3)
  const canPrev = sliderIndex > 0
  const canNext = sliderIndex + 3 < kabinet.length

  return (
    <main className="bg-background text-primary" id="beranda">
      {/* ─── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-md"
        aria-label="Navigasi Utama"
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 md:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Beranda IKMI Cirebon"
          >
            <Image
              src="/ikmi-logo.png"
              alt="Logo IKMI Cirebon"
              width={40}
              height={40}
              className="rounded-full ring-2 ring-primary/10"
              priority
            />
            <div className="leading-none">
              <p className="font-heading text-sm font-extrabold text-primary">
                IKMI Cirebon
              </p>
              <p className="text-[10px] font-medium text-muted">
                Se-Wilayah Cirebon
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-7 text-sm font-semibold text-primary/70 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-3">
            <ButtonLink
              href="/register"
              size="sm"
              className="hidden md:inline-flex"
              aria-label="Daftar menjadi anggota IKMI"
            >
              Daftar Anggota
            </ButtonLink>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/ikmi-logo.png"
                  alt="Logo IKMI Cirebon"
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <p className="font-heading text-sm font-extrabold">
                  IKMI Cirebon
                </p>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu navigasi"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-semibold text-primary transition-colors hover:bg-background"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="p-4">
              <ButtonLink
                href="/register"
                className="w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                Daftar Anggota
              </ButtonLink>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-background px-4 pb-20 pt-16 md:px-6 md:pb-28 md:pt-24 lg:px-8"
        aria-labelledby="hero-heading"
      >
        {/* Decorative blob */}
        <div
          className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1200px]">
          {/* Label */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3 text-accent" aria-hidden="true" />
            IKMI Se-Wilayah Cirebon
          </span>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="font-heading max-w-3xl text-4xl font-extrabold leading-[1.15] text-primary sm:text-5xl md:text-6xl"
          >
            Membangun Daerah,{' '}
            <span className="text-accent">Berkarya untuk Negeri.</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-base font-medium leading-[1.8] text-primary/70 md:text-lg">
            Ikatan Keluarga Mahasiswa Indramayu (IKMI) Se-Wilayah Cirebon.
            Wadah kolaborasi dan pengembangan diri bagi mahasiswa Indramayu
            untuk memberikan kontribusi nyata.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              href="/register"
              aria-label="Bergabung bersama IKMI"
            >
              Bergabung Bersama Kami
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink
              href="/tentang"
              variant="secondary"
              aria-label="Jelajahi visi misi IKMI"
            >
              Jelajahi Visi Misi
            </ButtonLink>
          </div>

          {/* Stats Strip */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-line pt-8 sm:grid-cols-4">
            {[
              { value: '128+', label: 'Anggota Aktif' },
              { value: '16', label: 'Program Kerja' },
              { value: '24', label: 'Publikasi' },
              { value: '6', label: 'Departemen' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="font-heading text-3xl font-extrabold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EMPAT PILAR ─────────────────────────────────────────────────── */}
      <section
        className="bg-background-warm px-4 py-16 md:px-6 md:py-20 lg:px-8"
        aria-labelledby="pilar-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 space-y-2 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              Fondasi Organisasi
            </p>
            <h2
              id="pilar-heading"
              className="font-heading text-3xl font-extrabold text-primary md:text-4xl"
            >
              Empat Pilar IKMI
            </h2>
          </div>

          {/* Desktop 4-col grid / Mobile horizontal swipe */}
          <div
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0"
            role="list"
            aria-label="Empat pilar organisasi IKMI"
          >
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                role="listitem"
                className="min-w-[240px] flex-shrink-0 snap-start md:min-w-0"
              >
                <Card className="h-full transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <pillar.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-heading text-xl font-bold text-primary">
                        {pillar.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">
                        {pillar.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TENTANG IKMI ────────────────────────────────────────────────── */}
      <section
        id="tentang"
        className="bg-background px-4 py-16 md:px-6 md:py-24 lg:px-8"
        aria-labelledby="tentang-heading"
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
          {/* Kiri: visual / ilustrasi */}
          <div
            className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 to-accent/10"
            aria-hidden="true"
          >
            <Image
              src="/ikmi-logo.png"
              alt="Logo IKMI Cirebon"
              width={180}
              height={180}
              className="opacity-80"
            />
            {/* Decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full border border-primary/10" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 rounded-full border border-accent/20" />
            </div>
            {/* Badge floating */}
            <span className="absolute bottom-6 right-6 rounded-full bg-primary px-4 py-2 text-xs font-bold text-surface">
              Est. 2020
            </span>
          </div>

          {/* Kanan: konten */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                Tentang IKMI
              </p>
              <h2
                id="tentang-heading"
                className="font-heading text-4xl font-extrabold leading-tight text-primary md:text-5xl"
              >
                Memayu Ing Jagat
              </h2>
            </div>

            <p className="text-base leading-[1.8] text-primary/70">
              Kami hadir bukan sekadar sebagai organisasi kedaerahan, melainkan
              ruang bertumbuh. IKMI menyatukan mahasiswa Indramayu di Cirebon
              untuk menjadi penggerak kesadaran kritis, menjaga nilai historis,
              dan membangun jejaring yang berdampak positif bagi kemajuan
              daerah.
            </p>

            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
                <Heart className="h-4 w-4" aria-hidden="true" />
                Humanis
              </span>
              <span className="flex items-center gap-2 rounded-full bg-primary/8 px-4 py-2 text-sm font-semibold text-primary">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Akademis
              </span>
              <span className="flex items-center gap-2 rounded-full bg-background-warm px-4 py-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Modern
              </span>
            </div>

            <Link
              href="/tentang"
              className="inline-flex items-center gap-2 text-sm font-bold text-accent transition-colors hover:text-secondary"
              aria-label="Baca sejarah lengkap IKMI"
            >
              Baca Sejarah Lengkap IKMI
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FORMASI KABINET ─────────────────────────────────────────────── */}
      <section
        id="struktur"
        className="bg-background-warm px-4 py-16 md:px-6 md:py-20 lg:px-8"
        aria-labelledby="kabinet-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                Pengurus Pusat
              </p>
              <h2
                id="kabinet-heading"
                className="font-heading text-3xl font-extrabold text-primary md:text-4xl"
              >
                Mengenal Lebih Dekat Kabinet{' '}
                <span className="text-accent">Sri Nawikasa</span>
              </h2>
            </div>
            <ButtonLink href="/pengurus" variant="secondary">
              Lihat Seluruh Struktur Organisasi
            </ButtonLink>
          </div>

          {/* Slider — Desktop 3 card, Mobile horizontal scroll */}
          <div className="relative">
            {/* Desktop slider controls */}
            <div className="hidden items-center justify-end gap-2 md:flex mb-4">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setSliderIndex((i) => Math.max(0, i - 1))}
                disabled={!canPrev}
                aria-label="Slider sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() =>
                  setSliderIndex((i) =>
                    Math.min(kabinet.length - 3, i + 1),
                  )
                }
                disabled={!canNext}
                aria-label="Slider berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop: 3 visible cards */}
            <div
              className="hidden gap-4 md:grid md:grid-cols-3"
              aria-label="Kartu pengurus kabinet"
            >
              {visibleKabinet.map((member) => (
                <KabinetCard key={member.nama} member={member} />
              ))}
            </div>

            {/* Mobile: horizontal swipe */}
            <div
              className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:hidden"
              aria-label="Kartu pengurus kabinet"
            >
              {kabinet.map((member) => (
                <div
                  key={member.nama}
                  className="min-w-[270px] flex-shrink-0 snap-start"
                >
                  <KabinetCard member={member} />
                </div>
              ))}
            </div>
          </div>

          {/* Dots indicator (mobile) */}
          <div className="mt-4 flex justify-center gap-2 md:hidden" aria-hidden="true">
            {kabinet.map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/30"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── AKSI NYATA & AGENDA ─────────────────────────────────────────── */}
      <section
        id="agenda"
        className="bg-background px-4 py-16 md:px-6 md:py-20 lg:px-8"
        aria-labelledby="agenda-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          {/* Section header */}
          <div className="mb-10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              Jejak Langkah
            </p>
            <h2
              id="agenda-heading"
              className="font-heading text-3xl font-extrabold text-primary md:text-4xl"
            >
              Aksi Nyata &amp; Agenda Kami
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-primary/70">
              Pantau terus pergerakan kami melalui program kerja unggulan dan
              kegiatan yang akan datang.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
            {/* Kiri: List Agenda */}
            <div className="space-y-4">
              {agendaList.map((agenda) => (
                <div
                  key={agenda.judul}
                  className="flex gap-5 rounded-2xl bg-surface p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] ring-1 ring-line transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
                >
                  <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/8 text-center">
                    <span className="text-[10px] font-bold uppercase text-muted">
                      {agenda.tanggal.split(' ')[1]}
                    </span>
                    <span className="font-heading text-xl font-extrabold text-primary">
                      {agenda.tanggal.split(' ')[0]}
                    </span>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="font-heading text-base font-bold text-primary leading-snug">
                      {agenda.judul}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-accent" aria-hidden="true" />
                      {agenda.lokasi}
                    </p>
                  </div>
                </div>
              ))}
              <ButtonLink
                href="/kegiatan"
                variant="secondary"
                className="mt-2 w-full justify-center"
                aria-label="Lihat kalender kegiatan lengkap"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Lihat Kalender Lengkap
              </ButtonLink>
            </div>

            {/* Kanan: Grid Galeri 2x2 */}
            <div
              className="grid grid-cols-2 gap-4"
              aria-label="Galeri dokumentasi kegiatan"
            >
              {galeriColors.map((gradient, i) => (
                <div
                  key={i}
                  className={`flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} ring-1 ring-line`}
                  aria-label={`Foto kegiatan ${i + 1}`}
                >
                  <div className="flex flex-col items-center gap-2 text-center opacity-40">
                    <CalendarDays className="h-8 w-8" aria-hidden="true" />
                    <span className="text-xs font-semibold">Dokumentasi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── BLOG & RUANG GAGASAN ────────────────────────────────────────── */}
      <section
        id="blog"
        className="bg-background-warm px-4 py-16 md:px-6 md:py-20 lg:px-8"
        aria-labelledby="blog-heading"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                Ruang Gagasan
              </p>
              <h2
                id="blog-heading"
                className="font-heading text-3xl font-extrabold text-primary md:text-4xl"
              >
                Kabar &amp; Pemikiran Terbaru
              </h2>
            </div>
            <ButtonLink href="/blog" variant="secondary">
              Baca Semua Tulisan
            </ButtonLink>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <Card
                key={post.judul}
                className="overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
              >
                {/* Thumbnail */}
                <div
                  className={`flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${
                    post.kategori === 'Berita'
                      ? 'from-blue-50 to-blue-100'
                      : post.kategori === 'Opini'
                        ? 'from-amber-50 to-amber-100'
                        : 'from-green-50 to-green-100'
                  }`}
                  aria-hidden="true"
                >
                  <BookOpen className="h-10 w-10 text-primary/20" />
                </div>
                <CardContent className="space-y-3 p-5">
                  <Badge tone={post.tone}>{post.kategori}</Badge>
                  <h3 className="font-heading text-base font-bold leading-snug text-primary">
                    {post.judul}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {post.ringkasan}
                  </p>
                  <p className="text-xs font-semibold text-muted">
                    {post.tanggal}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────── */}
      <section
        className="bg-primary px-4 py-20 md:px-6 md:py-28 lg:px-8"
        aria-labelledby="cta-heading"
      >
        <div className="mx-auto max-w-[1200px] text-center">
          <h2
            id="cta-heading"
            className="font-heading text-3xl font-extrabold text-surface md:text-5xl"
          >
            Jadilah Bagian dari Perubahan
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-surface/75 md:text-lg">
            Bersama IKMI, mari membangun jejaring, mengasah potensi, dan
            memberikan dampak bagi Indramayu.
          </p>
          <ButtonLink
            href="/register"
            className="mt-8 bg-surface !text-primary px-8 py-3 text-base hover:bg-surface/90"
            aria-label="Daftar menjadi anggota IKMI sekarang"
          >
            DAFTAR SEKARANG
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer
        className="bg-primary px-4 py-12 md:px-6 lg:px-8"
        aria-label="Footer"
      >
        {/* Divider */}
        <div className="mx-auto max-w-[1200px] border-t border-surface/10 pb-12" />

        <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Kolom 1: Identitas */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/ikmi-logo.png"
                alt="Logo IKMI Cirebon"
                width={36}
                height={36}
                className="rounded-full"
              />
              <p className="font-heading text-sm font-extrabold text-surface">
                IKMI Cirebon
              </p>
            </div>
            <p className="text-sm leading-relaxed text-surface/60">
              Wadah kolaborasi mahasiswa Indramayu di Cirebon untuk berkontribusi bagi kemajuan daerah.
            </p>
          </div>

          {/* Kolom 2: Navigasi Cepat */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-surface/50">
              Navigasi Cepat
            </p>
            <nav className="flex flex-col gap-3" aria-label="Navigasi cepat footer">
              {footerNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-surface/70 transition-colors hover:text-surface"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Kolom 3: Kontak */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-surface/50">
              Kontak
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-surface">Naufal</p>
                  <p className="text-xs text-surface/60">0838-7072-2557</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-surface">Derly</p>
                  <p className="text-xs text-surface/60">0821-1539-5412</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom 4: Sosmed + QR */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-surface/50">
              Sosial Media
            </p>
            <div className="flex gap-3">
              {sosmed.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/10 text-surface/70 transition-colors hover:bg-surface/20 hover:text-surface"
                  aria-label={`Ikuti IKMI di ${s.label}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
            {/* QR placeholder */}
            <div className="mt-2 flex flex-col items-start gap-2">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface/10"
                aria-label="QR Code pendaftaran anggota"
              >
                <QrCode className="h-8 w-8 text-surface/50" aria-hidden="true" />
              </div>
              <p className="text-xs text-surface/50">Scan untuk daftar</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mx-auto mt-10 max-w-[1200px] border-t border-surface/10 pt-6 text-center">
          <p className="text-xs text-surface/40">
            © 2026 IKMI Se-Wilayah Cirebon. By Departemen Komdigi. All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* Mobile: Floating CTA bottom */}
      <div
        className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 md:hidden"
        aria-label="Tombol daftar anggota"
      >
        <ButtonLink
          href="/register"
          className="shadow-[0_8px_30px_rgba(0,23,105,0.35)]"
        >
          Daftar Anggota
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KabinetCard({
  member,
}: {
  member: {
    nama: string
    jabatan: string
    kampus: string
    initials: string
  }
}) {
  return (
    <Card className="h-full transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
      <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
        {/* Avatar placeholder */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xl font-extrabold text-surface ring-4 ring-background-warm"
          aria-hidden="true"
        >
          {member.initials}
        </div>
        <div className="space-y-1">
          <p className="font-heading text-base font-bold text-primary">
            {member.nama}
          </p>
          <p className="text-xs font-semibold text-accent">{member.jabatan}</p>
          <p className="text-xs text-muted">{member.kampus}</p>
        </div>
      </CardContent>
    </Card>
  )
}
