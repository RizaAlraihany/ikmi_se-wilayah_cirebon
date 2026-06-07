# 02-SSD.md

# System Specification Document (SSD)

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project Name  | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | System Specification Document (SSD)   |
| Version       | 1.0                                   |
| Status        | APPROVED & LOCKED                     |
| Architecture  | Enterprise-Ready Modular Monolith     |
| Last Updated  | 2026-06-05                            |

---

# Table of Contents

1. Purpose
2. Architectural Principles
3. High-Level Architecture
4. Technology Stack
5. Application Architecture
6. Security Architecture
7. Authorization Architecture
8. Event-Driven Architecture
9. Database Architecture
10. Storage Architecture
11. Notification Architecture
12. Caching Strategy
13. Background Jobs
14. Error Handling Strategy
15. Auditability Strategy
16. Deployment Architecture
17. Documentation Hierarchy

---

# 1. Purpose

Dokumen ini mendefinisikan seluruh spesifikasi teknis sistem.

Dokumen ini menjadi acuan utama seluruh developer sebelum melakukan implementasi.

Dokumen ini menjelaskan:

* Struktur sistem
* Arsitektur aplikasi
* Standar coding
* Infrastruktur pendukung
* Integrasi antar modul

---

# 2. Architectural Principles

Sistem wajib mengikuti prinsip berikut:

## Separation of Concerns

UI, Business Logic, dan Data Access wajib dipisahkan.

---

## Single Responsibility Principle

Setiap file hanya memiliki satu tanggung jawab utama.

---

## Modular Monolith

Sistem dibangun sebagai satu aplikasi namun dipisahkan menjadi modul domain yang independen.

---

## CQRS-lite

Read dan Write dipisahkan.

* queries.ts → Read
* repositories.ts → Write

---

## Event Driven Design

Service tidak boleh saling memanggil secara langsung untuk efek samping.

Komunikasi lintas modul menggunakan Event Bus.

---

## Auditability First

Setiap mutasi penting wajib dapat dilacak.

---

## Security by Default

Setiap endpoint dan mutasi harus dianggap tidak terpercaya sampai diverifikasi.

---

# 3. High-Level Architecture

```text
┌─────────────────────┐
│      Browser        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Next.js App Router  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Server Action   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Service Layer   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Authorization Layer │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Repository Layer    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Prisma ORM          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ PostgreSQL Database │
└─────────────────────┘
```

---

# 4. Technology Stack

## Frontend

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* Shadcn UI

---

## Backend

* Next.js Server Actions
* Auth.js v5
* Prisma ORM

---

## Database

* PostgreSQL

---

## Storage

* Cloudinary

atau

* Amazon S3 Compatible Storage

---

## Background Jobs

* Node Cron
* Vercel Cron
* Trigger.dev (Future)

---

## Cache

* Redis (Optional)
* In Memory Cache (Fallback)

---

# 5. Application Architecture

## Layer Hierarchy

```text
app/
   ↓
actions.ts
   ↓
services.ts
   ↓
policies.ts
   ↓
repositories.ts
   ↓
database
```

---

## Rules

### app/

Hanya boleh:

* Render UI
* Mengambil searchParams
* Mengambil route params

Dilarang:

* Query Prisma
* Business Logic

---

### actions.ts

Hanya sebagai controller.

Tugas:

* menerima form
* memanggil service

---

### services.ts

Pusat logika bisnis.

Tugas:

* validasi
* otorisasi
* transaksi
* emit event

---

### repositories.ts

Tugas:

* create
* update
* delete
* soft delete

Tidak boleh berisi business logic.

---

### queries.ts

Tugas:

* semua operasi baca

---

# 6. Security Architecture

## Authentication

Menggunakan:

* Auth.js
* JWT Strategy

---

## Password

Hash menggunakan:

```text
bcrypt
```

Minimal:

```text
10 salt rounds
```

---

## Session

JWT hanya menyimpan:

```ts
{
  userId,
  role,
  departmentId
}
```

---

## Route Protection

Menggunakan middleware.ts

---

# 7. Authorization Architecture

## Authorization Model

RBAC + Ownership Policy

---

### Layer 1

Permission Check

Contoh:

```ts
await can(
  "finance.approve.tier1",
  session.user
)
```

