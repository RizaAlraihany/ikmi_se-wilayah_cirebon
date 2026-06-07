# 06-PRISMA-SCHEMA-STANDARD.md

# Prisma Schema & Database Engineering Standard

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project Name  | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Prisma Schema Standard                |
| Version       | 1.0                                   |
| Status        | APPROVED & LOCKED                     |
| Database      | PostgreSQL                            |
| ORM           | Prisma ORM                            |
| Last Updated  | 2026-06-05                            |

---

# Purpose

Dokumen ini menjadi standar resmi implementasi Prisma ORM untuk seluruh developer.

Tujuan utama:

* Konsistensi schema
* Konsistensi migration
* Konsistensi repository
* Mencegah technical debt
* Mencegah query anti-pattern
* Menjamin keamanan data
* Menjamin scalability sistem

---

# Table of Contents

1. Global Rules
2. Schema Naming Convention
3. Model Standard
4. Enum Standard
5. Relation Standard
6. Audit Field Standard
7. Soft Delete Standard
8. Index Standard
9. Migration Standard
10. Seeder Standard
11. Repository Rules
12. Query Rules
13. Transaction Rules
14. Performance Rules
15. Security Rules
16. Anti Pattern Rules
17. Engineering Checklist

---

# 1. Global Rules

Seluruh database access wajib menggunakan:

```text
Prisma ORM
```

Dilarang:

```text
Raw SQL
```

Kecuali:

* Full Text Search
* Query Performance Critical
* Database Maintenance

Dan wajib menggunakan:

```ts
prisma.$queryRaw
```

atau

```ts
prisma.$executeRaw
```

secara aman.

---

# 2. Schema Naming Convention

## Database

Gunakan:

```text
snake_case
```

Contoh:

```text
created_at
updated_at
department_id
password_hash
```

---

## Prisma Model

Gunakan:

```text
PascalCase
```

Contoh:

```prisma
model User
model FinanceRequest
model AuditLog
```

---

## Prisma Field

Gunakan:

```text
camelCase
```

Contoh:

```prisma
createdAt
updatedAt
departmentId
passwordHash
```

---

## Mapping Database

Gunakan:

```prisma
@map()
```

Contoh:

```prisma
passwordHash String @map("password_hash")
```

---

# 3. Model Standard

Seluruh tabel utama wajib:

```prisma
id String @id @default(cuid())
```

---

## Example

```prisma
model User {
  id String @id @default(cuid())
}
```

---

## Dilarang

```prisma
Int @id @default(autoincrement())
```

karena:

* Sulit untuk distributed systems
* Tidak aman untuk public URLs
* Tidak sesuai standar proyek

---

# 4. Enum Standard

Seluruh status wajib menggunakan:

```prisma
enum
```

---

## Benar

```prisma
enum FinanceStatus {
  PENDING
  APPROVED_TIER1
  COMPLETED
  REJECTED
}
```

---

## Salah

```prisma
status String
```

---

# 5. Relation Standard

## One To Many

Contoh:

```prisma
model Department {
  users User[]
}

model User {
  departmentId String
  department Department
}
```

---

## Many To Many

Gunakan explicit pivot table.

Contoh:

```prisma
RolePermission
```

---

## Dilarang

Implicit many-to-many Prisma.

Karena:

* Sulit di-maintain
* Sulit ditambah metadata
* Sulit diaudit

---

# 6. Audit Field Standard

