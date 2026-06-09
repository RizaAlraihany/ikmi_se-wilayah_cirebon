# 14-ENGINEERING-DOD.md

# Engineering Definition of Done (DoD)

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item         | Value                               |
| ------------ | ----------------------------------- |
| Document     | Engineering Definition of Done      |
| Version      | 3.0                                 |
| Status       | LOCKED                              |
| Architecture | Enterprise Ready Modular Monolith   |
| Framework    | Next.js App Router                  |
| Language     | TypeScript                          |
| Applies To   | Public Website & Internal Dashboard |

---

# Purpose

Dokumen ini merupakan standar resmi yang menentukan:

- Kriteria sebuah fitur dianggap selesai
- Kriteria sebuah modul dianggap siap digunakan
- Kriteria sebuah sprint dianggap selesai
- Kriteria aplikasi boleh naik ke Staging
- Kriteria aplikasi boleh naik ke Production

Tidak ada fitur yang boleh berstatus DONE apabila belum memenuhi dokumen ini.

---

# Core Engineering Principles

Seluruh pengembangan wajib mengikuti prinsip berikut:

1. Security First
2. Business Logic First
3. Mobile First
4. Accessibility First
5. Scalability First
6. Performance First
7. Auditability First
8. Maintainability First

---

# Global Quality Gates

Seluruh fitur wajib memenuhi:

## TypeScript

Wajib:

```text
0 TypeScript Error
```

Tidak boleh ada:

```ts
any;
```

Tidak boleh ada:

```ts
@ts-ignore
```

Tidak boleh ada:

```ts
@ts-nocheck
```

---

## ESLint

Wajib:

```text
0 ESLint Error
```

Warning diperbolehkan hanya jika terdokumentasi.

---

## Build

Wajib:

```bash
npm run build
```

Status:

```text
PASS
```

---

## Testing

Critical Path wajib memiliki test.

Minimal coverage:

```text
80%
```

Untuk:

- Authentication
- RBAC
- Ownership
- Finance
- Registration
- LPJ Workflow

---

# Architecture DoD

---

## Modular Monolith

Wajib:

```text
Feature Based Structure
```

Contoh:

```text
features/blog
features/finance
features/events
```

Tidak boleh:

```text
controllers/
services/
models/
```

global style architecture.

---

## CQRS Lite

Read:

```text
queries.ts
```

Write:

```text
services.ts
```

Database:

```text
repository.ts
```

Tidak boleh mencampur Query dan Command.

---

## Service Layer

Business Logic wajib berada di:

```text
services.ts
```

Dilarang:

- Business Logic di Page
- Business Logic di Component
- Business Logic di Server Action

---

# Security DoD

---

## Authentication

Wajib:

- Auth.js
- JWT Strategy
- Session Validation
- User Active Validation

User Nonaktif:

```text
Tidak boleh login
```

User Soft Deleted:

```text
Tidak boleh login
```

---

## Authorization

Semua mutasi wajib:

```ts
can(permission, user);
```

Tidak boleh:

```ts
if(role === 'admin')
```

Hardcoded role checking dilarang.

---

## Ownership Policy

Semua data departemen wajib memiliki:

```text
departmentId
```

Validasi:

```text
User hanya boleh mengubah data milik departemennya
```

Kecuali:

```text
Super Admin
```

---

## Validation

Semua input wajib:

```text
Zod Schema
```

Tidak boleh menerima:

- raw request
- unchecked payload

---

## File Upload

Wajib:

- MIME Validation
- File Size Validation
- Extension Validation

Provider:

```text
Cloudinary
```

Tidak boleh:

```text
fs.writeFile
```

untuk production.

---

# Database DoD

---

## Prisma

Semua query wajib menggunakan:

```text
Prisma ORM
```

Tidak boleh:

```sql
raw SQL
```

kecuali alasan performa yang terdokumentasi.

---

## Soft Delete

Semua entitas utama wajib memiliki:

```prisma
deletedAt DateTime?
```

Tidak boleh menggunakan hard delete.

---

## Migration

Wajib:

```bash
prisma migrate deploy
```

PASS.

---

## Seeder

Wajib:

```bash
prisma db seed
```

PASS.

Seeder wajib membuat:

- Roles
- Permissions
- Departments
- Super Admin

---

# Public Website DoD

Domain:

```text
ikmicirebon.or.id
```

---

## Landing Page

Wajib memiliki:

- Hero Section
- 4 Pilar IKMI
- Tentang IKMI
- Pengurus
- Event & Program Kerja
- Blog & Ruang Gagasan
- CTA Gabung IKMI

