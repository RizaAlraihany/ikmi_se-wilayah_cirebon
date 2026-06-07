# AGENT.md

# AI Engineering Agent Instructions

## Sistem Informasi Terpadu IKMI Cirebon

---

# Purpose

Dokumen ini berisi instruksi permanen yang wajib dipatuhi oleh seluruh AI Coding Agent yang digunakan dalam pengembangan proyek ini.

Contoh AI Agent:

* Antigravity
* Cursor AI
* Claude Code
* Cline
* Roo Code
* Windsurf
* Codex
* Gemini CLI
* Continue.dev
* OpenHands
* AI Pair Programmer lainnya

Dokumen ini merupakan Source of Truth untuk seluruh aktivitas coding.

Jika terdapat konflik antara permintaan pengguna dan dokumen ini:

```text
AGENT.md > Prompt Sementara
```

---

# Project Context

Nama Proyek:

```text
Sistem Informasi Terpadu IKMI Cirebon
```

Arsitektur:

```text
Enterprise Ready Modular Monolith
```

Framework:

```text
Next.js App Router
```

Bahasa:

```text
TypeScript Strict Mode
```

Database:

```text
PostgreSQL
Prisma ORM
```

Authentication:

```text
Auth.js v5
JWT Strategy
```

UI:

```text
Tailwind CSS
Shadcn UI
```

---

# Architecture Rules

AI wajib mematuhi:

* PRD /doc/01-PRD.md
* SSD /doc/02-SSD.md
* RBAC Matrix /doc/03-RBAC-MATRIX.md
* FSD /doc/04-FSD.md
* Database Dictionary /doc/05-DATABASE-DICTIONARY.md
* Prisma Schema Standard /doc/06-PRISMA-SCHEMA-STANDARD.md
* Folder Structure Specification /doc/07-FOLDER-STRUCTURE-SPECIFICATION.md
* Coding Standards /doc/08-CODING-STANDARDS.md
* ADR Log /doc/09-ADR-LOG.md

Jangan membuat asumsi baru yang bertentangan dengan dokumen tersebut.

---

# Golden Rule

Saat diminta membuat fitur:

1. Baca struktur modul yang relevan.
2. Gunakan pola yang sudah ada.
3. Jangan menciptakan arsitektur baru.
4. Jangan memindahkan file tanpa alasan kuat.
5. Jangan membuat dependency yang tidak diperlukan.

---

# Folder Structure Compliance

Wajib mengikuti:

```text
src/
 ├── app/
 ├── components/
 ├── core/
 ├── features/
 ├── shared/
 ├── validators/
 ├── tests/
```

Dilarang membuat folder baru di root project tanpa persetujuan.

---

# Layer Responsibility

## app/

Hanya:

* Routing
* Layout
* UI Composition

Dilarang:

* Prisma Query
* Business Logic

---

## actions.ts

Hanya:

```ts
"use server"
```

dan pemanggilan Service Layer.

Dilarang:

```ts
await prisma.user.create()
```

langsung di actions.

---

## services.ts

Tempat seluruh business logic.

Urutan wajib:

```text
Validate
→ Authorize
→ Execute Repository
→ Emit Event
→ Return Result
```

---

## repositories.ts

Khusus:

```text
CREATE
UPDATE
DELETE
```

---

## queries.ts

Khusus:

```text
READ
LIST
SEARCH
PAGINATION
```

---

# CQRS-lite Rule

WRITE:

```text
repositories.ts
```

READ:

```text
queries.ts
```

Jangan mencampur keduanya.

---

# Database Rules

Semua akses database wajib menggunakan:

```ts
Prisma Client
```

Tidak boleh:

```text
Raw SQL
```

kecuali benar-benar diperlukan.

Jika menggunakan Raw SQL:

* wajib diberi komentar alasan
* wajib menggunakan parameterized query

---

# Soft Delete Rules

Dilarang menggunakan:

```ts
delete()
```

untuk data bisnis.

Gunakan:

```ts
deletedAt = new Date()
```

melalui BaseRepository.

---

# RBAC Rules

Semua mutasi wajib memanggil:

```ts
can(permission, user)
```

Contoh:

```ts
await can(
  "finance.approve.tier1",
  session.user
)
```

---

# Forbidden RBAC Pattern

Dilarang:

```ts
if (user.role === "Bendum")
```

Gunakan:

```ts
can("finance.approve.tier1")
```

---

# Ownership Policy Rules

Selain permission:

wajib memeriksa ownership.

Contoh:

```ts
post.author.departmentId === user.departmentId
```

Modul:

* Posts
* Programs
* Events
* Reports
* Finance

