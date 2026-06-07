# 08-CODING-STANDARDS.md

# Engineering Coding Standards

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project       | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Coding Standards                      |
| Version       | 1.0                                   |
| Status        | APPROVED & LOCKED                     |
| Architecture  | Enterprise Modular Monolith           |
| Language      | TypeScript                            |
| Last Updated  | 2026-06-05                            |

---

# Purpose

Dokumen ini mendefinisikan standar implementasi source code untuk seluruh developer.

Tujuan:

* Konsistensi codebase
* Mengurangi technical debt
* Mempermudah code review
* Memastikan maintainability jangka panjang
* Menjamin kualitas implementasi sesuai arsitektur

---

# General Principles

Seluruh kode wajib mengikuti prinsip:

* SOLID
* DRY (Don't Repeat Yourself)
* KISS (Keep It Simple)
* Separation of Concerns
* Fail Fast
* Secure by Default

---

# TypeScript Standards

## Wajib

```ts
interface CreateUserDTO {
  name: string
  email: string
}
```

---

## Dilarang

```ts
const user: any = {}
```

---

## Rules

* Hindari penggunaan any
* Gunakan interface atau type
* Aktifkan strict mode
* Semua fungsi wajib memiliki return type jika kompleks

---

## Good

```ts
export async function createUser(
  dto: CreateUserDTO
): Promise<User> {
}
```

---

## Bad

```ts
export async function createUser(dto) {
}
```

---

# Naming Convention

## File Names

Gunakan:

```text
kebab-case
```

Contoh:

```text
create-user.ts
user-table.tsx
base-repository.ts
```

---

## Component Names

Gunakan:

```tsx
PascalCase
```

Contoh:

```tsx
UserTable
CreateUserForm
FinanceStatusBadge
```

---

## Variables

Gunakan:

```ts
camelCase
```

Contoh:

```ts
currentUser
financeRequest
departmentId
```

---

## Constants

Gunakan:

```ts
UPPER_SNAKE_CASE
```

Contoh:

```ts
MAX_FILE_SIZE
DEFAULT_PAGE_SIZE
```

---

## Enums

Gunakan:

```ts
PascalCase
```

Contoh:

```ts
FinanceStatus
PostStatus
```

---

# Import Standards

## Order

```ts
// external

import { z } from "zod"
import { prisma } from "@/core/database/prisma"

// internal

import { createUser } from "../services"

// types

import type { User } from "@prisma/client"
```

---

# Server Action Standards

Lokasi:

```text
features/*/actions.ts
```

---

## Good

```ts
"use server"

export async function createUserAction(
  formData: FormData
) {
  return userService.create(formData)
}
```

---

## Bad

```ts
"use server"

await prisma.user.create(...)
await prisma.role.findMany(...)
```

---

# Rules

Actions hanya boleh:

* menerima input
* memanggil service
* return result

Actions tidak boleh:

* query prisma
* business logic
* authorization logic

---

# Service Layer Standards

Lokasi:

```text
features/*/services.ts
```

---

## Responsibilities

Service wajib:

1. Validate input
2. Check permission
3. Call repository
4. Emit event

---

## Flow

```text
Input
 ↓
Schema Validation
 ↓
Policy Check
 ↓
Repository
 ↓
Emit Event
```

---

## Good

```ts
await policy.canManageUser()

const user =
  await repository.create(dto)

await eventBus.emit(
  "user.created",
  user
)
```

---

## Forbidden

```ts
await createNotification()
await sendWhatsapp()
await createAuditLog()
```

---

# Repository Standards

Lokasi:

```text
features/*/repositories.ts
```

---

## Responsibilities

Write Operations:

```ts
create()
update()
softDelete()
```

---

## Rules

Repository:

* hanya database access
* tidak boleh validasi bisnis
* tidak boleh otorisasi

---

## Good

```ts
return prisma.user.create({
  data
})
```

---

## Bad

```ts
if(user.role === "Super Admin")
```

---

# Query Standards

Lokasi:

```text
features/*/queries.ts
```

---

## Responsibilities

Read Operations.

---

## Examples

```ts
getUsers()
getPosts()
getNotifications()
```

---

## Rules

* Tidak boleh mutasi data
* Read only

---

# Zod Standards

Semua input wajib divalidasi menggunakan Zod.

---

## Example

```ts
export const CreateUserSchema =
  z.object({
    name: z.string().min(3),
    email: z.email()
  })
```

---

# Error Handling Standards

Lokasi:

```text
core/errors/
```

---

# Required Errors

```ts
AppError
ValidationError
UnauthorizedError
ForbiddenError
NotFoundError
ConflictError
```

---

## Example

```ts
throw new ForbiddenError(
  "Access denied"
)
```

---

## Dilarang

```ts
throw new Error("Forbidden")
```

---

# Authorization Standards

Seluruh authorization wajib menggunakan:

```ts
can(permission, user)
```

---

## Good

```ts
await can(
  "finance.approve.tier1",
  user
)
```

---

## Bad

```ts
if (
 user.role === "Bendum"
)
```

---

# Ownership Policy Standards

Ownership harus dipisahkan.

Lokasi:

```text
policies.ts
```

---

## Example

```ts
canEditPost(
 user,
 post
)
```

---

## Dilarang

```ts
if (
 post.departmentId ===
 user.departmentId
)
```

di service.

---

# Event Standards

Lokasi:

```text
core/events
```

---

# Naming

Format:

```text
entity.action
```

---

## Examples

```text
user.created
user.deleted

post.submitted
post.published

finance.requested
finance.approved.tier1

registration.approved
```

---

# Rules

Service hanya:

```ts
eventBus.emit(...)
```

---

## Handler

Handler bertanggung jawab:

* Notification
* Audit Log
* WhatsApp
* Email

---

# Audit Logging Standards

Audit wajib dicatat untuk:

## User

```text
CREATE
UPDATE
DELETE
```

---

## Blog

```text
CREATE
UPDATE
PUBLISH
```

---

## Finance

```text
REQUEST
APPROVE
REJECT
COMPLETED
```

---

## Authentication

```text
LOGIN
LOGOUT
```

---

# Notification Standards

Type wajib menggunakan enum:

```ts
NotificationType
```

---

## Examples

```text
POST
FINANCE
REGISTRATION
COMPLAINT
LPJ
SYSTEM
```

---

# Database Standards

## Soft Delete

Gunakan:

```ts
deletedAt
```

---

## Good

```ts
await softDelete(id)
```

---

## Bad

```ts
await prisma.user.delete()
```

---

## Exception

Hard delete hanya boleh:

* Seeder rollback
* Migration cleanup
* Testing

---

# File Upload Standards

## Images

Format:

```text
jpg
jpeg
png
webp
```

Max:

```text
2 MB
```

---

## Documents

Format:

```text
pdf
```

Max:

```text
10 MB
```

---

## Validation

Wajib:

* client-side
* server-side

---

# API Standards

Dashboard internal:

```text
Server Actions
```

---

External integration:

```text
Route Handlers
```

---

## Examples

```text
/api/webhooks
/api/auth
/api/cron
```

---

# Testing Standards

Framework:

```text
Vitest
Testing Library
```

---

# Required Tests

## Auth

```text
Login Success
Login Failure
```

---

## RBAC

```text
Permission Check
Ownership Check
```

---

## Finance

```text
Tier1 Approval
Tier2 Approval
```

---

## Blog

```text
Submit Draft
Publish
```

---

# Git Branch Standards

Format:

```text
feature/module-name
```

---

## Examples

```text
feature/users
feature/blog
feature/finance
```

---

# Commit Standards

Format:

```text
type(scope): message
```

---

## Examples

```text
feat(users): add create user action

fix(auth): resolve jwt issue

refactor(blog): move ownership policy

test(finance): add tier approval tests
```

---

# Allowed Commit Types

```text
feat
fix
refactor
test
docs
chore
style
perf
```

---

# Pull Request Standards

Setiap PR wajib:

* Menyertakan screenshot UI
* Menyertakan test result
* Tidak mengandung console.log
* Tidak mengandung any
* Tidak mengandung TODO tanpa tiket

---

# Code Review Checklist

## Architecture

* [ ] Mengikuti Folder Structure
* [ ] Tidak ada Prisma di UI
* [ ] Tidak ada business logic di Action

---

## Security

* [ ] Authorization dipanggil
* [ ] Ownership dipanggil
* [ ] Zod Validation ada

---

## Database

* [ ] Menggunakan Repository
* [ ] Soft Delete benar
* [ ] Audit Log tercatat

---

## Event Driven

* [ ] Event dipancarkan
* [ ] Tidak ada Notification langsung dari Service
* [ ] Tidak ada WhatsApp langsung dari Service

---

## Quality

* [ ] TypeScript Strict
* [ ] ESLint Pass
* [ ] Build Success
* [ ] Test Success

---

# Release Gate

Sebuah fitur dianggap selesai jika:

* Semua Acceptance Criteria FSD terpenuhi
* Unit Test lulus
* Integration Test lulus
* Code Review disetujui
* Tidak ada TypeScript Error
* Tidak ada ESLint Error
* Audit Log berjalan
* Authorization berjalan

---

# Source of Truth

Dokumen ini adalah standar resmi coding untuk seluruh developer Sistem Informasi Terpadu IKMI Cirebon.

Apabila terjadi konflik antara implementasi dan dokumen ini, maka dokumen ini menjadi referensi utama sampai terdapat revisi resmi melalui ADR (Architecture Decision Record).
