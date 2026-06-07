# 12-ADR-LOG.md

# Architecture Decision Record (ADR) Log

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project       | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Architecture Decision Record (ADR)    |
| Version       | 1.0                                   |
| Status        | APPROVED & LOCKED                     |
| Last Updated  | 2026-06-05                            |

---

# Purpose

Dokumen ini digunakan untuk mencatat seluruh keputusan arsitektur penting yang telah disepakati.

Tujuan:

* Menjelaskan alasan teknis suatu keputusan.
* Menjadi referensi saat onboarding developer baru.
* Menghindari perubahan arsitektur tanpa dokumentasi.
* Menjadi sumber kebenaran (Source of Truth) untuk keputusan engineering.

---

# ADR Status Definition

| Status     | Keterangan              |
| ---------- | ----------------------- |
| Proposed   | Sedang dipertimbangkan  |
| Accepted   | Disetujui dan digunakan |
| Deprecated | Tidak digunakan lagi    |
| Superseded | Digantikan ADR lain     |

---

# ADR-001

## Menggunakan Next.js App Router

### Status

Accepted

### Date

2026-06-05

### Context

Proyek membutuhkan:

* SSR
* RSC
* Server Actions
* SEO
* Dashboard Admin
* Public Website

### Decision

Menggunakan:

```text
Next.js App Router
```

### Consequences

Positif:

* Server Components
* Streaming
* Layout nesting
* Server Actions native

Negatif:

* Kurva belajar lebih tinggi dibanding Pages Router

---

# ADR-002

## Menggunakan Prisma ORM

### Status

Accepted

### Date

2026-06-05

### Context

Diperlukan ORM yang:

* Type-safe
* Modern
* Mendukung PostgreSQL
* Mudah digunakan oleh tim mahasiswa

### Decision

Menggunakan:

```text
Prisma ORM
```

### Consequences

Positif:

* Type safety
* Migration system
* Prisma Studio

Negatif:

* Partial Index PostgreSQL belum native

---

# ADR-003

## Database PostgreSQL

### Status

Accepted

### Date

2026-06-05

### Context

Sistem membutuhkan:

* Relational Database
* ACID Transaction
* High Reliability

### Decision

Menggunakan:

```text
PostgreSQL
```

### Consequences

Positif:

* Stabil
* Open Source
* Sangat cocok untuk ERP

---

# ADR-004

## Soft Delete Strategy

### Status

Accepted

### Date

2026-06-05

### Context

Data organisasi tidak boleh hilang permanen.

### Decision

Menggunakan:

```text
deleted_at
```

pada seluruh tabel utama.

### Consequences

Positif:

* Audit trail terjaga
* Data dapat direstore

Negatif:

* Query harus selalu filter:

```ts
deletedAt: null
```

---

# ADR-005

## Base Repository Pattern

### Status

Accepted

### Date

2026-06-05

### Context

Filter soft delete berulang di seluruh modul.

### Decision

Membuat:

```text
core/database/base-repository.ts
```

### Responsibilities

* findActive()
* softDelete()
* restore()
* pagination helper

### Consequences

Positif:

* DRY
* Konsisten

---

# ADR-006

## CQRS-lite Architecture

### Status

Accepted

### Date

2026-06-05

### Context

Repository menjadi terlalu besar jika read dan write digabung.

### Decision

Pisahkan:

```text
queries.ts
```

untuk READ.

dan

```text
repositories.ts
```

untuk WRITE.

### Consequences

Positif:

* Lebih maintainable
* Mudah di-scale

---

# ADR-007

## Service Layer Mandatory

### Status

Accepted

### Date

2026-06-05

### Context

Business logic tidak boleh tersebar.

### Decision

Seluruh proses bisnis wajib melalui:

```text
services.ts
```

### Forbidden

Tidak boleh:

```text
page.tsx -> Prisma
```

atau

```text
actions.ts -> Prisma
```

secara langsung.

### Consequences

Positif:

* Separation of concerns
* Testable

---

# ADR-008

## Event Driven Architecture

### Status

Accepted

### Date

2026-06-05

### Context

Notifikasi, audit log, dan WhatsApp tidak boleh tightly coupled.

### Decision

Menggunakan:

```text
Event Bus (Pub-Sub)
```

### Example

```ts
emit("finance.completed", payload)
```

### Handler

* Notification
* Audit Log
* WhatsApp

### Consequences

Positif:

* Decoupled
* Mudah menambah integrasi baru

---

# ADR-009

## Centralized Authorization

### Status

Accepted

### Date

2026-06-05

### Context

Role checking tersebar berisiko.

### Decision

Semua otorisasi melalui:

```ts
can(permission, user)
```

### Forbidden

