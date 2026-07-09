<div align="center">

<h1>ðŸŒ Sistem Informasi Terpadu IKMI Cirebon</h1>

<p><em>Platform digital enterprise untuk mengelola seluruh roda operasional organisasi mahasiswa secara terpadu, aman, dan efisien.</em></p>

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-v6-darkblue?logo=prisma)](https://www.prisma.io/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-purple?logo=auth0)](https://authjs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-cyan?logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## ðŸ“‹ Daftar Isi

- [Latar Belakang Masalah](#-latar-belakang-masalah)
- [Solusi yang Dibangun](#-solusi-yang-dibangun)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Alur Data & Algoritma Internal](#-alur-data--algoritma-internal)
- [Domain & Struktur Aplikasi](#-domain--struktur-aplikasi)
- [Modul Fitur](#-modul-fitur)
- [Stack Teknologi](#-stack-teknologi)
- [Struktur Folder](#-struktur-folder)
- [Skema Database](#-skema-database)
- [Cara Menjalankan Proyek](#-cara-menjalankan-proyek)
- [Variabel Lingkungan](#-variabel-lingkungan)
- [Deployment](#-deployment)

---

## ðŸŽ¯ Latar Belakang Masalah

**Ikatan Keluarga Mahasiswa Indramayu (IKMI) Se-Wilayah Cirebon** adalah organisasi mahasiswa yang menghimpun mahasiswa asal Indramayu yang sedang menempuh pendidikan di wilayah Cirebon. Organisasi ini memiliki struktur yang cukup kompleks: satu BPH (Badan Pengurus Harian) yang terdiri dari Ketua, Wakil Ketua, Sekretaris, dan Bendahara, ditambah enam departemen teknis (Komdigi, Kaderisasi, Advokasi, PSDA, Ekraf, HPM).

### Masalah Utama yang Dihadapi

Sebelum sistem ini dibangun, IKMI menghadapi sejumlah masalah operasional yang krusial:

**1. Fragmentasi Alat Kerja**
> Setiap bidang menggunakan alat yang berbeda-beda dan tidak terintegrasi: Google Sheets untuk keuangan, WhatsApp untuk pengumuman, Google Drive untuk arsip surat, dan berbagai platform media sosial untuk konten â€” tanpa ada satu sumber kebenaran tunggal (*single source of truth*).

**2. Manajemen Keuangan yang Tidak Transparan**
> Pencatatan kas manual di spreadsheet sangat rentan kesalahan. Tidak ada mekanisme approval berjenjang, tidak ada bukti audit trail, dan laporan pertanggungjawaban (LPJ) dikumpulkan secara ad-hoc lewat chat.

**3. Publikasi Konten yang Tidak Terstruktur**
> Artikel blog dan konten media sosial dibuat tanpa alur review yang jelas. Tidak ada sistem editorial (*content workflow*) yang memastikan setiap tulisan disetujui sebelum tayang ke publik.

**4. Tidak Ada Portal Publik yang Representatif**
> Masyarakat dan calon anggota baru tidak memiliki portal terpusat untuk mengenal IKMI, melihat agenda kegiatan, membaca artikel, atau mendaftarkan diri.

**5. Manajemen Anggota yang Tidak Sistematis**
> Data pengurus tersebar, tidak ada sistem pencatatan terstruktur, dan pendaftaran anggota baru masih dilakukan secara manual tanpa alur yang jelas.

**6. Tidak Ada Jejak Audit**
> Perubahan data â€” siapa yang mengubah, apa yang diubah, kapan â€” tidak pernah dicatat. Hal ini membuat akuntabilitas organisasi sangat sulit ditegakkan.

---

## ðŸ’¡ Solusi yang Dibangun

Sistem ini menjawab semua masalah di atas dengan satu platform terintegrasi yang terbagi dalam dua domain:

| Domain | URL | Fungsi |
|--------|-----|--------|
| **Publik** | `ikmicirebon.web.id` | Branding, informasi, registrasi anggota |
| **Internal** | `dashboard.ikmicirebon.web.id` | Operasional organisasi, RBAC per-role |

Prinsip desain utama:
- **Single Source of Truth** â€” Semua data berpusat di satu database PostgreSQL
- **Role-Based Access Control** â€” Setiap pengguna hanya dapat mengakses modul yang relevan dengan jabatannya
- **Audit Trail** â€” Setiap mutasi data dicatat secara otomatis dalam `AuditLog`
- **Event-Driven Side Effects** â€” Notifikasi dan side-effect lain diproses melalui *event bus* yang terdekopling dari *business logic* utama

---

## ðŸ—ï¸ Arsitektur Sistem

### Pola Arsitektur: Enterprise Ready Modular Monolith

Sistem ini mengadopsi **Modular Monolith** â€” satu aplikasi Next.js yang secara internal diorganisir seperti *bounded contexts*, memudahkan pemeliharaan sambil menghindari kompleksitas infrastruktur microservice yang berlebihan.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     NEXT.JS 16 APP ROUTER                    â”‚
â”‚                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  PUBLIC DOMAIN  â”‚         â”‚    INTERNAL DOMAIN         â”‚  â”‚
â”‚  â”‚  ikmicirebon   â”‚         â”‚  dashboard.ikmicirebon     â”‚  â”‚
â”‚  â”‚  .or.id         â”‚         â”‚  .or.id                    â”‚  â”‚
â”‚  â”‚                 â”‚         â”‚                            â”‚  â”‚
â”‚  â”‚  Landing Page   â”‚         â”‚  Admin Dashboard (RBAC)    â”‚  â”‚
â”‚  â”‚  Blog Public    â”‚         â”‚  â”œâ”€ Super Admin            â”‚  â”‚
â”‚  â”‚  Event Publik   â”‚         â”‚  â”œâ”€ Admin Komdigi          â”‚  â”‚
â”‚  â”‚  Form Daftar    â”‚         â”‚  â”œâ”€ Admin Sekretaris       â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â”‚  â”œâ”€ Admin Bendahara        â”‚  â”‚
â”‚                              â”‚  â””â”€ User (Anggota)         â”‚  â”‚
â”‚                              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚                   src/features/                       â”‚   â”‚
â”‚  â”‚  blog â”‚ finance â”‚ events â”‚ letters â”‚ management â”‚     â”‚   â”‚
â”‚  â”‚  registration â”‚ content-plan â”‚ lpj-token â”‚ reports    â”‚   â”‚
â”‚  â”‚  users â”‚ audit â”‚ announcements â”‚ web-config â”‚ ...     â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚                    src/core/                          â”‚   â”‚
â”‚  â”‚  auth â”‚ authorization â”‚ cache â”‚ database â”‚ events     â”‚   â”‚
â”‚  â”‚  notifications â”‚ security â”‚ seo â”‚ storage â”‚ ...      â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
            â”‚                          â”‚
            â–¼                          â–¼
    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
    â”‚  PostgreSQL   â”‚        â”‚  Upstash Redis   â”‚
    â”‚  + Prisma ORM â”‚        â”‚  (Cache / RBAC)  â”‚
    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
            â”‚
            â–¼
    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
    â”‚   Cloudinary   â”‚
    â”‚  (Media Store) â”‚
    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Lapisan Arsitektur (CQRS Lite)

Setiap modul fitur mengikuti pola CQRS Lite yang konsisten:

```
Presentation Layer (src/app/)
    â”‚  Menerima request dari browser / form submit
    â–¼
Server Actions (actions.ts)
    â”‚  Validasi sesi & memanggil service
    â–¼
Service Layer (services.ts)
    â”‚  Business logic, validasi aturan bisnis, ownership check
    â–¼
Repository Layer (repository.ts)
    â”‚  Mutasi database via Prisma
    â–¼
Database (PostgreSQL)
```

**Query path (read)** berjalan langsung dari `queries.ts` â†’ Prisma â†’ DB, tanpa melewati service layer, untuk performa optimal.

---

## ðŸ”„ Alur Data & Algoritma Internal

### 1. Sistem Autentikasi & RBAC

Autentikasi menggunakan **Auth.js v5** dengan strategi JWT + Credentials Provider. Informasi role dan departemen pengguna disematkan langsung ke dalam JWT token untuk menghindari database roundtrip pada setiap request.

```
User Login (email + password)
    â”‚
    â–¼
AuthConfig.authorize()
    â”œâ”€ Cari user di DB (Prisma)
    â”œâ”€ Verifikasi password (bcryptjs.compare)
    â””â”€ Kembalikan { id, email, roleId, departmentId, positionId }
    â”‚
    â–¼
JWT Callback â†’ sisipkan roleId, departmentId, positionId ke token
    â”‚
    â–¼
Session Callback â†’ ekspos data ke session.user.*
    â”‚
    â–¼
Middleware (proxy.ts)
    â”œâ”€ Cek apakah request menuju /admin atau /dashboard
    â”œâ”€ Jika belum login â†’ redirect ke /login
    â”œâ”€ Jika domain publik tapi akses ke route admin â†’ redirect ke dashboard subdomain
    â””â”€ Blokir akses ke route deprecated (/admin/kaderisasi, dll.)
```

**Algoritma RBAC dengan Cache (Permission Check):**

```typescript
async function can(permissionName, user) {
  // Super Admin selalu melewati semua cek
  if (isSuperAdminRole(user.roleId)) return true;

  // Cek cache Redis dulu (TTL: 5 menit)
  const cacheKey = `rbac:v2:${user.roleId}:${permissionName}`;
  const cached = await permissionCache.get(cacheKey);
  if (cached !== null) return cached;

  // Fallback ke DB jika cache miss
  const rolePermission = await prisma.rolePermission.findUnique({
    where: { roleId_permissionId: { roleId, permissionId: permissionName } }
  });

  const result = !!rolePermission;
  await permissionCache.set(cacheKey, result, 300); // simpan 5 menit
  return result;
}
```

Skema ini memastikan pengecekan izin berjalan sangat cepat (O(1) dari cache) setelah pertama kali dikomputasi, sambil tetap menjaga akurasi data dari database.

---

### 2. Pipeline Editorial Konten Blog (5-Stage)

Konten blog melewati *pipeline* editorial ketat sebelum tayang ke publik:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”  submit   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  approve  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  DRAFT  â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â–º â”‚  PENDING_REVIEW  â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â–º â”‚ APPROVED â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                           â”‚
                                                        publish
                                                           â”‚
                                                           â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  archive  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ARCHIVED â”‚ â—„â”€â”€â”€â”€â”€â”€â”€â”€ â”‚ PUBLISHED â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Aturan bisnis per transisi:**
- `DRAFT â†’ PENDING_REVIEW`: Penulis (User/Komdigi) bisa submit artikel miliknya sendiri
- `PENDING_REVIEW â†’ APPROVED`: Hanya reviewer Komdigi atau Super Admin
- `APPROVED â†’ PUBLISHED`: Hanya publisher Komdigi atau Super Admin
- **Ownership Policy**: Editor non-Komdigi hanya bisa mengelola artikel dari departemennya sendiri
- Setiap transisi menghasilkan **AuditLog** dan mengirim **Domain Event** ke EventBus

---

### 3. Sistem LPJ Token (One-Time-Use Pattern)

Sistem token LPJ dirancang untuk memberikan akses terbatas kepada User biasa agar bisa submit LPJ tanpa role Admin:

```
Bendahara / Super Admin
    â”‚
    â””â”€ Generate token CUID unik
         â”‚  Simpan ke DB: { status: ACTIVE, expired_at: T+N hari }
         â””â”€ Token diserahkan ke User (manual / via WA)

User menerima token
    â”‚
    â””â”€ validateLpjTokenAction(token)
         â”œâ”€ Cek token ada di DB
         â”œâ”€ Cek status === ACTIVE
         â”œâ”€ Cek expired_at > NOW()
         â””â”€ Jika valid â†’ tampilkan form submit LPJ

User submit LPJ
    â”‚
    â””â”€ Upload dokumen ke Cloudinary
         â”‚
         â””â”€ Tandai token: status = USED, used_at = NOW()
              â”‚  (Token tidak bisa digunakan lagi â€” one-time-use)
              â””â”€ Simpan LPJSubmission ke DB
```

---

### 4. Event-Driven Architecture (Domain Events)

Setiap perubahan state penting memancarkan *domain event* melalui `EventBus` internal. Ini memisahkan *business logic* utama dari *side effects* (notifikasi, audit, dll.):

```
blogService.publishPost()
    â”‚
    â”œâ”€ Update status Post di DB (transaksi atomik)
    â””â”€ eventBus.emit('post.published', { postId, publisherId, authorId })
          â”‚
          â”œâ”€ Handler: notifikasi in-app ke author
          â”œâ”€ Handler: catat AuditLog
          â””â”€ Handler: (future) trigger WA blast ke subscriber
```

**Domain events yang ada dalam sistem:**

| Event | Trigger |
|-------|---------|
| `post.created/submitted/approved/published/archived` | Lifecycle artikel blog |
| `finance.requested/approved/completed/rejected` | Alur pengajuan keuangan |
| `registration.created` | Pendaftaran anggota baru dari web publik |
| `lpj.submitted/verified/rejected` | Alur LPJ |
| `letter.created` | Surat masuk/keluar baru |
| `agenda.reminder.sent` | Reminder kegiatan |
| `audit.log` | Setiap perubahan data penting |

---

### 5. Sistem Cache Berlapis (Redis + In-Memory Fallback)

Cache diimplementasikan dengan strategi **dual-layer** untuk ketahanan maksimum:

```
Request masuk
    â”‚
    â–¼
Cek Upstash Redis (Cloud)
    â”œâ”€ HIT  â†’ kembalikan data langsung
    â””â”€ MISS / ERROR
          â”‚
          â–¼
      Cek In-Memory Map (fallback lokal)
          â”œâ”€ HIT  â†’ kembalikan data
          â””â”€ MISS
                â”‚
                â–¼
            Query ke Database
                â”‚
                â””â”€ Simpan ke Redis (jika tersedia) atau Memory
```

Strategi ini memastikan aplikasi tetap berfungsi meski Redis mengalami gangguan, dengan degradasi yang *graceful* ke cache in-memory.

---

### 6. Alur Registrasi Anggota Baru (Tanpa Login)

```
Calon Anggota isi form di ikmicirebon.web.id/gabung
    â”‚  (nama, kampus, jurusan, semester, alamat, nomor WA, alasan)
    â–¼
Rate Limiter cek (anti-spam per IP)
    â”‚
    â””â”€ Jika lolos â†’ simpan ke tabel registrations (status: PENDING)
          â”‚
          â””â”€ waService.sendMessage() via Fonnte API
               â”‚  Kirim link invite grup WhatsApp ke nomor WA calon anggota
               â””â”€ Data tercatat di dashboard Sekretaris
                    â””â”€ Sekretaris ubah status â†’ PROCESSED
```

---

### 7. Sistem WA Blast (Pengumuman)

```
Sekretaris buat Pengumuman baru
    â”‚
    â””â”€ Toggle "Kirim via WA Blast"
          â”‚
          â””â”€ announcementService.blast()
               â”œâ”€ Ambil semua nomor WA user aktif dari DB
               â”œâ”€ waService.sendBulk(messages[])
               â”‚    â””â”€ Fonnte API: POST /send (target dipisah koma)
               â””â”€ Update Announcement:
                    is_wa_blasted = true
                    blast_sent_at = NOW()
```

**Provider WA bersifat modular** â€” sistem menggunakan interface `WAProvider` sehingga provider dapat diganti (Fonnte â†’ Zenziva â†’ WA Business API) tanpa mengubah business logic.

---

## ðŸ—‚ï¸ Domain & Struktur Aplikasi

### Domain Publik (`ikmicirebon.web.id`)

Portal terbuka tanpa login. Menampilkan wajah publik organisasi.

| Halaman | Route | Deskripsi |
|---------|-------|-----------|
| Beranda | `/` | Landing page dengan "Empat Pilar" IKMI |
| Tentang Kami | `/tentang-kami` | Sejarah, visi, misi, dan latar belakang organisasi |
| Struktur Pengurus | `/struktur` | Kabinet Sri Nawikasa beserta foto dan jabatan |
| Agenda & Event | `/event` | Kalender kegiatan publik yang aktif |
| Blog / Ruang Gagasan | `/blog` | Artikel, opini, berita dari departemen |
| Daftar Anggota | `/gabung` | Form pendaftaran Open Recruitment anggota baru |

Setiap halaman publik memiliki **sitemap dinamis** (`/sitemap.xml`) dan **robots.txt** yang teroptimasi untuk SEO.

### Domain Internal (`dashboard.ikmicirebon.web.id`)

Portal enterprise tertutup. Hanya bisa diakses oleh pengguna dengan akun login aktif.

| Role | Akses Dashboard |
|------|----------------|
| **Super Admin** (Ketua & Wakil Ketua) | Seluruh modul + manajemen user & role + generate LPJ Token |
| **Admin Komdigi** | CMS Blog, Content Plan, Karya Tulis Queue, Web Config |
| **Admin Sekretaris** | Kalender, Pengumuman + WA Blast, Persuratan, Pengurus, Anggota Baru |
| **Admin Bendahara** | Buku Kas, Laporan Keuangan, LPJ Module (Token + Inbox + Verifikasi + Arsip) |
| **User** (Anggota Umum) | Kalender (read-only), Pengumuman (read-only), Keuangan (read-only), Request Pamflet, Submit Karya Tulis, Submit LPJ via Token |

---

## ðŸ“¦ Modul Fitur

### `blog` â€” CMS Artikel
- Manajemen artikel dengan WYSIWYG editor (Tiptap)
- Alur editorial 5 tahap: Draft â†’ Pending Review â†’ Approved â†’ Published â†’ Archived
- SEO metadata per artikel (title, description, keywords)
- Thumbnail upload ke Cloudinary
- Statistik analytics (per kategori, per author, per bulan)

### `finance` â€” Buku Kas & Keuangan
- Pencatatan transaksi INCOME/EXPENSE dengan bukti pembayaran
- Agregasi bulanan dan tahunan
- Dashboard ringkasan saldo kas real-time
- Transparansi keuangan untuk User biasa (read-only)

### `events` â€” Manajemen Kegiatan
- Kalender kegiatan dengan status: Upcoming, Ongoing, Completed, Cancelled
- Relasi Event â†’ Program â†’ Departemen
- Integrasi ke sitemap publik

### `letters` â€” Persuratan
- Surat Masuk (IN) dan Surat Keluar (OUT)
- Upload file surat ke Cloudinary
- Penomoran surat unik

### `management` â€” Manajemen Pengurus
- Data seluruh pengurus: BPH + semua departemen (aktif & demisioner)
- Dikelola oleh Sekretaris

### `registration` â€” Anggota Baru
- Data pendaftar dari web publik
- Status tracking: PENDING â†’ PROCESSED
- Integrasi WA blast link invite grup

### `lpj-token` â€” LPJ via Token
- Generate token sekali pakai dengan batas waktu
- User non-admin bisa submit LPJ tanpa akses dashboard penuh
- Tracking status token: ACTIVE â†’ USED / EXPIRED

### `content-plan` â€” Konten Plan Komdigi
- Pipeline perencanaan konten media sosial dan publikasi
- Status: PLANNED â†’ IN_PROGRESS â†’ READY â†’ PUBLISHED

### `announcements` â€” Pengumuman + WA Blast
- Buat pengumuman organisasi
- Blast ke seluruh nomor WA user aktif via Fonnte API

### `document-archives` â€” Arsip Dokumen
- Penyimpanan dokumen organisasi berdasarkan kategori

### `audit` â€” Audit Trail
- Rekam jejak setiap perubahan data (CREATE, UPDATE, DELETE, APPROVE, REJECT, PUBLISH, dll.)
- Tidak bisa dihapus â€” append-only
- Visible untuk Super Admin

### `web-config` â€” Konfigurasi Website
- Dynamic config untuk tampilan website publik (key-value JSON store)
- Dikelola oleh Komdigi

---

## ðŸ› ï¸ Stack Teknologi

| Kategori | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Next.js | 16.2.7 |
| Bahasa | TypeScript (Strict) | 5.x |
| Database | PostgreSQL | 15 |
| ORM | Prisma | 6.4 |
| Auth | Auth.js (NextAuth) | v5 Beta |
| UI Library | Shadcn/UI | Latest |
| Styling | Tailwind CSS | v4 |
| Rich Text | Tiptap | 2.6 |
| Validasi | Zod | 3.23 |
| Form | React Hook Form | 7.53 |
| Cache | Upstash Redis | 1.34 |
| Storage | Cloudinary | 2.5 |
| WA Notifikasi | Fonnte API | - |
| Testing | Jest + Testing Library | 30.x |
| Container | Docker + Compose | - |

---

## ðŸ“ Struktur Folder

```
web-komdigi-ikmi/
â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ schema.prisma          # Definisi seluruh model database
â”‚   â”œâ”€â”€ seed.ts                # Seeder data awal (roles, permissions, master data)
â”‚   â””â”€â”€ master-data.generated.ts  # Data master IKMI
â”‚
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/                   # Next.js App Router (routing only, no business logic)
â”‚   â”‚   â”œâ”€â”€ (public)/          # Domain publik: landing page, blog, event, gabung
â”‚   â”‚   â”œâ”€â”€ (dashboard)/       # Domain internal: admin dashboard per role
â”‚   â”‚   â”‚   â”œâ”€â”€ admin/         # Route-route modul admin
â”‚   â”‚   â”‚   â””â”€â”€ layout.tsx     # Layout dashboard dengan sidebar navigasi RBAC
â”‚   â”‚   â”œâ”€â”€ (auth)/            # Halaman login
â”‚   â”‚   â”œâ”€â”€ api/               # API routes (cron jobs, webhooks)
â”‚   â”‚   â”œâ”€â”€ sitemap.ts         # Dynamic SEO sitemap
â”‚   â”‚   â””â”€â”€ robots.ts          # SEO robots.txt
â”‚   â”‚
â”‚   â”œâ”€â”€ core/                  # Infrastruktur fondasi (tidak mengandung domain logic)
â”‚   â”‚   â”œâ”€â”€ auth/              # Auth.js config, JWT callbacks, role helpers
â”‚   â”‚   â”œâ”€â”€ authorization/     # RBAC engine dengan Redis cache
â”‚   â”‚   â”œâ”€â”€ cache/             # CacheService (Redis + In-Memory fallback)
â”‚   â”‚   â”œâ”€â”€ database/          # Prisma client singleton
â”‚   â”‚   â”œâ”€â”€ events/            # EventBus, EventTypes, Domain Event Handlers
â”‚   â”‚   â”œâ”€â”€ notifications/     # WAService (Fonnte provider, Noop provider)
â”‚   â”‚   â”œâ”€â”€ security/          # RateLimiter, AntiSpam
â”‚   â”‚   â”œâ”€â”€ seo/               # Site URL helpers
â”‚   â”‚   â”œâ”€â”€ storage/           # Cloudinary upload/delete helpers
â”‚   â”‚   â”œâ”€â”€ monitoring/        # Logger
â”‚   â”‚   â”œâ”€â”€ errors/            # Custom error classes
â”‚   â”‚   â””â”€â”€ config/            # Environment variable validation (Zod)
â”‚   â”‚
â”‚   â”œâ”€â”€ features/              # 20 modul bisnis independen
â”‚   â”‚   â”œâ”€â”€ blog/
â”‚   â”‚   â”‚   â”œâ”€â”€ actions.ts     # Server actions (entry point dari UI)
â”‚   â”‚   â”‚   â”œâ”€â”€ services.ts    # Business logic & ownership policy
â”‚   â”‚   â”‚   â”œâ”€â”€ queries.ts     # Read operations (Prisma queries)
â”‚   â”‚   â”‚   â”œâ”€â”€ repository.ts  # Write operations (Prisma mutations)
â”‚   â”‚   â”‚   â””â”€â”€ schemas.ts     # Zod validation schemas
â”‚   â”‚   â””â”€â”€ ... (19 modul lainnya dengan pola yang sama)
â”‚   â”‚
â”‚   â”œâ”€â”€ components/            # UI components bersama (shadcn/ui + custom)
â”‚   â”œâ”€â”€ lib/                   # Utility functions umum
â”‚   â”œâ”€â”€ jobs/                  # Background jobs (reminder-job.ts)
â”‚   â”œâ”€â”€ tests/                 # Integration & unit tests
â”‚   â””â”€â”€ proxy.ts               # Next.js Middleware (routing guard, subdomain routing)
â”‚
â”œâ”€â”€ scripts/
â”‚   â””â”€â”€ generate-master-data-seed.mjs  # Script generate seed dari spreadsheet
â”‚
â”œâ”€â”€ types/                     # TypeScript global type extensions
â”œâ”€â”€ Dockerfile
â”œâ”€â”€ docker-compose.yml
â”œâ”€â”€ .env.example
â””â”€â”€ vercel.json
```

---

## ðŸ—ƒï¸ Skema Database

Database memiliki **20+ model** yang terhubung dengan relasi yang terdefinisi dengan baik. Seluruh model menerapkan pola:
- **Soft Delete** (`deleted_at`) â€” data tidak pernah dihapus permanen
- **Audit Fields** (`created_by`, `updated_by`) â€” tracking siapa yang mengubah
- **CUID** sebagai primary key â€” collision-resistant, aman untuk distributed system

```
User â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º Role â—„â”€â”€â”€â”€ Permission
  â”‚
  â”œâ”€â”€â”€ Department (6 dept)
  â”œâ”€â”€â”€ Position (jabatan)
  â”‚
  â”œâ”€â”€â”€ Post (artikel blog) â”€â”€â”€â”€ Category
  â”œâ”€â”€â”€ ContentPlan (rencana konten)
  â”œâ”€â”€â”€ KaryaTulis (karya tulis queue)
  â”œâ”€â”€â”€ MediaAsset (file di Cloudinary)
  â”‚
  â”œâ”€â”€â”€ LPJToken (token sekali pakai)
  â”‚       â””â”€â”€ LPJSubmission
  â”‚
  â”œâ”€â”€â”€ AuditLog (append-only)
  â””â”€â”€â”€ Notification (in-app notif)

Program â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º Event â”€â”€â”€â”€ Report
Registration (pendaftar dari web publik)
Announcement (pengumuman + WA blast)
Letter (surat masuk/keluar)
DocumentArchive (arsip dokumen)
FinanceTransaction (kas pemasukan/pengeluaran)
WebConfig (dynamic site config)
```

**Enums penting:**
- `PostStatus`: DRAFT | PENDING_REVIEW | APPROVED | PUBLISHED | ARCHIVED
- `FinanceStatus`: PENDING | APPROVED_TIER1 | COMPLETED | REJECTED
- `LPJTokenStatus`: ACTIVE | USED | EXPIRED
- `EventStatus`: UPCOMING | ONGOING | COMPLETED | CANCELLED
- `AuditAction`: CREATE | UPDATE | DELETE | APPROVE | REJECT | LOGIN | LOGOUT | PUBLISH | ARCHIVE | VERIFY

---

## ðŸš€ Cara Menjalankan Proyek

### Prasyarat

- **Node.js** >= 20.x
- **npm** atau **pnpm**
- **PostgreSQL** 15+ (atau gunakan Docker)
- Akun **Cloudinary** (free tier cukup untuk development)
- Akun **Upstash Redis** (opsional â€” akan fallback ke in-memory cache)

### 1. Clone & Install

```bash
git clone <repo-url>
cd web-komdigi-ikmi
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env dengan kredensial Anda
```

### 3. Setup Database

**Opsi A â€” Docker (Rekomendasi untuk development):**
```bash
docker-compose up -d db
```

**Opsi B â€” PostgreSQL lokal:**
Pastikan PostgreSQL berjalan dan buat database baru.

### 4. Migrasi & Seeding

```bash
# Jalankan migrasi schema
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed data awal (roles, permissions, master data organisasi)
npm run db:seed
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Aplikasi berjalan di:
- **Domain publik**: `http://localhost:3000`
- **Dashboard**: `http://localhost:3000/admin` (redirect ke login)

### 6. Jalankan Tests

```bash
npm test
npm run test:coverage
```

---

## ðŸ” Variabel Lingkungan

| Variabel | Deskripsi | Wajib |
|----------|-----------|-------|
| `DATABASE_URL` | Connection string PostgreSQL (via pooler) | âœ… |
| `DIRECT_URL` | Direct connection string PostgreSQL (untuk migrasi Prisma) | âœ… |
| `AUTH_SECRET` | Secret 32-byte untuk JWT signing | âœ… |
| `AUTH_URL` | URL base domain dashboard (untuk Auth.js callback) | âœ… |
| `NEXT_PUBLIC_SITE_URL` | URL base domain publik | âœ… |
| `CRON_SECRET` | Secret token untuk mengamankan endpoint cron job | âœ… |
| `CLOUDINARY_CLOUD_NAME` | Cloud name akun Cloudinary | âœ… |
| `CLOUDINARY_API_KEY` | API Key Cloudinary | âœ… |
| `CLOUDINARY_API_SECRET` | API Secret Cloudinary | âœ… |
| `UPSTASH_REDIS_REST_URL` | REST URL Upstash Redis | â¬œ (fallback ke memory) |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash Redis | â¬œ (fallback ke memory) |
| `FONNTE_TOKEN` | API token Fonnte untuk WhatsApp blast | â¬œ (fallback ke log-only) |
| `WA_DEBUG` | Set `true` untuk log WA tanpa kirim aktual | â¬œ |
| `NODE_ENV` | `development` atau `production` | âœ… |

---

## ðŸŒ Deployment

### Vercel (Rekomendasi)

1. Push ke repository GitHub
2. Connect repository ke Vercel
3. Tambahkan semua environment variable di Vercel Dashboard
4. Deploy

### Docker

```bash
# Build image
docker build -t ikmi-web .

# Jalankan dengan docker-compose (App + DB)
docker-compose up -d
```

### Catatan Penting Deployment

- Pastikan `DATABASE_URL` menggunakan connection pooler (Supabase pooler, PgBouncer) untuk serverless environment
- Gunakan `DIRECT_URL` yang mengarah langsung ke PostgreSQL untuk Prisma migrations
- Upstash Redis sangat direkomendasikan di production untuk RBAC permission cache

---

## ðŸ›ï¸ Prinsip Desain Sistem

1. **Least Privilege** â€” Setiap role hanya mendapatkan akses minimum yang dibutuhkan untuk tugasnya.
2. **Fail-Safe Defaults** â€” Jika cek permission gagal, sistem menolak akses (deny by default).
3. **Soft Delete Everywhere** â€” Tidak ada data yang dihapus permanen; selalu soft delete dengan `deleted_at`.
4. **Audit Everything** â€” Setiap mutasi data bisnis penting dicatat di `AuditLog` melalui transaksi atomik.
5. **Graceful Degradation** â€” Sistem tetap berfungsi meski Redis atau WA provider tidak tersedia.
6. **Separation of Concerns** â€” Business logic (services) terpisah dari data access (repository) terpisah dari presentation (app/).
7. **Event Decoupling** â€” Side effects dipisah dari business logic utama melalui internal EventBus.

---

<div align="center">

**Sistem Informasi Terpadu IKMI Cirebon**

Dibangun oleh **[Riza Alraihany](https://www.linkedin.com/in/riza-alraihany)**

*Departemen Komdigi IKMI Se-Wilayah Cirebon â€” Kabinet Sri Nawikasa*

</div>
