# 07-FOLDER-STRUCTURE.md

# Folder Structure & Architecture Standard

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project Name  | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Folder Structure Standard             |
| Version       | 1.0                                   |
| Status        | APPROVED & LOCKED                     |
| Architecture  | Enterprise-Ready Modular Monolith     |
| Framework     | Next.js App Router                    |
| Last Updated  | 2026-06-05                            |

---

# Purpose

Dokumen ini menjadi standar resmi struktur proyek dan arsitektur source code.

Tujuan:

* Konsistensi struktur proyek
* Mencegah spaghetti code
* Mencegah business logic bercampur UI
* Mempermudah onboarding developer baru
* Memastikan scalability jangka panjang

---

# Architecture Principles

Proyek menggunakan kombinasi:

* Modular Monolith
* Service Layer Pattern
* CQRS-lite
* Event Driven Architecture
* Base Repository Pattern
* RBAC Authorization Layer
* Server Actions First

---

# Root Structure

```text
ikmi-cirebon-web/

├── prisma/
├── public/
├── src/
├── .env
├── next.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

---

# 1. Prisma Layer

## Purpose

Seluruh kebutuhan database.

```text
prisma/

├── schema.prisma
├── seed.ts
└── migrations/
```

---

## Rules

### schema.prisma

Source of truth database.

---

### seed.ts

Wajib melakukan bootstrap:

* Roles
* Permissions
* Departments
* Super Admin

---

### migrations

Dikelola Prisma Migrate.

Dilarang mengubah migration lama yang sudah pernah production release.

---

# 2. Public Assets

```text
public/

├── images/
├── icons/
├── logos/
└── favicon.ico
```

---

## Rules

Tidak boleh menyimpan:

* Business Logic
* JSON Configuration
* Secret File

---

# 3. Source Directory

```text
src/
```

Seluruh source code aplikasi berada di dalam folder ini.

---

# 4. App Layer (Presentation Layer)

```text
src/app/
```

---

## Purpose

Routing.

Rendering UI.

Menangkap:

* params
* searchParams

---

## Structure

```text
app/

├── (public)/
├── (admin)/
├── api/
└── globals.css
```

---

# Public Area

```text
(public)

├── page.tsx
├── blog/
├── event/
├── register/
└── complaint/
```

---

# Admin Area

```text
(admin)

├── dashboard/
├── users/
├── posts/
├── finance/
├── registrations/
├── complaints/
├── letters/
├── events/
├── reports/
└── system/
```

---

# API Routes

Digunakan hanya untuk:

* Auth.js
* Webhooks
* Third Party Integration

---

## Dilarang

CRUD dashboard melalui API Route.

Gunakan:

```text
Server Actions
```

---

# App Layer Rules

## Dilarang

```tsx
await prisma.user.findMany()
```

di dalam:

```text
page.tsx
layout.tsx
```

---

## Wajib

```text
page.tsx
 ↓
queries.ts
 ↓
Prisma
```

---

# 5. Components Layer

```text
src/components/
```

---

## Purpose

Shared UI Components.

---

## Structure

```text
components/

├── ui/
├── layout/
└── custom/
```

---

# ui/

Komponen Shadcn UI.

Contoh:

```text
button
input
table
dialog
dropdown-menu
```

---

# layout/

Komponen layout global.

Contoh:

```text
sidebar
navbar
footer
breadcrumbs
```

---

# custom/

Komponen reusable khusus proyek.

Contoh:

```text
JsonDiffViewer
NotificationBell
RichTextEditor
FileUploader
```

---

# Components Rules

Komponen tidak boleh:

* Mengakses Prisma
* Mengandung business logic kompleks

---

# 6. Core Infrastructure Layer

```text
src/core/
```

---

## Purpose

Fitur lintas modul.

---

## Structure

```text
core/

├── config/
├── database/
├── cache/
├── events/
├── audit-log/
├── notifications/
├── authorization/
└── storage/
```

---

# Config

```text
core/config/

├── env.ts
└── app-config.ts
```

---

## env.ts

Validasi seluruh ENV menggunakan Zod.

Aplikasi wajib gagal boot jika ENV tidak valid.

---

# Database

```text
core/database/

├── prisma.ts
└── base-repository.ts
```

---

## prisma.ts

Prisma Singleton.

---

## base-repository.ts

Helper global:

```text
findActive()
softDelete()
withTransaction()
```

---

# Cache

```text
core/cache/

├── redis.ts
├── cache-keys.ts
└── rate-limit.ts
```

---

## Purpose

* Redis
* Permission Cache
* Notification Counter
* Rate Limit

---

# Events

```text
core/events/

├── event-bus.ts
├── event-types.ts
└── handlers/
```

---

# Event Bus

Publisher Subscriber Architecture.

---

## Example

```ts
emit(
  "finance.approved.tier1",
  payload
)
```

---

# Event Handlers

Menjalankan:

* Notification
* Audit Log
* WhatsApp Reminder

---

# Authorization

```text
core/authorization/
```

---

## Purpose

Implementasi:

```ts
can(permission, user)
```

---

## Rules

Dilarang:

```ts
if (role === "Bendum")
```

Gunakan:

```ts
can(
 "finance.approve.tier1",
 user
)
```

---

# Storage

```text
core/storage/
```

---

## Purpose

Cloudinary / S3 Integration.

---

# 7. Features Layer

```text
src/features/
```

---

## Purpose

Domain Business Logic.

---

## Structure

```text
features/