---

## Registration

Wajib:

- Form Pendaftaran
- Validasi
- Simpan ke Database
- Redirect WhatsApp Group

---

## Blog

Wajib:

- List Artikel
- Detail Artikel
- Filter
- Search

---

## Event

Wajib:

- List Event
- Detail Event
- Program Kerja

---

## Struktur Organisasi

Wajib:

- Daftar Pengurus
- Modal Detail Pengurus

---

## Aduan Publik

Wajib:

- Form Aduan
- Tracking Status Internal

---

# Dashboard DoD

Domain:

```text
dashboard.ikmicirebon.or.id
```

---

## Authentication

Wajib Login.

Tidak ada akses anonymous.

---

## Dashboard Home

Wajib memiliki:

- Welcome Card
- KPI Cards
- Notification Center
- Role Based Widget

---

## CMS

Wajib:

- Landing Page Management
- Blog Management
- Event Management
- Struktur Organisasi Management

---

## Kaderisasi

Wajib:

- Review Pendaftar
- Approve
- Reject
- Konversi ke Anggota

---

## Keuangan

Wajib:

- Request Dana
- Approval Tier 1
- Approval Tier 2
- Bukti Transfer
- LPJ Keuangan

---

## LPJ

Workflow wajib:

```text
Submit
→ Verifikasi Kadep
→ Verifikasi BPH
→ Arsip
```

---

## Persuratan

Wajib:

- Surat Masuk
- Surat Keluar
- Nomor Surat Otomatis
- Upload PDF

---

## Advokasi

Wajib:

- Aduan Masuk
- Assign PIC
- Status Tracking
- Penyelesaian Aduan

---

# Event Driven DoD

Semua mutasi penting wajib memicu event.

Contoh:

```text
registration.created
registration.approved

finance.requested
finance.approved

lpj.submitted
lpj.verified

post.published
```

---

# Audit Log DoD

Semua mutasi penting wajib tercatat.

Minimal:

```text
CREATE
UPDATE
DELETE
APPROVE
REJECT
LOGIN
LOGOUT
```

Audit Log wajib menyimpan:

- User
- Timestamp
- Entity
- Action
- Before
- After

---

# Notification DoD

Wajib memiliki:

- Notification Center
- Unread Counter
- Mark Read
- Mark All Read

Notification harus muncul untuk:

- Approval
- Finance
- LPJ
- Registration
- Complaints

---

# Performance DoD

---

## Redis

Provider:

```text
Upstash Redis
```

Wajib digunakan untuk:

- Permission Cache
- Notification Counter
- Rate Limiter

---

## Pagination

Semua tabel wajib:

```text
Pagination
```

Tidak boleh load seluruh data.

---

## Images

Wajib:

```text
WebP
```

Landing Page:

```text
≤ 500 KB
```

Hero:

```text
≤ 1 MB
```

---

# UX & Design DoD

Mengacu penuh ke:

```text
15-DESIGN.md
```

---

Wajib:

- Mobile First
- Light Theme
- Shadcn UI
- Rounded 2XL Cards
- Empty State
- Skeleton Loading
- Error State

---

Dilarang:

- AdminLTE Style
- Bootstrap Admin Template
- Dark Public Website
- Alert()
- Confirm()

---

# Staging Readiness Gate

Sebelum naik Staging:

Semua harus PASS:

```text
✓ Build
✓ Lint
✓ Migration
✓ Seed
✓ Auth
✓ RBAC
✓ Ownership
✓ Cloudinary
✓ Redis
✓ Notifications
✓ Audit Log
```

---

# Production Readiness Gate

Selain seluruh syarat Staging:

Wajib:

```text
✓ UAT selesai
✓ Stakeholder approval
✓ Backup policy aktif
✓ Monitoring aktif
✓ Error tracking aktif
✓ SSL aktif
✓ Domain aktif
```

---

# Release Status Definition

| Status           | Meaning           |
| ---------------- | ----------------- |
| NOT STARTED      | Belum dimulai     |
| IN PROGRESS      | Sedang dikerjakan |
| BLOCKED          | Terhambat         |
| REVIEW           | Menunggu review   |
| DONE             | Lulus seluruh DoD |
| STAGING READY    | Siap UAT          |
| PRODUCTION READY | Siap Deploy       |
| RELEASED         | Sudah Production  |

---

# Source of Truth

Dokumen ini adalah kontrak engineering resmi proyek.

Apabila implementasi berbeda dengan dokumen ini, maka implementasi wajib menyesuaikan dengan 14-ENGINEERING-DOD.md.
