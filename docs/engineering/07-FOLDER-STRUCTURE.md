# 07-FOLDER-STRUCTURE.md

# Folder Structure & Code Organization Standard

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item         | Value                             |
| ------------ | --------------------------------- |
| Document     | Folder Structure Standard         |
| Version      | 3.0                               |
| Status       | LOCKED                            |
| Architecture | Enterprise Ready Modular Monolith |
| Framework    | Next.js App Router                |
| Language     | TypeScript                        |

---

# Purpose

Dokumen ini mendefinisikan struktur folder resmi yang wajib digunakan pada seluruh pengembangan Sistem Informasi Terpadu IKMI Cirebon.

Tujuan:

- Konsistensi kode
- Kemudahan maintenance
- Skalabilitas jangka panjang
- Mempermudah onboarding developer
- Mempermudah AI Agent memahami project

---

# Architectural Style

Arsitektur resmi:

```text
Enterprise Ready Modular Monolith
```

---

# Core Principles

## Feature First

Struktur wajib berbasis fitur.

Benar:

```text
features/
├── auth
├── users
├── finance
├── blog
├── events
```

Salah:

```text
controllers/
models/
services/
routes/
```

---

## CQRS Lite

Read Layer:

```text
queries.ts
```

Write Layer:

```text
services.ts
```

Persistence Layer:

```text
repository.ts
```

---

## Separation of Concerns

Business Logic tidak boleh berada di:

- page.tsx
- component.tsx
- server actions

Business Logic wajib berada di:

```text
services.ts
```

---

# Root Directory Structure

```text
ikmi-cirebon-web/

├── docs/
├── prisma/
├── public/
├── src/
├── tests/
├── .env
├── package.json
└── tsconfig.json
```

---

# Docs Structure

```text
docs/

├── PROJECT-CONSTITUTION.md
├── 05-DATABASE-DICTIONARY.md
├── 06-RBAC-MATRIX.md
├── 07-FOLDER-STRUCTURE.md
├── 08-MASTER-DATA-DICTIONARY.md
├── 09-SEEDER-BLUEPRINT.md
├── 10-DASHBOARD-MODULES.md
├── 11-PUBLIC-WEBSITE.md
├── 12-OWNERSHIP-POLICY.md
├── 13-EVENT-DRIVEN.md
├── 14-ENGINEERING-DOD.md
└── 15-DESIGN.md
```

---

# Prisma Structure

```text
prisma/

├── schema.prisma
├── seed.ts
└── migrations/
```

---

# Public Assets

```text
public/

├── images/
├── icons/
├── logos/
└── uploads/
```

Catatan:

```text
/uploads hanya untuk development.

Production wajib menggunakan Cloudinary.
```

---

# Source Structure

```text
src/

├── app/
├── features/
├── core/
├── components/
├── hooks/
├── types/
└── lib/
```

---

# App Router Structure

```text
src/app/

├── (public)/
├── (auth)/
├── (dashboard)/
├── api/
├── layout.tsx
├── page.tsx
└── globals.css
```

---

# Public Domain Structure

Domain:

```text
https://ikmicirebon.or.id
```

Folder:

```text
src/app/(public)

├── about/
├── events/
├── structure/
├── blog/
├── complaints/
├── register/
└── page.tsx
```

---

# Auth Structure

Domain:

```text
dashboard.ikmicirebon.or.id
```

Folder:

```text
src/app/(auth)

├── login/
└── forgot-password/
```

---

# Dashboard Structure

```text
src/app/(dashboard)

├── dashboard/
├── users/
├── finance/
├── events/
├── reports/
├── letters/
├── complaints/
├── registrations/
├── notifications/
├── settings/
└── layout.tsx
```

---

# Feature Structure

Setiap fitur wajib mengikuti pola berikut.

```text
features/blog/

├── services.ts
├── queries.ts
├── repository.ts
├── schemas.ts
├── types.ts
├── permissions.ts
└── events.ts
```

---

