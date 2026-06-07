# 15-DESIGN.md

# DESIGN SYSTEM, UX GUIDELINES & COPYWRITING

## Project Information

| Item              | Value                                 |
| ----------------- | ------------------------------------- |
| Project           | Sistem Informasi Terpadu IKMI Cirebon |
| Scope             | Web Public + Dashboard Internal       |
| Design Philosophy | Mobile First                          |
| Design Style      | Modern Clean SaaS                     |
| UI Library        | Shadcn UI                             |
| CSS Framework     | Tailwind CSS                          |
| Icon Library      | Lucide Icons                          |
| Animation         | Framer Motion                         |
| Status            | FINAL LOCKED                          |

---

# 1. PURPOSE

Dokumen ini merupakan **Source of Truth** untuk seluruh keputusan UI, UX, Design System, Visual Identity, dan Copywriting pada Sistem Informasi Terpadu IKMI Cirebon.

Semua implementasi desain wajib mengikuti dokumen ini.

Jika terjadi konflik antara:

- AI Coding Agent
- Template pihak ketiga
- Figma eksternal
- Inspirasi Dribbble
- Preferensi developer
- Preferensi designer

maka dokumen ini memiliki prioritas tertinggi.

---

# 2. DESIGN PRINCIPLES

## 2.1 Content First

Konten lebih penting daripada dekorasi.

UI harus memperjelas informasi, bukan mengalihkan perhatian.

---

## 2.2 Mobile First

Seluruh halaman wajib dirancang untuk Mobile terlebih dahulu.

Breakpoint:

```txt
Mobile   : < 768px
Tablet   : 768px - 1024px
Desktop  : > 1024px
```

---

## 2.3 Accessibility First

Target minimum:

- WCAG AA
- Keyboard Accessible
- Screen Reader Friendly

---

## 2.4 Conversion Focused

Seluruh halaman publik wajib memiliki CTA yang jelas.

Contoh:

- Daftar Sekarang
- Bergabung Bersama Kami
- Pelajari Visi Misi
- Hubungi Kami

---

## 2.5 Consistency Over Creativity

Dilarang membuat variasi komponen baru jika komponen yang sama sudah tersedia pada Shadcn UI.

---

# 3. VISUAL IDENTITY

## 3.1 Color Palette

### Primary

```txt
#001769
```

Biru Dongker IKMI.

Digunakan untuk:

- Header
- Footer
- Heading
- Branding

---

### Secondary

```txt
#044585
```

Digunakan untuk:

- Sidebar
- Background Section
- Navigasi

---

### Accent

```txt
#0072C6
```

Digunakan untuk:

- CTA
- Link
- Primary Button

---

### Background

```txt
#F8F9FA
```

---

### Surface

```txt
#FFFFFF
```

---

### Status Colors

Success

```txt
#DCFCE7
```

Warning

```txt
#FEF3C7
```

Danger

```txt
#FEE2E2
```

---
## VISUAL DIRECTION (MANDATORY)

Landing Page WAJIB menggunakan Light Theme.

Background utama:
- #F8F9FA
- #EDE9E6

Dilarang menggunakan:
- Background hitam full
- Dark Theme
- Hero hitam
- Navbar hitam

Inspirasi visual:

- Stripe Landing Page
- Framer
- Notion Marketing
- Linear LIGHT MODE

Bukan:

- Linear Dark Mode
- Vercel Dark Theme
- Developer Portfolio Style

---

# 4. DESIGN TOKENS

## Tailwind Mapping

```txt
primary
secondary
accent
background
surface
success
warning
danger
```

DILARANG:

```tsx
bg-[#001769]
text-[#0072C6]
```

WAJIB:

```tsx
bg - primary;
text - accent;
```

---

# 5. TYPOGRAPHY

## Heading

Font:

```txt
Montserrat
```

Weight:

```txt
700 - 800
```

---

## Body

Font:

```txt
Poppins
```

Weight:

```txt
400 - 500
```

Line Height:

```txt
1.6
```

---

# 6. SPACING SYSTEM

Menggunakan skala 8px.

| Token | Value |
| ----- | ----- |
| xs    | 8px   |
| sm    | 16px  |
| md    | 24px  |
| lg    | 32px  |
| xl    | 48px  |
| 2xl   | 64px  |

Dilarang menggunakan ukuran random.

---

# 7. RADIUS SYSTEM

| Component   | Radius |
| ----------- | ------ |
| Input       | 12px   |
| Card        | 16px   |
| Modal       | 20px   |
| Button Pill | Full   |
| Avatar      | Full   |

---

# 8. SHADOW SYSTEM

```css
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
```

Dilarang menggunakan shadow berlebihan.

---

# 9. MOTION SYSTEM

## Allowed

- Fade
- Slide
- Scale

---

## Forbidden

- Bounce
- Flash
- Rotate
- Infinite Animation

---

## Duration

Fast

```txt
150ms
```

Normal

```txt
250ms
```

Slow

```txt
300ms
```

---

# 10. GRID SYSTEM

Desktop

```txt
12 Columns
```

Tablet

```txt
8 Columns
```

Mobile

```txt
4 Columns
```

---

Container

```tsx
mx-auto
max-w-[1200px]
px-4
md:px-6
lg:px-8
```

---

# 11. LANDING PAGE STRUCTURE

Urutan halaman publik wajib:

1. Navbar
2. Hero Section
3. About IKMI
4. Struktur Organisasi
5. Program Kerja
6. Event Agenda
7. Blog & News
8. Final CTA
9. Footer

---

