# 15-DESIGN.md

# DESIGN SYSTEM, UX GUIDELINES & COPYWRITING

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item         | Value                                 |
| ------------ | ------------------------------------- |
| Document     | Design System                         |
| Version      | 3.0                                   |
| Status       | APPROVED                              |
| Project      | Sistem Informasi Terpadu IKMI Cirebon |
| Architecture | Mobile First                          |
| UI Library   | Shadcn UI                             |
| Framework    | Next.js App Router                    |
| Design Style | Modern Clean SaaS                     |

---

# 1. DESIGN PRINCIPLES

Dokumen ini menjadi pedoman mutlak seluruh implementasi UI/UX.

---

## 1.1 Content First

Konten lebih penting daripada dekorasi.

Prioritas:

1. Informasi
2. Navigasi
3. Interaksi
4. Estetika

---

## 1.2 Mobile First

Seluruh halaman wajib dirancang dari layar mobile terlebih dahulu.

Target minimum:

```text
Mobile : 360px
Tablet : 768px
Desktop : 1280px+
```

---

## 1.3 Accessibility First

Seluruh komponen wajib memenuhi:

- WCAG AA
- Keyboard Navigation
- Screen Reader Friendly
- Focus States

---

## 1.4 Consistency Over Creativity

Dilarang membuat komponen baru jika sudah tersedia di Shadcn UI.

Gunakan:

- Button
- Dialog
- Sheet
- Card
- Table
- Tabs
- Dropdown
- Tooltip

---

# 2. BRAND PERSONALITY

Website IKMI harus terasa:

✅ Profesional

✅ Akademis

✅ Modern

✅ Humanis

✅ Berwibawa

✅ Dekat dengan Mahasiswa

---

Website IKMI tidak boleh terasa:

❌ Template kampus murahan

❌ AdminLTE jadul

❌ Website pemerintahan lama

❌ Terlalu korporat

❌ Ramai dan penuh ornamen

---

# 3. COLOR SYSTEM

## Primary Palette

| Token      | Color   |
| ---------- | ------- |
| Primary    | #001769 |
| Secondary  | #044585 |
| Accent     | #0072C6 |
| Background | #F8F9FA |
| Surface    | #FFFFFF |

---

## Status Colors

### Success

```text
Background : #DCFCE7
Text : #166534
```

### Warning

```text
Background : #FEF3C7
Text : #92400E
```

### Danger

```text
Background : #FEE2E2
Text : #991B1B
```

---

# 4. TYPOGRAPHY

## Heading

Font:

```text
Montserrat
```

Weight:

```text
700 - 800
```

---

## Body

Font:

```text
Poppins
```

Weight:

```text
400 - 500
```

Line Height:

```text
1.6
```

---

# 5. DESIGN TOKENS

## Tailwind Mapping

Seluruh warna wajib didaftarkan ke Tailwind Config.

Dilarang menggunakan:

```html
bg-[#001769] text-[#0072C6]
```

Gunakan:

```html
bg-primary text-accent
```

---

# 6. SPACING SYSTEM

Skala 8px.

| Token | Value |
| ----- | ----- |
| xs    | 8px   |
| sm    | 16px  |
| md    | 24px  |
| lg    | 32px  |
| xl    | 48px  |
| 2xl   | 64px  |

---

# 7. RADIUS SYSTEM

## Input

```text
rounded-xl
```

12px

---

## Card

```text
rounded-2xl
```

16px

---

## Dialog

```text
rounded-[20px]
```

20px

---

## Avatar

```text
rounded-full
```

---

# 8. SHADOW SYSTEM

Semua card menggunakan:

```css
0 4px 20px rgba(0,0,0,0.05)
```

Dilarang menggunakan border tebal.

---

# 9. MOTION SYSTEM

## Allowed

- Fade
- Slide
- Scale

---

## Duration

Fast

```text
150ms
```

Normal

```text
250ms
```

Slow

```text
300ms
```

---

## Forbidden

- Bounce
- Rotate
- Flash
- Infinite Animation

---

# 10. DOMAIN PUBLIC

## URL

```text
https://ikmicirebon.or.id
```

---

## Navigation

Navbar wajib berisi:

- Beranda
- Tentang Kami
- Event
- Struktur
- Blog
- Daftar Anggota

---

## CTA Utama

Tombol:

```text
DAFTAR ANGGOTA
```

Desktop:

- Kanan atas navbar
- Bentuk pill

Mobile:

- Sticky Bottom CTA

---

# 11. LANDING PAGE STRUCTURE

## Section 1

### Hero

Headline:

