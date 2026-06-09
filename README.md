# Sistem Informasi Terpadu IKMI Cirebon

Aplikasi web modern yang dibangun untuk mendukung seluruh operasional dan profil publik organisasi **Ikatan Keluarga Mahasiswa Indramayu (IKMI) Se-Wilayah Cirebon**. Sistem ini mengusung arsitektur *Enterprise Ready Modular Monolith*.

---

## 🎯 Gambaran Umum Aplikasi

Aplikasi ini dibagi menjadi dua *domain* utama:

### 1. Domain Publik (Landing Page)
Platform terbuka yang digunakan sebagai alat *branding*, pusat informasi, dan portal konversi bagi masyarakat luas dan calon mahasiswa Indramayu. 
Fitur Publik yang telah terimplementasi:
- **Beranda (Home):** Memperkenalkan "Empat Pilar" organisasi (Intelektual, Solidaritas, Kearifan, Kepedulian).
- **Struktur Organisasi:** Menampilkan anggota Kabinet Sri Nawikasa.
- **Agenda & Kalender Kegiatan:** Menampilkan program kerja dan event yang berjalan.
- **Ruang Gagasan (Blog):** Portal publikasi berisi Berita, Opini, dan Kajian dari departemen.
- **Registrasi & Aduan:** Form pendaftaran (Open Recruitment) anggota baru dan kanal aduan masyarakat.

### 2. Domain Internal (Dashboard Pengurus)
Portal *Enterprise* tertutup (`/admin`) yang dikhususkan bagi para pengurus IKMI untuk mengelola jalannya roda organisasi, didukung dengan *Role Based Access Control (RBAC)*. Tampilan dashboard dan KPI (Key Performance Indicator) langsung disesuaikan dengan jabatan pengguna, seperti:
- **Super Admin:** Memantau seluruh sistem.
- **BPH & Bendahara:** Persetujuan dana (Finance Approval) dan Laporan Pertanggungjawaban (LPJ).
- **Kaderisasi:** Memproses dan menindaklanjuti data pendaftar baru.
- **Komdigi:** Melakukan manajemen publikasi blog, agenda, dan konfigurasi web.
- **Advokasi:** Menangani tiket aduan masuk.

Modul yang tersedia di dalam Dashboard:
- `Users` (Manajemen Pengguna & Pengurus)
- `Blog` (Content Management System)
- `Registration` (Penerimaan Anggota Baru)
- `Finance` (Sistem Pengajuan & Approval Dana)
- `Complaints` (Layanan Aduan Publik)
- `Events` & `Reports` (Manajemen Kegiatan dan LPJ)
- `Letters` (Sistem Persuratan Organisasi)
- `Audit Logs` (Rekam jejak perubahan data dalam sistem)
- `Web Config` (Pengaturan dinamis website)

---

## 🛠️ Stack Teknologi Saat Ini

Berdasarkan implementasi *codebase*, aplikasi dibangun di atas teknologi berikut:
- **Framework Utama:** Next.js v16 (App Router) menggunakan TypeScript.
- **Styling & UI:** Tailwind CSS v4 terintegrasi dengan komponen `shadcn/ui` dan animasi dasar (`tailwindcss-animate`).
- **Database & ORM:** PostgreSQL dengan Prisma ORM (`@prisma/client` v6).
- **Autentikasi:** Next-Auth v5 (Beta) dengan implementasi JWT + Credentials.
- **State & Validasi:** React Hook Form dipadukan dengan Zod.
- **Storage:** Cloudinary (untuk menyimpan gambar dan dokumen).
- **Caching & Rate Limiting:** Upstash Redis (serta *In-Memory fallback*).
- **Teks Editor (WYSIWYG):** Tiptap React.

---

## 📐 Pola Arsitektur Codebase

Struktur folder mengadopsi prinsip `Feature-First` dengan pendekatan **CQRS Lite** (Command and Query Responsibility Segregation). 

- **`src/app`**: Hanya berisi layer routing dan layout (*Presentation*).
- **`src/core`**: Logika fondasi infrastruktur seperti `auth`, `database`, `storage`, `security`, dan `events`.
- **`src/features`**: Kumpulan modul bisnis independen (misal: `blog`, `finance`, `users`). Masing-masing fitur umumnya memiliki:
  - `actions.ts` (Server actions)
  - `queries.ts` (Pembacaan data)
  - `services.ts` (Validasi mutasi bisnis / penulisan)
  - `repositories.ts` (Interaksi langsung dengan database Prisma)
  - `schemas.ts` (Definisi Zod validator)

Semua entitas di-desain menggunakan pola ID *CUID* dan menggunakan fitur *soft delete* (`deleted_at`), serta dikawal ketat oleh *Ownership Policy* dalam layanannya (Misal: Seorang ketua departemen hanya bisa mengelola event milik departemennya sendiri).

---
*README ini dihasilkan berdasarkan hasil audit awal struktur sistem eksisting.*
