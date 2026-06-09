# 07-ALUR-FLOW.md

# Business Flow & System Flow Documentation

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project Name  | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Business Flow Documentation           |
| Version       | 3.0                                   |
| Status        | APPROVED & LOCKED                     |
| Last Updated  | 2026-06-08                            |

---

# Purpose

Dokumen ini menjelaskan:

* Alur bisnis organisasi IKMI
* Alur pengguna publik
* Alur pengurus internal
* Integrasi antar modul
* Integrasi antar domain
* Hubungan data antar sistem

Dokumen ini menjadi acuan utama untuk:

* UI/UX
* Database Design
* Service Layer
* API Design
* RBAC
* Seeder
* Testing

---

# Domain Architecture

Sistem IKMI terdiri dari 2 domain utama.

---

## Domain Publik

```text
https://ikmicirebon.or.id
```

Target pengguna:

* Masyarakat umum
* Mahasiswa
* Calon anggota
* Alumni
* Mitra organisasi

Tidak memerlukan login.

---

## Domain Internal

```text
https://dashboard.ikmicirebon.or.id
```

Target pengguna:

* Pengurus
* Ketua Departemen
* BPH
* Administrator Sistem

Seluruh akses wajib login menggunakan Auth.js.

---

# High Level Flow

```text
PUBLIC DOMAIN
      ↓
Pendaftaran Anggota
      ↓
Database Calon Anggota
      ↓
Dashboard Internal
      ↓
Verifikasi Kaderisasi
      ↓
Anggota Aktif
      ↓
Pengurus / Demisioner / Alumni
```

---

# PUBLIC DOMAIN FLOW

## Landing Page

Landing page menjadi pusat informasi publik organisasi.

Menu utama:

* Beranda
* Tentang Kami
* Event & Program Kerja
* Struktur Organisasi
* Blog
* Daftar Anggota

---

## Landing Page Structure

```text
Landing Page

├── Hero Section
├── 4 Pilar IKMI
├── Tentang IKMI
├── Pengurus
├── Event & Program Kerja
├── Blog & Ruang Gagasan
├── Form Aduan
└── CTA Daftar Anggota
```

---

# Tentang Kami Flow

```text
Landing Page
      ↓
Tentang Kami
      ↓
├── Sejarah IKMI
├── Visi
├── Misi
└── Nilai Organisasi
```

---

# Struktur Organisasi Flow

```text
Landing Page
      ↓
Struktur Organisasi
      ↓
Daftar Pengurus
      ↓
Detail Pengurus
      ↓
├── Nama
├── Kampus
├── Jurusan
└── Kecamatan Asal
```

---

# Event & Program Kerja Flow

```text
Landing Page
      ↓
Event & Program Kerja
      ↓
├── List Event
├── Detail Event
├── List Program Kerja
└── Detail Program Kerja
```

---

# Blog Flow

```text
Landing Page
      ↓
Blog
      ↓
├── List Artikel
├── Filter Kategori
├── Search Artikel
└── Detail Artikel
```

---

# Public Complaint Flow

```text
Masyarakat
      ↓
Form Aduan
      ↓
Submit Aduan
      ↓
Database Aduan
      ↓
Departemen Advokasi & Kajian Strategis
      ↓
Tindak Lanjut
```

---

# Member Registration Flow

## Tahap 1

Calon anggota mengisi formulir.

Data yang dikumpulkan:

* Nama Lengkap
* Kampus
* Jurusan
* Semester
* Nomor WhatsApp
* Alamat Lengkap
* Kecamatan
* Alasan Bergabung

---

## Tahap 2

Validasi sistem.

```text
Form Pendaftaran
      ↓
Validasi Data
      ↓
Simpan Database
```

---

## Tahap 3

Setelah berhasil.

```text
Berhasil Mendaftar
      ↓
Halaman Terima Kasih
      ↓
Gabung Grup WhatsApp
```