```text
Membangun Daerah,
Berkarya untuk Negeri.
```

Subheadline:

```text
Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon.
Wadah kolaborasi dan pengembangan diri mahasiswa Indramayu untuk memberikan kontribusi nyata.
```

CTA:

- Bergabung Bersama Kami
- Jelajahi Visi Misi

---

## Section 2

### 4 Pilar IKMI

- Intelektual
- Solidaritas
- Kearifan
- Kepedulian

Mobile:

Horizontal Swipe

Desktop:

Grid 4 Kolom

---

## Section 3

### Tentang IKMI

Label:

```text
TENTANG IKMI
```

Judul:

```text
Memayu Ing Jagat
```

Layout:

Desktop:

```text
2 Column
```

Mobile:

```text
1 Column
```

---

## Section 4

### Pengurus

Label:

```text
PENGURUS PUSAT
```

Judul:

```text
Mengenal Lebih Dekat Kabinet
Sri Nawikasa
```

Format:

Slider Card

---

## Section 5

### Event & Program Kerja

Label:

```text
JEJAK LANGKAH
```

Judul:

```text
Aksi Nyata & Agenda Kami
```

Layout:

Desktop:

```text
List + Gallery
```

Mobile:

```text
Stack
```

---

## Section 6

### Blog

Label:

```text
RUANG GAGASAN
```

Judul:

```text
Kabar & Pemikiran Terbaru
```

Card wajib memiliki:

- Thumbnail
- Category Badge
- Judul
- Ringkasan

---

## Section 7

### Final CTA

Background:

```text
Primary (#001769)
```

Headline:

```text
Jadilah Bagian dari Perubahan
```

CTA:

```text
DAFTAR SEKARANG
```

---

# 12. INTERNAL DASHBOARD

## URL

```text
dashboard.ikmicirebon.or.id
```

---

## Login

Halaman login hanya tersedia di dashboard.

Tidak ada tombol Login pada website publik.

---

# 13. DASHBOARD STRUCTURE

## Main Modules

- Dashboard
- Keanggotaan
- Kaderisasi
- Keuangan
- Persuratan
- Program Kerja
- Event
- LPJ
- Aduan
- CMS
- Notifikasi
- System

---

# 14. DASHBOARD UX

## Desktop

Sidebar Fixed

---

## Mobile Heavy User

Role:

- Super Admin
- Ketua
- Wakil Ketua
- Komdigi

Navigation:

```text
Hamburger Menu
```

---

## Mobile Light User

Role:

- Anggota
- Reviewer

Navigation:

```text
Bottom Navigation
```

---

# 15. DASHBOARD KPI CARD

Wajib berisi:

- Icon
- Label
- Value
- Trend

Contoh:

```text
Total Anggota Aktif
128
↑ 12%
```

---

# 16. TABLE RULES

Desktop:

Table penuh.

---

Mobile:

Wajib menjadi:

```text
Card List
```

Tidak boleh horizontal scroll.

---

# 17. EMPTY STATES

Semua halaman wajib memiliki:

- Ilustrasi
- Judul
- Deskripsi
- CTA

---

# 18. LOADING STATES

Gunakan:

```text
Skeleton
```

Bukan spinner fullscreen.

---

# 19. ERROR STATES

Komponen:

```text
Error Card
```

Berisi:

- Judul
- Pesan
- Tombol Retry

Tidak boleh menampilkan stack trace.

---

# 20. ACCESSIBILITY

Semua komponen wajib:

- aria-label
- alt image
- label form
- keyboard navigation

---

# 21. PERFORMANCE RULES

## Images

Format:

```text
WebP
```

---

## Limits

Thumbnail Blog:

```text
300KB
```

Normal Image:

```text
500KB
```

Hero Banner:

```text
1MB
```

---

# 22. DARK MODE POLICY

## Public Website

Dark Mode:

```text
NOT ALLOWED
```

Selalu Light Mode.

---

## Dashboard

Dark Mode:

```text
Future Ready
```

Arsitektur CSS Variables wajib dipertahankan.

---

# 23. UI REFERENCES

Landing Page:

- Stripe
- Vercel
- Linear
- Raycast

Dashboard:

- Linear
- Clerk
- Vercel Dashboard
- Notion

---

# 24. SOURCE OF TRUTH

Dokumen ini menjadi referensi utama untuk:

- UI Design
- UX Design
- Frontend Development
- Component Development
- Landing Page
- Dashboard
- Responsive Rules
- Accessibility Rules

Jika implementasi UI berbeda dengan dokumen ini maka implementasi wajib mengikuti 15-DESIGN.md.