# 12. HERO SECTION

## Headline

IKATAN KELUARGA MAHASISWA INDRAMAYU SE-WILAYAH CIREBON

---

## Sub Headline

Wadah kolaborasi dan pengembangan diri mahasiswa Indramayu untuk berkontribusi nyata demi kemajuan daerah, bangsa, dan negara.

---

## CTA

Primary:

```txt
Bergabung Bersama Kami
```

Secondary:

```txt
Pelajari Visi Misi
```

---

# 13. HALUAN IKMI

Empat Pilar:

### Kemahasiswaan

Peningkatan kualitas akademik dan riset.

### Kekeluargaan

Membangun solidaritas mahasiswa.

### Kedaerahan

Menjaga identitas dan nilai daerah.

### Sosial

Pengabdian kepada masyarakat.

---

# 14. ABOUT IKMI

## Judul

Memayu Ing Jagat

## Deskripsi

Kami hadir bukan sekadar organisasi kedaerahan, melainkan ruang bertumbuh bagi mahasiswa Indramayu untuk membangun jejaring, mengembangkan kapasitas, dan memberikan dampak nyata.

---

# 15. ORGANIZATION SECTION

## Judul

Mengenal Lebih Dekat Kabinet

Visual:

- Slider
- Card Profile
- Swipe Mobile

CTA:

```txt
Lihat Seluruh Struktur Organisasi
```

---

# 16. BLOG SECTION

Card wajib memuat:

- Thumbnail
- Badge Kategori
- Judul
- Ringkasan
- Tanggal

Kategori:

- Berita
- Kajian
- Opini
- Agenda

---

# 17. FINAL CTA

## Headline

Jadilah Bagian dari Perubahan

## Copy

Bersama IKMI mari membangun jejaring, mengasah potensi, dan memberikan dampak nyata bagi Indramayu.

---

# 18. DASHBOARD DESIGN

## Layout

Desktop:

```txt
Sidebar + Content
```

Mobile:

```txt
Bottom Navigation
atau
Hamburger Menu
```

---

# 19. ROLE-BASED DASHBOARD

## Super Admin

Semua Widget

---

## Ketua Umum

- KPI Strategis
- Approval Center

---

## Komdigi

- Draft Artikel
- Blog Analytics
- Agenda

---

## Kaderisasi

- Pendaftaran
- Statistik Anggota

---

## Advokasi

- Aduan Baru
- Tracking Aduan

---

## Bendahara

- Finance Approval
- Cashflow

---

# 20. KPI CARD STANDARD

Setiap KPI wajib memiliki:

- Icon
- Label
- Value
- Trend

Contoh:

```txt
128
Anggota Aktif
↑ 12%
```

---

# 21. TABLE RULES

Desktop:

```txt
Data Table
```

Mobile:

```txt
Card List
```

Dilarang memaksa tabel besar tampil di HP.

---

# 22. EMPTY STATE

Wajib memiliki:

- Ilustrasi
- Judul
- Deskripsi
- CTA

---

# 23. LOADING STATE

Prioritas:

```txt
Skeleton > Progress Bar > Spinner
```

---

# 24. ERROR STATE

Komponen:

- Title
- Description
- Retry Button

Dilarang menampilkan:

- Stack Trace
- Prisma Error
- SQL Error

---

# 25. PERFORMANCE BUDGET

Target Lighthouse:

```txt
Performance   >= 90
Accessibility >= 95
Best Practice >= 95
SEO           >= 90
```

---

# 26. IMAGE POLICY

Thumbnail

```txt
<= 300 KB
```

Image

```txt
<= 500 KB
```

Hero

```txt
<= 1 MB
```

Format:

```txt
WebP
```

---

# 27. ACCESSIBILITY

Wajib:

- aria-label
- alt text
- htmlFor
- keyboard navigation

---

# 28. DARK MODE POLICY

Versi:

```txt
MVP v1.0
```

Status:

```txt
Tidak diimplementasikan
```

Namun arsitektur CSS Variables harus tetap dipertahankan.

---

# 29. UI REFERENCES

## Allowed

Landing Page:

- Vercel
- Stripe
- Linear
- Raycast

Dashboard:

- Linear
- Vercel Dashboard
- Clerk
- Notion

---

## Forbidden

- AdminLTE
- CoreUI Lama
- SB Admin
- Bootstrap Dashboard Jadul
- Material Design 2015

---

# 30. BRAND PERSONALITY

IKMI HARUS terasa:

- Profesional
- Akademis
- Modern
- Humanis
- Berwibawa
- Dekat Dengan Mahasiswa

IKMI TIDAK BOLEH terasa:

- Website Pemerintahan Lama
- Website Desa
- Template Tugas Kampus
- Dashboard Bootstrap Jadul
- Terlalu Korporat

---

# 31. AI CODING AGENT RULES

Berlaku untuk:

- Codex
- Antigravity
- Cursor
- Claude Code
- ChatGPT
- Gemini CLI

---

AI wajib:

- Mengikuti dokumen ini
- Menggunakan Shadcn UI
- Menggunakan Tailwind Tokens
- Mobile First
- Accessibility First
- Empty State Rules
- Loading State Rules
- Error State Rules

---

AI dilarang:

- Membuat warna baru
- Membuat typography baru
- Mengubah copywriting utama
- Menggunakan UI Library lain
- Menginstal dashboard template

---

# STATUS

FINAL LOCKED DESIGN SYSTEM

Perubahan terhadap dokumen ini wajib melalui proses review dan approval sebelum implementasi kode dilakukan.
