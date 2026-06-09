# PROJECT-CONSTITUTION.md

# Project Constitution

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project       | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Project Constitution                  |
| Version       | 3.0                                   |
| Status        | LOCKED                                |
| Priority      | HIGHEST                               |
| Authority     | ABSOLUTE SOURCE OF TRUTH              |

---

# Purpose

Dokumen ini mendefinisikan aturan dasar yang mengikat seluruh pengembangan Sistem Informasi Terpadu IKMI Cirebon.

Seluruh:

- Developer
- AI Agent
- Contributor
- Maintainer
- Vendor

wajib mematuhi dokumen ini.

Apabila terdapat konflik antara dokumen lain dan dokumen ini, maka:

```text
PROJECT-CONSTITUTION.md
MEMILIKI PRIORITAS TERTINGGI
```

---

# Core Mission

Membangun sistem informasi organisasi yang:

- Profesional
- Modern
- Mudah digunakan
- Transparan
- Terukur
- Berkelanjutan

untuk mendukung seluruh aktivitas organisasi IKMI Cirebon.

---

# Domain Architecture

Sistem terdiri dari dua domain utama.

---

## Domain Publik

URL:

```text
https://ikmicirebon.or.id
```

Tujuan:

- Branding organisasi
- Informasi publik
- Rekrutmen anggota
- Publikasi kegiatan
- Publikasi artikel

Karakteristik:

- Tidak membutuhkan login
- Mobile First
- SEO Friendly
- High Conversion

---

## Domain Internal

URL:

```text
https://dashboard.ikmicirebon.or.id
```

Tujuan:

- Operasional organisasi
- Administrasi
- Keuangan
- Kaderisasi
- Persuratan
- Program Kerja
- LPJ
- CMS

Karakteristik:

- Wajib login
- RBAC Based
- Ownership Based
- Audit Logged

---

# Business Principles

Seluruh fitur harus mendukung proses organisasi nyata.

Sistem tidak boleh dibuat hanya karena:

```text
"Keren untuk ditampilkan"
```

Setiap fitur wajib memiliki:

- Pemilik proses
- Tujuan organisasi
- Data yang dihasilkan
- Nilai operasional

---

# Single Source of Truth

Urutan otoritas dokumen:

1. PROJECT-CONSTITUTION.md
2. ALUR-FLOW.md
3. DATABASE-DICTIONARY.md
4. RBAC-MATRIX.md
5. DESIGN.md
6. DOD.md
7. Dokumen lainnya

Jika terjadi konflik:

```text
Constitution menang.
```

---

# Architectural Principles

---

## Modular Monolith

Arsitektur resmi:

```text
Enterprise Ready Modular Monolith
```

Bukan Microservice.

---

## Feature First

Struktur aplikasi wajib berdasarkan fitur.

Benar:

```text
src/features/blog
src/features/finance
src/features/events
```

Salah:

```text
src/controllers
src/models
src/routes
```

---

## Separation of Concerns

Business Logic tidak boleh berada di:

- UI Component
- Page Component
- Server Action

Business Logic wajib berada di:

```text
services.ts
```

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

Repository:

```text
repository.ts
```

---

## No Direct Prisma Access

Dilarang:

```ts
prisma.user.findMany();
```

di:

- app/
- components/

Prisma hanya boleh diakses dari:

- Repository
- Query Layer

---

# Security Principles

---

## Authentication

Framework resmi:

```text
Auth.js
```

---

## Authorization

Framework resmi:

```text
RBAC + Ownership Policy
```

---

## Hard Rule

Tidak boleh ada:

```ts
if(role === "admin")
```

Hard-coded role checking dilarang.

Wajib:

```ts
can(permission, user);
```

---

## Super Admin Override

Super Admin dapat mengakses seluruh fitur.

Tetapi seluruh aktivitas tetap:

```text
Audit Logged
```

---

# Ownership Policy

Data milik departemen hanya boleh dimodifikasi oleh:

- Pembuat data
- Ketua Departemen terkait
- BPH yang berwenang
- Super Admin

---

# Database Principles

Database resmi:

```text
PostgreSQL
```

Provider:

```text
Neon PostgreSQL
```

ORM:

```text
Prisma
```

---

# Auditability

Seluruh data penting wajib memiliki:

```text
createdAt
updatedAt
deletedAt
```

---

Seluruh mutasi penting wajib masuk:

```text
Audit Log
```

---

# Soft Delete Policy

Dilarang melakukan:

```sql
DELETE FROM table
```

untuk data operasional.

Wajib menggunakan:

```text
Soft Delete
```

---

# Event Driven Principles

Side Effect tidak boleh berada di Service Utama.

Contoh:

Salah:

```ts
createPost();
sendNotification();
writeAuditLog();
```

Benar:

```ts
createPost();

eventBus.emit("post.created");
```

---

# UI/UX Principles

Dokumen acuan:

```text
15-DESIGN.md
```

---

## Public Website

Harus:

- Mobile First
- Light Mode Only
- SEO Friendly
- High Conversion

---

## Dashboard

Harus:

- Productivity Focused
- Mobile Friendly
- Role Based

---

# Performance Principles

Wajib:

- Pagination
- Lazy Loading
- Optimized Images
- Query Optimization

---

Dilarang:

- N+1 Query
- Full Table Loading
- Unoptimized Upload

---

# Testing Principles

Minimal wajib ada:

## Authentication

- Login Success
- Login Failed

## RBAC

- Permission Test

## Ownership

- Ownership Validation

## Workflow

- Registration
- Finance
- Blog

---

# File Upload Principles

Provider resmi:

```text
Cloudinary
```

Dilarang menyimpan file di:

```text
/public/uploads
```

untuk production.

---

# Cache Principles

Provider resmi:

```text
Upstash Redis
```

Digunakan untuk:

- Permission Cache
- Notification Cache
- Rate Limiter

---

# Public Website Rules

Domain:

```text
ikmicirebon.or.id
```

Tidak boleh memiliki:

- Login
- Dashboard
- Admin Menu

Fokus:

- Branding
- Informasi
- Rekrutmen

---

# Dashboard Rules

Domain:

```text
dashboard.ikmicirebon.or.id
```

Semua fitur internal berada di sini.

---

# Documentation Rules

Setiap perubahan besar wajib memperbarui:

- ALUR-FLOW.md
- DATABASE-DICTIONARY.md
- RBAC-MATRIX.md
- DESIGN.md

jika terdampak.

---

# AI Agent Rules

Berlaku untuk:

- Codex
- Cursor
- Claude
- GPT
- Antigravity
- Agent lainnya

Agent dilarang:

- Mengubah arsitektur tanpa persetujuan
- Menghapus ownership policy
- Menghapus audit log
- Menghapus RBAC
- Menghapus soft delete

Agent wajib:

- Membaca PROJECT-CONSTITUTION.md terlebih dahulu
- Membaca ALUR-FLOW.md sebelum implementasi
- Mematuhi DESIGN.md saat membuat UI

---

# Release Criteria

Sistem hanya boleh dianggap siap rilis jika:

- Build Success
- Lint Success
- Type Check Success
- Migration Success
- Seeder Success
- Critical Tests Passed
- UAT Approved

---

# Final Authority

PROJECT-CONSTITUTION.md adalah dokumen hukum tertinggi proyek.

Jika terdapat keraguan dalam pengambilan keputusan teknis maupun bisnis, keputusan harus kembali mengacu pada dokumen ini.