├── _templates/
├── auth/
├── users/
├── blog/
├── finance/
├── registrations/
├── complaints/
├── letters/
├── events/
├── reports/
└── web-config/
```

---

# Module Template

```text
_templates/

├── actions.ts
├── services.ts
├── repositories.ts
├── queries.ts
├── policies.ts
└── schemas.ts
```

---

## Rules

Modul baru wajib menyalin template ini.

---

# actions.ts

Entry point Server Actions.

---

## Allowed

```ts
"use server"

return service()
```

---

## Forbidden

Business Logic kompleks.

---

# services.ts

Pusat logika bisnis.

---

## Flow

```text
Validate
 ↓
Policy Check
 ↓
Repository
 ↓
Emit Event
```

---

## Dilarang

Memanggil:

* Notification Service
* WhatsApp Service
* Audit Log Service

secara langsung.

Gunakan Event Bus.

---

# repositories.ts

Write Operations.

---

## Examples

```text
createUser
updateUser
deleteUser
```

---

# queries.ts

Read Operations.

---

## Examples

```text
getUsers
getPosts
getEvents
```

---

# policies.ts

Ownership validation.

Contoh:

```ts
post.author.departmentId
===
user.departmentId
```

---

# schemas.ts

Zod Schema.

Digunakan oleh:

* React Hook Form
* Server Actions

---

# 8. Jobs Layer

```text
src/jobs/
```

---

## Structure

```text
jobs/

├── handlers/
├── scheduler.ts
└── registry.ts
```

---

# Handlers

Contoh:

```text
wa-reminder.ts
daily-backup.ts
notification-cleanup.ts
```

---

# Scheduler

Cron configuration.

---

# Registry

Pendaftaran seluruh job.

---

# 9. Shared Layer

```text
src/shared/
```

---

## Purpose

Resource lintas modul.

---

## Structure

```text
shared/

├── constants/
├── enums/
├── dto/
├── helpers/
└── schemas/
```

---

# Examples

## constants

```text
pagination.ts
permissions.ts
```

---

## enums

```text
FinanceStatus
PostStatus
```

---

## dto

```text
CreateUserDTO
CreatePostDTO
```

---

# 10. Validators Layer

```text
src/validators/
```

---

## Purpose

Validasi khusus.

---

## Examples

```text
file.ts
image.ts
```

---

# Rules

Validasi:

* ukuran file
* mime type
* image dimension

---

# 11. Types Layer

```text
src/types/
```

---

## Purpose

Global TypeScript Declaration.

---

## Structure

```text
auth.d.ts
global.d.ts
```

---

# 12. Lib Layer

```text
src/lib/
```

---

## Purpose

Third Party Configuration.

---

## Structure

```text
auth.ts
utils.ts
```

---

# Rules

Tidak boleh berisi business logic.

---

# 13. Tests Layer

```text
src/tests/
```

---

## Structure

```text
tests/

├── auth/
├── finance/
├── rbac/
└── integrations/
```

---

## Coverage Minimum

### Auth

* Login Success
* Login Failure

### RBAC

* Permission Check
* Ownership Check

### Finance

* Tier 1 Approval
* Tier 2 Approval

---

# 14. Providers Layer

```text
src/providers/
```

---

## Purpose

Global React Provider.

---

## Examples

```text
ThemeProvider
SessionProvider
QueryClientProvider
```

---

# 15. Hooks Layer

```text
src/hooks/
```

---

## Purpose

Custom React Hooks.

---

## Examples

```text
usePagination
useDebounce
useNotifications
```

---

# 16. Middleware

```text
src/middleware.ts
```

---

## Responsibilities

### Authentication

```text
Check JWT
```

---

### Authorization

```text
Protected Routes
```

---

### Redirect

```text
Login → Dashboard
```

---

# Dependency Rules

## Allowed

```text
app
 ↓
features
 ↓
core
 ↓
database
```

---

## Forbidden

```text
core
 ↓
features
```

---

## Forbidden

```text
components
 ↓
repositories
```

---

# Architecture Flow

```text
UI (page.tsx)
      │
      ▼
Server Action
      │
      ▼
Service Layer
      │
      ▼
Policy Check
      │
      ▼
Repository
      │
      ▼
Database
      │
      ▼
Emit Event
      │
      ▼
Event Handlers
      │
      ├── Audit Log
      ├── Notification
      └── WhatsApp
```

---

# Engineering Checklist

## Architecture

* [ ] Tidak ada Prisma di UI
* [ ] Tidak ada business logic di actions.ts
* [ ] Semua mutasi melalui Service Layer
* [ ] Semua query melalui queries.ts

---

## Event Driven

* [ ] Tidak ada notification langsung dari service
* [ ] Tidak ada audit log langsung dari service
* [ ] Semua side effect melalui Event Bus

---

## Standardization

* [ ] Semua modul mengikuti template
* [ ] Semua modul memiliki schemas.ts
* [ ] Semua modul memiliki policies.ts

---

# Source of Truth

Dokumen ini menjadi referensi resmi untuk:

* Struktur folder proyek
* Layering Architecture
* CQRS-lite
* Event Driven Design
* Repository Pattern
* Service Layer Pattern

Seluruh developer wajib mengikuti struktur ini. Penyimpangan hanya diperbolehkan melalui Architecture Decision Record (ADR) yang disetujui oleh tim Komdigi.