# Services Layer

Lokasi:

```text
services.ts
```

Tanggung jawab:

- Business Logic
- Validation
- Ownership Validation
- RBAC Validation
- Event Emit

---

# Queries Layer

Lokasi:

```text
queries.ts
```

Tanggung jawab:

- Read Data
- Filtering
- Search
- Pagination

---

# Repository Layer

Lokasi:

```text
repository.ts
```

Tanggung jawab:

- Prisma Access
- Database Interaction

---

# Feature Example

```text
features/finance/

├── services.ts
├── queries.ts
├── repository.ts
├── schemas.ts
├── types.ts
├── permissions.ts
└── events.ts
```

---

# Core Layer

Folder:

```text
src/core/
```

Berisi infrastruktur sistem.

---

## Structure

```text
core/

├── auth/
├── cache/
├── config/
├── events/
├── errors/
├── permissions/
├── repositories/
├── storage/
├── validators/
└── notifications/
```

---

# Auth

```text
core/auth/

├── auth.ts
├── auth.config.ts
└── session.ts
```

---

# Cache

```text
core/cache/

├── cache.ts
└── redis.ts
```

Provider resmi:

```text
Upstash Redis
```

---

# Events

```text
core/events/

├── event-bus.ts
├── registry.ts
└── handlers/
```

---

# Storage

```text
core/storage/

├── cloudinary.ts
└── storage-service.ts
```

Provider resmi:

```text
Cloudinary
```

---

# Errors

```text
core/errors/

├── AppError.ts
├── ValidationError.ts
├── UnauthorizedError.ts
├── ForbiddenError.ts
└── NotFoundError.ts
```

---

# Shared Components

```text
components/

├── ui/
├── forms/
├── layouts/
├── tables/
├── cards/
└── charts/
```

---

# UI Components

Semua komponen dasar berasal dari:

```text
Shadcn UI
```

---

# Hooks

```text
hooks/

├── use-mobile.ts
├── use-debounce.ts
├── use-pagination.ts
└── use-permissions.ts
```

---

# Types

```text
types/

├── auth.ts
├── api.ts
├── events.ts
├── finance.ts
└── common.ts
```

---

# API Routes

```text
src/app/api/

├── cron/
├── webhooks/
└── uploads/
```

---

# Cron Jobs

Semua cron wajib diamankan.

Contoh:

```text
/api/cron/reminders
```

Wajib:

```text
env.CRON_SECRET
```

---

# Testing Structure

```text
tests/

├── auth/
├── finance/
├── blog/
├── registration/
├── ownership/
└── permissions/
```

---

# Naming Convention

Folder:

```text
kebab-case
```

Contoh:

```text
blog-posts
user-management
```

---

File:

```text
kebab-case
```

Contoh:

```text
event-bus.ts
storage-service.ts
```

---

Component:

```text
PascalCase
```

Contoh:

```tsx
UserCard.tsx;
DashboardLayout.tsx;
```

---

Hook:

```text
camelCase
```

Contoh:

```ts
usePermissions;
useDebounce;
```

---

# Forbidden Structure

Dilarang membuat:

```text
src/utils/
src/helpers/
src/common/
src/misc/
```

yang berisi kode campur aduk.

Semua kode wajib memiliki domain yang jelas.

---

# AI Agent Rules

AI Agent wajib:

1. Membaca PROJECT-CONSTITUTION.md
2. Membaca ALUR-FLOW.md
3. Mengikuti struktur folder ini

AI Agent dilarang:

- Membuat folder baru tanpa alasan kuat
- Menaruh business logic di UI
- Mengakses Prisma langsung dari page.tsx

---

# Source of Truth

Dokumen ini adalah referensi utama untuk:

- Folder Structure
- Naming Convention
- Code Organization
- Feature Organization
- AI Refactoring Rules

Apabila struktur aktual berbeda dengan dokumen ini, maka implementasi harus mengikuti 07-FOLDER-STRUCTURE.md.