Seluruh tabel master dan transaksional wajib memiliki:

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
deletedAt DateTime?
```

---

## Optional

Jika perlu audit user:

```prisma
createdBy String?
updatedBy String?
```

---

# 7. Soft Delete Standard

## Global Rule

Data tidak boleh dihapus permanen.

Gunakan:

```ts
await prisma.user.update({
  where: { id },
  data: {
    deletedAt: new Date()
  }
})
```

---

## Query Standard

Semua query wajib:

```ts
where: {
  deletedAt: null
}
```

---

## Base Repository

Gunakan helper:

```ts
findActive()
```

---

## User Email Strategy

Saat soft delete:

Dari:

```text
user@gmail.com
```

Menjadi:

```text
user@gmail.com_deleted_1749123123
```

Tujuan:

* Menghindari konflik unique email
* Tetap menjaga histori

---

# 8. Index Standard

## Wajib Diindeks

### Foreign Key

```prisma
@@index([departmentId])
```

---

### Status

```prisma
@@index([status])
```

---

### Search Field

```prisma
@@index([publishedAt])
```

---

### Unique

```prisma
@unique
```

---

## Contoh

```prisma
@@index([status])
@@index([departmentId])
@@index([startDate])
```

---

# 9. Migration Standard

## Development

Gunakan:

```bash
npx prisma migrate dev
```

---

## Production

Gunakan:

```bash
npx prisma migrate deploy
```

---

## Dilarang

```bash
prisma db push
```

langsung ke production.

---

# 10. Seeder Standard

File:

```text
prisma/seed.ts
```

---

## Seeder Wajib

### Departments

```text
Komdigi
Kaderisasi
Advokasi
PSDA
Ekraf
Hubmas
```

---

### Roles

Semua role RBAC.

---

### Permissions

Semua permission dictionary.

---

### Role Permissions

Mapping RBAC.

---

### Super Admin

Bootstrap account.

---

## Seeder Rule

Seeder wajib:

```text
Idempotent
```

Artinya aman dijalankan berkali-kali.

---

# 11. Repository Rules

## Write Operations

Disimpan di:

```text
repositories.ts
```

---

Contoh:

```ts
createUser()
updateUser()
softDeleteUser()
```

---

## Read Operations

Disimpan di:

```text
queries.ts
```

---

Contoh:

```ts
getUsers()
getUserById()
getFinanceRequests()
```

---

# 12. Query Rules

## Select Minimal Data

Gunakan:

```ts
select
```

---

Contoh:

```ts
select: {
  id: true,
  name: true
}
```

---

## Hindari

```ts
include: {
  everything: true
}
```

---

## Pagination

Wajib:

```ts
skip
take
```

---

Contoh:

```ts
skip: 0,
take: 10
```

---

# 13. Transaction Rules

Gunakan:

```ts
prisma.$transaction()
```

untuk operasi multi langkah.

---

## Contoh

Finance Approval:

```text
Update Request
Create Audit Log
Create Notification
```

Harus menjadi:

```ts
prisma.$transaction(...)
```

---

# 14. Performance Rules

## Hindari N+1 Query

Salah:

```ts
for (...) {
  prisma.user.findUnique(...)
}
```

---

Gunakan:

```ts
include
```

atau

```ts
in
```

query.

---

## Dashboard

Wajib:

```text
Pagination
Filtering
Sorting
```

---

## Notification

Gunakan cache.

Contoh:

```text
Redis
```

---

# 15. Security Rules

## Password

Wajib:

```text
bcrypt
```

---

## Tidak Boleh

```text
plaintext
md5
sha1
```

---

## Session

Tidak boleh menyimpan:

```text
password
passwordHash
```

di JWT.

---

## Query Access

Seluruh mutasi wajib:

```ts
can(permission, user)
```

sebelum query dijalankan.

---

# 16. Anti Pattern Rules

## Dilarang Query Prisma di UI

Salah:

```tsx
app/users/page.tsx
```

```ts
await prisma.user.findMany()
```

---

## Benar

```tsx
page.tsx
```

↓

```ts
queries.ts
```

↓

```ts
Prisma
```

---

## Dilarang Hardcoded Role

Salah:

```ts
if (role === "Bendum")
```

---

Benar:

```ts
await can(
  "finance.approve.tier1",
  user
)
```

---

## Dilarang Direct Delete

Salah:

```ts
delete()
```

---

Benar:

```ts
softDelete()
```

---

# 17. Engineering Checklist

## Schema

* [ ] Semua model menggunakan cuid()
* [ ] Semua enum menggunakan Prisma Enum
* [ ] Semua relasi memiliki FK yang jelas
* [ ] Semua field penting memiliki index

---

## Migration

* [ ] Migration berhasil dijalankan
* [ ] Migration rollback berhasil diuji
* [ ] Production migration tervalidasi

---

## Seeder

* [ ] Permissions berhasil di-seed
* [ ] Roles berhasil di-seed
* [ ] Departments berhasil di-seed
* [ ] Super Admin berhasil dibuat

---

## Repository

* [ ] Query terpisah dari mutation
* [ ] Soft delete berjalan
* [ ] Pagination berjalan

---

## Security

* [ ] Password menggunakan bcrypt
* [ ] Semua mutation memiliki authorization
* [ ] Semua upload tervalidasi

---

# Source of Truth

Dokumen ini menjadi referensi resmi untuk:

* schema.prisma
* migration
* seed.ts
* repository layer
* query layer
* authorization layer
* audit logging layer

Jika implementasi Prisma berbeda dengan dokumen ini maka implementasi harus mengikuti Prisma Schema Standard.