---

## Tahap 4

Data masuk ke dashboard internal.

```text
Database Calon Anggota
      ↓
Dashboard Kaderisasi
```

---

# INTERNAL DOMAIN FLOW

## Login Flow

```text
Login
      ↓
Auth.js
      ↓
RBAC Validation
      ↓
Dashboard
```

---

# Dashboard Flow

```text
Dashboard Utama

├── CMS
├── Keanggotaan
├── Kaderisasi
├── Keuangan
├── Persuratan
├── Program Kerja
├── Event
├── LPJ
├── Aduan
├── Notifikasi
└── Executive Dashboard
```

---

# Kaderisasi Flow

Departemen Penanggung Jawab:

```text
Departemen Kaderisasi
```

---

## Flow

```text
Calon Anggota
      ↓
Review Pendaftar
      ↓
Verifikasi Data
      ↓
Approve / Reject
```

---

## Jika Approve

```text
Approve
      ↓
Anggota Aktif
      ↓
Database Keanggotaan
```

---

## Jika Reject

```text
Reject
      ↓
Arsip Pendaftaran
```

---

# Membership Lifecycle

```text
Calon Anggota
      ↓
Anggota Aktif
      ↓
Pengurus
      ↓
Demisioner
      ↓
Alumni
```

---

# CMS Flow

Departemen:

```text
Komunikasi & Digitalisasi (Komdigi)
```

---

## Flow

```text
Draft Artikel
      ↓
Review
      ↓
Publish
      ↓
Website Publik
```

---

# Event Flow

```text
Departemen
      ↓
Buat Event
      ↓
Publikasi
      ↓
Pelaksanaan
      ↓
LPJ
```

---

# Program Kerja Flow

```text
Departemen
      ↓
Program Kerja
      ↓
Monitoring
      ↓
Evaluasi
```

---

# LPJ Flow

```text
Program Kerja Selesai
      ↓
Upload LPJ
      ↓
Verifikasi Ketua Departemen
      ↓
Verifikasi BPH
      ↓
Arsip LPJ
```

---

# Finance Flow

## Pengajuan Dana

```text
Departemen
      ↓
Buat Pengajuan
      ↓
Approval Bendahara
      ↓
Approval Ketua Umum
      ↓
Pencairan
      ↓
LPJ Keuangan
```

---

# Complaint Flow

Departemen Penanggung Jawab:

```text
Departemen Advokasi & Kajian Strategis
```

---

## Flow

```text
Aduan Masuk
      ↓
Assign PIC
      ↓
Investigasi
      ↓
Tindak Lanjut
      ↓
Selesai
```

---

# Letter Flow

```text
Buat Surat
      ↓
Nomor Surat Otomatis
      ↓
Review Sekretaris
      ↓
Arsip
```

---

# Notification Flow

Trigger otomatis berasal dari:

* Pendaftaran Anggota
* Pengajuan Dana
* LPJ
* Aduan
* Artikel
* Event

Flow:

```text
Event System
      ↓
Notification Service
      ↓
Notification Center
      ↓
User
```

---

# Data Flow Between Domains

## Public → Internal

```text
Pendaftaran Anggota
      ↓
Dashboard Kaderisasi
```

```text
Form Aduan
      ↓
Dashboard Advokasi
```

---

## Internal → Public

```text
Artikel
      ↓
Website Publik
```

```text
Program Kerja
      ↓
Website Publik
```

```text
Event
      ↓
Website Publik
```

```text
Struktur Organisasi
      ↓
Website Publik
```

---

# Source of Truth

Dokumen ini menjadi referensi utama untuk:

* Business Process
* UI Flow
* UX Flow
* Service Layer
* Testing Scenario
* Acceptance Criteria
* Dashboard Design
* Landing Page Design

Jika implementasi berbeda dengan dokumen ini maka implementasi harus mengikuti ALUR-FLOW.md.
