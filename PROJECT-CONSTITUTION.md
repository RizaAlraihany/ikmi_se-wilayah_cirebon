# PROJECT-CONSTITUTION.md

# Project Constitution

## Sistem Informasi Terpadu IKMI Cirebon

### Status: LOCKED

---

# Mission

Bangun dan pelihara Sistem Informasi Terpadu IKMI Cirebon menggunakan standar engineering enterprise dengan fokus pada:

* Security
* Maintainability
* Scalability
* Type Safety
* Documentation
* Testability

Ketika terjadi konflik antara kecepatan implementasi dan kualitas arsitektur:

```text
Quality Wins
```

---

# Tech Stack

Framework:

```text
Next.js App Router
```

Language:

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

Architecture:

```text
Enterprise Ready Modular Monolith
```

Patterns:

```text
Service Layer
CQRS-lite
Base Repository
Event Driven Architecture
RBAC
Ownership Policy
```

---

# Architecture Law

## Layer Flow

```text
UI
 ↓
Actions
 ↓
Services
 ↓
Repositories
 ↓
Database
```

---

## Forbidden

Tidak boleh:

```text
page.tsx
  ↓
Prisma
```

Tidak boleh:

```text
actions.ts
  ↓
Prisma
```

Tidak boleh:

```text
component.tsx
  ↓
Prisma
```

---

## Required Flow

```text
Validate
 ↓
Authorize
 ↓
Repository
 ↓
Emit Event
 ↓
Return Result
```

---

# Folder Law

AI wajib mengikuti struktur berikut:

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

Jangan membuat struktur baru tanpa alasan yang sangat kuat.

---

# CQRS-lite Law

READ:

```text
queries.ts
```

WRITE:

```text
repositories.ts
```

Jangan mencampur READ dan WRITE.

---

# Service Layer Law

Seluruh business logic wajib berada di:

```text
services.ts
```

Dilarang:

```ts
"use server"

await prisma.user.create(...)
```

di actions.

---

# RBAC Law

Seluruh mutasi wajib menggunakan:

```ts
await can(permission, user)
```

Contoh:

```ts
await can(
  "finance.approve.tier1",
  session.user
)
```

---

# Forbidden RBAC

Dilarang:

```ts
if (user.role === "Bendum")
```

Gunakan:

```ts
can("finance.approve.tier1")
```

---

# Super Admin Law

Role:

```text
Super Admin
```

memiliki seluruh permission.

Implementasi wajib:

```ts
if (isSuperAdmin) {
  return true
}
```

---

# Ownership Law

Permission saja tidak cukup.

Wajib memeriksa ownership.

Contoh:

```ts
post.author.departmentId
===
user.departmentId
```

Ownership wajib diterapkan pada:

* Posts
* Programs
* Events
* Reports
* Finance

---

# Event Driven Law

Service Layer tidak boleh:

```ts
createNotification()
createAuditLog()
sendWhatsapp()
```

langsung.

Gunakan:

```ts
eventBus.emit(...)
```

---

# Example

Benar:

```ts
await repository.update(...)

eventBus.emit(
  "finance.completed",
  payload
)
```

Salah:

```ts
await repository.update(...)

await createNotification(...)
await createAuditLog(...)
```

---

# Validation Law

Semua input wajib menggunakan:

```text
Zod
```

Validasi wajib dilakukan:

* Client Side
* Server Side

---

# File Upload Law

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

Validasi server wajib ada.

---

# Database Law

Database:

```text
Prisma ORM
```

Default:

```text
Soft Delete
```

Gunakan:

```ts
deletedAt = new Date()
```

---

# Forbidden Delete

Dilarang:

```ts
delete()
```

untuk data bisnis.

---

# Audit Law

Semua mutasi penting wajib menghasilkan:

```text
AuditLog
```

Action yang wajib dicatat:

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

# Notification Law

Semua notifikasi harus berasal dari:

```text
Event Handler
```

bukan dari Service Layer.

---

# Coding Law

Wajib:

```text
TypeScript Strict
```

Hindari:

```ts
any
```

---

# Security Law

Semua mutasi wajib:

```text
Authorization
Ownership
Validation
Audit Log
```

Tidak boleh ada bypass.

---

# Testing Law

Jika membuat:

* Service
* Policy
* Approval Workflow
* RBAC Logic

maka wajib membuat:

```text
Unit Test
```

Jika workflow kompleks:

```text
Integration Test
```

---

# Documentation Law

Jika mengubah:

RBAC:

```text
03-RBAC-MATRIX.md
```

Database:

```text
05-DATABASE-DICTIONARY.md
06-PRISMA-SCHEMA-STANDARD.md
```

Arsitektur:

```text
12-ADR-LOG.md
```

maka dokumentasi wajib diperbarui.

---

# Before Writing Code

AI wajib memeriksa:

```text
1. Permission apa yang digunakan?
2. Ownership policy apa yang digunakan?
3. Event apa yang dipancarkan?
4. Audit log apa yang tercatat?
5. Apakah schema sudah ada?
6. Apakah test perlu ditambahkan?
```

---

# Definition of Success

Implementasi dianggap benar jika:

✓ Sesuai SSD

✓ Sesuai FSD

✓ Sesuai RBAC

✓ Sesuai Folder Structure

✓ Sesuai ADR

✓ Type Safe

✓ Secure

✓ Tested

✓ Production Ready

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
Shortcut
Hack
Temporary Fix
Kecepatan Coding
```

Jika ragu:

```text
Ikuti dokumentasi proyek.
Jangan membuat asumsi sendiri.
```
