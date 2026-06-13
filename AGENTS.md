# AGENTS.md

# AI Engineering Constitution

## Sistem Informasi Terpadu IKMI Cirebon

---

# Purpose

Dokumen ini merupakan instruksi permanen yang wajib dipatuhi oleh seluruh AI Coding Agent yang digunakan pada proyek:

```text
Sistem Informasi Terpadu IKMI Cirebon
```

Contoh:

- Antigravity
- Codex
- Claude Code
- Cursor
- Cline
- Roo Code
- Windsurf
- Gemini CLI
- Continue
- OpenHands
- AI Agent lainnya

---

# Source Of Truth Priority

Apabila terjadi konflik antar dokumen:

```text
AGENTS.md
↓
rangkuman-refaktor-ikmi.md
↓
MASTER-DATA.md
↓
design.md
↓
User Prompt
```

AI wajib mengikuti prioritas di atas.

---

# Project Overview

Nama:

Sistem Informasi Terpadu IKMI Cirebon

Arsitektur:

Enterprise Ready Modular Monolith

Framework:

Next.js App Router

Bahasa:

TypeScript Strict Mode

Database:

PostgreSQL + Prisma ORM

Authentication:

Auth.js v5 + JWT Strategy

Storage:

Cloudinary

Cache:

Upstash Redis

UI:

Tailwind CSS
Shadcn UI

---

# Scope Refaktor — Wajib Dipatuhi

Sistem ini telah melalui refaktor scope. AI wajib memahami dan mematuhi batasan berikut.

## Departemen yang Dipangkas (Tidak Diimplementasikan sebagai Modul Aktif)

Departemen berikut **tidak memiliki role atau modul aktif** di sistem:

- Kaderisasi
- Advokasi
- PSDA
- Ekraf
- HPM

Seluruh anggota departemen tersebut diperlakukan sebagai **User biasa**. Perbedaan antar mereka hanya tercermin di data profil (jabatan/departemen asal), bukan di level akses sistem.

## Modul yang Dihapus (Dilarang Diimplementasikan)

- Membership lifecycle (PRABUMI, MAKRAB, verifikasi kaderisasi, dst.)
- Notification Center terpusat
- Advokasi/Aduan publik
- Executive Analytics kompleks

AI dilarang membuat, menyebut, atau mereferensikan modul-modul di atas kecuali secara eksplisit diminta untuk keperluan dokumentasi arsip.

---

# Role Architecture

Sistem hanya memiliki **tiga role utama**:

```text
Super Admin  →  Ketua & Wakil Ketua
Admin IKMI   →  Komdigi | Sekretaris | Bendahara
User         →  Semua anggota lainnya (termasuk eks-departemen yang dipangkas)
```

AI dilarang membuat role baru di luar tiga role di atas tanpa instruksi eksplisit.

---

# Domain Architecture

## Public Domain

https://ikmicirebon.or.id

Tidak memiliki login.

Fungsi:

- Landing Page
- Tentang Kami
- Struktur Pengurus
- Event & Program Kerja
- Blog & Artikel
- Pendaftaran Anggota (form publik — tanpa login)

> **Catatan refaktor:** Fitur Aduan Publik telah dihapus dari scope. Dilarang diimplementasikan.

---

## Internal Domain

https://dashboard.ikmicirebon.or.id

Hanya untuk pengurus yang memiliki akses login (Super Admin & Admin IKMI).

Fungsi per role:

**Super Admin (Ketua & Wakil Ketua):**
- Dashboard overview
- Manajemen user & role
- Generate LPJ Submission Token
- Read access ke semua modul Admin IKMI

**Admin IKMI — Komdigi:**
- Dashboard Komdigi
- Content Plan
- Karya Tulis Queue
- CMS & Website Management

**Admin IKMI — Sekretaris:**
- Dashboard Sekretaris
- Kalender Kegiatan
- Pengumuman + WA Blast
- Surat Masuk & Keluar
- Arsip Dokumen
- Manajemen Pengurus
- Manajemen Anggota Baru

**Admin IKMI — Bendahara:**
- Dashboard Bendahara
- Buku Kas
- Laporan Keuangan
- LPJ Module (Generate Token, Inbox, Verifikasi, Arsip)

**User (Anggota Umum — hanya login, tidak ada akses dashboard penuh):**
- Kalender Kegiatan (read only)
- Pengumuman (read only)
- Dashboard Keuangan (read only)
- Request Pamflet
- Submit Karya Tulis
- Submit LPJ via Token
- Edit Profil

> **Catatan refaktor:** Modul Kaderisasi, Analytics kompleks, dan Notification Center terpusat telah dihapus dari internal domain.

---

# Aturan Anggota & Pengurus

## Pengurus (data dikelola Sekretaris)

Pengurus adalah seluruh individu yang menjabat di organisasi, meliputi:
- BPH: Ketua, Wakil Ketua, Sekretaris, Bendahara
- Semua departemen: Komdigi, Kaderisasi, Advokasi, PSDA, Ekraf, HPM (aktif maupun dipangkas)

Pengurus yang tidak memiliki role Admin/Super Admin tetap tercatat sebagai **User biasa** di sistem. Data mereka (jabatan, departemen asal, status aktif/demisioner) dikelola oleh Sekretaris melalui modul Manajemen Pengurus.

## Anggota Baru (pendaftar dari web publik)

Anggota baru mendaftar melalui form di web publik **tanpa membuat akun login**. Alur:

```text
Calon anggota isi form di web publik (nama, nomor WA, dll)
    ↓ sistem otomatis kirim link invite grup WA via Fonnte
    ↓ data pendaftar tercatat di dashboard Sekretaris (arsip)
Calon anggota klik link invite → bergabung ke grup WA
Selesai — anggota tidak memiliki akses login ke sistem
```

Anggota baru **tidak memiliki akun** dan **tidak bisa login** ke dashboard. Tidak ada flow approval.

---

# Sistem Notifikasi WA

Provider: **Fonnte** (atau provider sejenis dengan API sederhana)

Arsitektur notifikasi dibuat terpisah dari logic utama agar mudah ganti provider.

Trigger WA yang diizinkan:

| Trigger | Pengirim | Penerima |
|---|---|---|
| Pengumuman baru (Sekretaris) | Sekretaris | Semua user aktif |
| Pendaftaran anggota baru dari web publik | Sistem (otomatis) | Calon anggota (link invite grup WA) |

AI dilarang menambah trigger WA di luar tabel di atas tanpa instruksi eksplisit.

---

# Sistem LPJ Submission Token

Mekanisme token satu kali pakai untuk User (eks-departemen) agar bisa submit LPJ tanpa role Admin.

Aturan token:
- Hanya bisa digunakan **satu kali**
- Memiliki **batas waktu expired**
- User **wajib login** sebelum mengakses form LPJ
- Token di-generate oleh Bendahara atau Super Admin

---

# Master Data Rule

Single Source Of Truth:

MASTER-DATA.xlsx

Dokumen pendamping:

MASTER-DATA.md

AI dilarang membuat:

- Departemen baru
- Jabatan baru
- Program kerja baru

yang tidak terdapat pada MASTER-DATA.

---

# Architecture Rule

AI wajib mematuhi:

- PROJECT-CONSTITUTION.md
- MASTER-DATA.md
- 05-DATABASE-DICTIONARY.md
- 06-RBAC-MATRIX.md
- 07-FOLDER-STRUCTURE.md
- ALUR-FLOW.md
- 14-ENGINEERING-DOD.md
- 15-DESIGN.md

Dilarang membuat asumsi yang bertentangan dengan dokumen tersebut.