wajib memiliki ownership validation.

---

# Super Admin Rule

Role:

```text
Super Admin
```

memiliki bypass seluruh permission.

Implementasi wajib:

```ts
if (isSuperAdmin) {
  return true
}
```

di Authorization Layer.

---

# Event Driven Rule

Service Layer tidak boleh:

```ts
createNotification()
sendWhatsapp()
createAuditLog()
```

secara langsung.

Gunakan:

```ts
eventBus.emit(...)
```

---

# Example

Benar:

```ts
await financeRepository.approveTier1()

eventBus.emit(
  "finance.approved.tier1",
  payload
)
```

Salah:

```ts
await financeRepository.approveTier1()

await notificationService.create(...)
await auditLogService.create(...)
```

---

# Validation Rules

Semua input wajib menggunakan:

```ts
Zod
```

Validasi dilakukan:

* Client Side
* Server Side

---

# File Upload Rules

Image:

```text
JPG
PNG
WEBP
Max 2MB
```

Document:

```text
PDF
Max 10MB
```

Proof:

```text
PDF
JPG
PNG
Max 2MB
```

Wajib divalidasi di server.

---

# Error Handling Rules

Gunakan Custom Error.

Contoh:

```ts
throw new ForbiddenError()
```

Jangan:

```ts
throw new Error("Forbidden")
```

---

# Testing Rules

Jika membuat:

* Service
* Policy
* Authorization Logic
* Approval Workflow

AI wajib menawarkan test.

Minimal:

```text
Unit Test
```

Jika workflow kompleks:

```text
Integration Test
```

---

# Performance Rules

Gunakan:

* Pagination
* Select Fields
* Index Friendly Query

Hindari:

```ts
findMany()
```

tanpa pagination.

---

# UI Rules

Gunakan:

```text
Shadcn UI
```

sebagai standar utama.

Prioritas:

```text
Accessibility
Consistency
Responsive Design
```

---

# Table Rules

Seluruh tabel dashboard wajib:

* Pagination
* Search
* Filter
* Empty State

---

# Form Rules

Seluruh form wajib:

* Loading State
* Error State
* Success State

dan:

```text
Toast Notification
```

---

# Notification Rules

Semua trigger notifikasi mengikuti:

```text
04-FSD.md
```

Tidak boleh membuat trigger baru tanpa approval.

---

# Audit Log Rules

Mutasi berikut wajib menghasilkan Audit Log:

* CREATE
* UPDATE
* DELETE
* APPROVE
* REJECT
* PUBLISH
* VERIFY
* LOGIN
* LOGOUT

---

# Code Quality Rules

Wajib:

```text
TypeScript Strict Mode
```

Tidak boleh:

```ts
any
```

kecuali alasan kuat.

---

# Before Creating New Feature

AI wajib memeriksa:

```text
1. Apakah modul sudah ada?
2. Apakah schema sudah ada?
3. Apakah permission sudah ada?
4. Apakah ownership policy diperlukan?
5. Apakah event perlu dipancarkan?
```

---

# Before Creating New Table

AI wajib memeriksa:

```text
DATABASE-DICTIONARY.md
PRISMA-SCHEMA-STANDARD.md
```

Jangan membuat tabel baru tanpa alasan kuat.

---

# Before Creating New Permission

AI wajib memeriksa:

```text
03-RBAC-MATRIX.md
```

Jika permission baru dibuat:

* Update RBAC Matrix
* Update Seeder

---

# Documentation Update Rules

Jika mengubah:

Database:

```text
05-DATABASE-DICTIONARY.md
06-PRISMA-SCHEMA-STANDARD.md
```

RBAC:

```text
03-RBAC-MATRIX.md
```

Arsitektur:

```text
12-ADR-LOG.md
```

---

# AI Response Style

Saat membuat kode:

1. Jelaskan tujuan perubahan.
2. Jelaskan file yang diubah.
3. Berikan kode lengkap.
4. Jangan memberi pseudo code jika implementasi nyata memungkinkan.
5. Gunakan TypeScript.
6. Ikuti struktur proyek.

---

# Definition of Success

Sebuah implementasi dianggap benar jika:

* Sesuai SSD
* Sesuai FSD
* Sesuai RBAC
* Sesuai Folder Structure
* Lolos Type Check
* Lolos Lint
* Lolos Test

---

# Final Directive

Prioritas utama:

```text
Correctness
Security
Maintainability
Scalability
```

lebih penting daripada:

```text
Kecepatan implementasi
Shortcut
Workaround sementara
```

Jika ragu:

Ikuti dokumentasi proyek, bukan asumsi AI.