---

### Layer 2

Ownership Check

Contoh:

```ts
event.program.departmentId
===
session.user.departmentId
```

---

## Super Admin Override

Wajib bypass seluruh permission.

```ts
if (user.role === "SUPER_ADMIN")
{
  return true
}
```

---

# 8. Event-Driven Architecture

## Event Bus

Semua efek samping wajib melalui Event Bus.

---

## Contoh

```text
finance.approved.tier1
registration.approved
post.published
report.verified
```

---

## Service Layer

```ts
await emit(
 "finance.approved.tier1",
 payload
)
```

---

## Event Handler

Handler dapat:

* membuat audit log
* membuat notification
* mengirim WA reminder

---

# 9. Database Architecture

## ORM

Prisma ORM

---

## Database

PostgreSQL

---

## Primary Key Strategy

```ts
cuid()
```

---

## Soft Delete Strategy

Semua tabel utama memiliki:

```text
deleted_at
```

---

## Audit Fields

```text
created_at
updated_at
deleted_at
created_by
updated_by
```

---

## Index Strategy

Wajib untuk:

* foreign key
* status
* slug
* frequently filtered columns

---

# 10. Storage Architecture

## Supported Files

### Images

* JPG
* PNG
* WEBP

Max:

```text
2 MB
```

---

### PDF

Max:

```text
10 MB
```

---

## Upload Flow

```text
Client
 ↓
Cloudinary/S3
 ↓
URL
 ↓
Database
```

File binary tidak disimpan ke database.

---

# 11. Notification Architecture

## Notification Types

```text
REGISTRATION
FINANCE
POST
COMPLAINT
LPJ
SYSTEM
OTHER
```

---

## Flow

```text
Event
 ↓
Notification Handler
 ↓
Notification Table
 ↓
Navbar Badge
```

---

# 12. Caching Strategy

## Cached Resources

### Permissions

```text
permission:userId
```

---

### Notification Counter

```text
notification-count:userId
```

---

### Dashboard Statistics

```text
dashboard-summary
```

---

# 13. Background Jobs

## Daily Backup

Jalan setiap hari.

---

## WA Reminder

H-1 Agenda

---

## Content Reminder

H-1 Jadwal Konten

---

## Notification Cleanup

Membersihkan notifikasi lama.

---

# 14. Error Handling Strategy

## Base Error

```ts
AppError
```

---

## Derived Errors

```ts
ValidationError
UnauthorizedError
ForbiddenError
NotFoundError
```

---

## UI Response

Semua error harus diterjemahkan menjadi:

```text
Toast Error
```

atau

```text
Error Page
```

---

# 15. Auditability Strategy

## Audit Trigger

Wajib dicatat:

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

## Audit Data

```json
{
  "oldData": {},
  "newData": {}
}
```

---

## Audit Storage

Tabel:

```text
audit_logs
```

---

# 16. Deployment Architecture

## Environment

```text
Development
Staging
Production
```

---

## Production Requirements

* PostgreSQL
* Cloudinary/S3
* Redis (Opsional)
* Monitoring

---

## Deployment Targets

* VPS
* Docker
* Coolify
* Railway
* Vercel

---

# 17. Documentation Hierarchy

```text
01-PRD.md
      ↓
02-SSD.md
      ↓
03-RBAC-MATRIX.md
      ↓
04-FSD.md
      ↓
05-DATABASE-DICTIONARY.md
      ↓
06-PRISMA-SCHEMA.md
      ↓
07-FOLDER-STRUCTURE.md
      ↓
08-ENGINEERING-DOD.md
      ↓
IMPLEMENTATION
```

---

# Acceptance Criteria

Dokumen SSD dianggap selesai apabila:

* Seluruh keputusan arsitektur telah terdokumentasi.
* Seluruh developer memahami flow aplikasi.
* Tidak ada keputusan teknis besar yang belum memiliki spesifikasi.
* Menjadi acuan utama implementasi backend dan frontend.

---

# Source of Truth

Dokumen ini merupakan spesifikasi teknis tertinggi.

Seluruh RBAC, Database Dictionary, Prisma Schema, Folder Structure, dan Engineering Roadmap wajib mengikuti aturan yang ditetapkan pada SSD ini.