```ts
if (user.role === "Bendum")
```

### Consequences

Positif:

* Mudah maintain
* Konsisten

---

# ADR-010

## Super Admin Override Rule

### Status

Accepted

### Date

2026-06-05

### Context

Super Admin harus otomatis memiliki seluruh izin.

### Decision

Implementasi bypass:

```ts
if (user.role === "Super Admin") {
  return true
}
```

### Consequences

Positif:

* Tidak perlu mapping manual setiap permission baru

---

# ADR-011

## Auth.js JWT Strategy

### Status

Accepted

### Date

2026-06-05

### Context

Sistem membutuhkan autentikasi modern.

### Decision

Menggunakan:

```text
Auth.js v5
JWT Strategy
```

### JWT Payload

```ts
{
  id,
  roleId,
  departmentId
}
```

### Consequences

Positif:

* Stateless
* Mudah deployment

---

# ADR-012

## Ownership Based Authorization

### Status

Accepted

### Date

2026-06-05

### Context

Permission saja tidak cukup.

### Decision

Implementasi Policy Layer.

### Example

```ts
post.author.departmentId === session.user.departmentId
```

### Modules

* Post
* Event
* Program
* Finance
* LPJ

### Consequences

Positif:

* Keamanan lebih baik

---

# ADR-013

## Cloudinary sebagai File Storage

### Status

Accepted

### Date

2026-06-05

### Context

Server tidak digunakan untuk penyimpanan file.

### Decision

Menggunakan:

```text
Cloudinary
```

### Future

Dapat diganti:

```text
AWS S3
MinIO
```

tanpa mengubah modul bisnis.

---

# ADR-014

## Audit Log Mandatory

### Status

Accepted

### Date

2026-06-05

### Context

Seluruh mutasi harus dapat ditelusuri.

### Decision

Mutasi penting wajib menghasilkan:

```text
AuditLog
```

### Actions

* CREATE
* UPDATE
* DELETE
* APPROVE
* REJECT
* LOGIN
* LOGOUT
* VERIFY
* PUBLISH

---

# ADR-015

## Redis Cache Layer

### Status

Accepted

### Date

2026-06-05

### Context

Meningkatkan performa sistem.

### Decision

Menggunakan Redis untuk:

* Permission Cache
* Notification Counter
* Rate Limiting

### Consequences

Positif:

* Mengurangi query database

---

# ADR-016

## Rate Limiting Public Forms

### Status

Accepted

### Date

2026-06-05

### Context

Form publik rentan spam.

### Decision

Semua endpoint publik:

* Registrasi
* Aduan

wajib menggunakan:

```text
Rate Limiter
```

berbasis Redis.

---

# ADR-017

## Docker First Deployment

### Status

Accepted

### Date

2026-06-05

### Context

Lingkungan deployment harus konsisten.

### Decision

Deployment resmi menggunakan:

```text
Docker
Docker Compose
```

### Consequences

Positif:

* Reproducible
* Konsisten antara staging dan production

---

# ADR-018

## Testing Strategy

### Status

Accepted

### Date

2026-06-05

### Context

RBAC dan workflow approval adalah area kritis.

### Decision

Testing wajib mencakup:

### Unit Test

* RBAC
* Policies
* Services

### Integration Test

* Finance Approval
* Registration Approval
* Publish Post

---

# ADR-019

## Environment Validation

### Status

Accepted

### Date

2026-06-05

### Context

Kesalahan konfigurasi environment sering menyebabkan downtime.

### Decision

Implementasi:

```text
core/config/env.ts
```

menggunakan Zod.

### Rule

Application wajib gagal startup jika ENV tidak valid.

---

# ADR-020

## Modular Monolith Architecture

### Status

Accepted

### Date

2026-06-05

### Context

Skala organisasi belum memerlukan microservices.

### Decision

Menggunakan:

```text
Enterprise Ready Modular Monolith
```

### Future Migration Path

Jika sistem berkembang besar:

```text
Notification Service
Finance Service
Complaint Service
```

dapat dipisahkan menjadi microservice.

### Consequences

Positif:

* Simpel
* Biaya rendah
* Mudah dikelola

---

# ADR Governance

## Rule

Setiap perubahan besar arsitektur wajib:

1. Membuat ADR baru.
2. Mendapat persetujuan Komdigi.
3. Direview sebelum implementasi.

---

# Source of Truth

Dokumen ini merupakan arsip keputusan arsitektur resmi Sistem Informasi Terpadu IKMI Cirebon.

Jika implementasi berbeda dengan keputusan yang tercatat pada ADR Accepted, maka implementasi dianggap tidak sesuai standar sampai ADR baru dibuat dan disetujui.
