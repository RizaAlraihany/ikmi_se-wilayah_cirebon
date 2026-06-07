# 09-SEEDING-STANDARD.md

# Database Seeding Standard

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project       | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Seeding Standard                      |
| Version       | 1.0                                   |
| Status        | APPROVED & LOCKED                     |
| Database      | PostgreSQL                            |
| ORM           | Prisma ORM                            |

---

# Purpose

Dokumen ini mendefinisikan standar resmi untuk proses database seeding.

Tujuan:

* Menjamin konsistensi data awal sistem
* Menghindari data referensi hilang saat deployment
* Menstandarkan bootstrap environment
* Menjamin sistem dapat digunakan setelah instalasi pertama

---

# Seeding Philosophy

Database seeding digunakan untuk:

* Master Data
* RBAC Data
* Initial Configuration
* Initial Administrator Account

Database seeding **bukan** digunakan untuk:

* Dummy testing data
* Data transaksi
* Data produksi yang berubah-ubah

---

# Seeder Execution Order

Urutan eksekusi wajib:

```text
Departments
↓
Roles
↓
Permissions
↓
Role Permissions
↓
Web Configs
↓
Super Admin
```

---

# Seeder File Structure

Lokasi:

```text
prisma/
├── seed.ts
├── seeders/
│   ├── departments.seed.ts
│   ├── roles.seed.ts
│   ├── permissions.seed.ts
│   ├── role-permissions.seed.ts
│   ├── web-config.seed.ts
│   └── super-admin.seed.ts
```

---

# Department Seeder

## Required Departments

```text
Komdigi
Kaderisasi
Advokasi
PSDA
Ekraf
Hubmas
BPH
```

---

## Example

```ts
{
  name: "Komdigi",
  code: "KMD"
}
```

---

# Role Seeder

## Required Roles

```text
Super Admin

BPH Sekum
BPH Bendum

Kadep Komdigi
Staff Komdigi

Kadep Kaderisasi
Staff Kaderisasi

Kadep Advokasi
Staff Advokasi

Kadep PSDA
Staff PSDA

Kadep Ekraf
Staff Ekraf

Kadep Hubmas
Staff Hubmas

Reviewer
```

---

# Permission Seeder

Seeder wajib menggunakan RBAC Matrix sebagai source of truth.

---

## Example

```ts
{
  name: "user.manage",
  module: "User"
}
```

---

# Required Modules

```text
System
User
Audit
Notification
Finance
Letter
Member
Post
Web
Event
LPJ
Complaint
```

---

# Role Permission Seeder

Semua mapping wajib mengikuti:

```text
03-RBAC-MATRIX.md
```

---

# Rule

Dilarang:

```ts
role.permissions.push(...)
```

manual di production.

---

Semua permission assignment wajib berasal dari seeder.

---

# Web Config Seeder

## Initial Keys

```text
landing_page_hero
visi_misi
about_organization
contact_information
```

---

## Example

```ts
{
  key: "landing_page_hero",
  valueJson: {
    title: "IKMI Cirebon",
    subtitle: "Bergerak Bersama"
  }
}
```

---

# Super Admin Seeder

## Purpose

Mencegah sistem terkunci saat instalasi pertama.

---

## Required Data

```text
Name
Email
Password
Role
Department
```

---

## Example

```ts
{
  name: "Super Admin",
  email: env.SUPER_ADMIN_EMAIL
}
```

---

# Password Policy

Seeder wajib:

```ts
bcrypt.hash(
  plainPassword,
  12
)
```

---

## Dilarang

```ts
password: "admin123"
```

langsung ke database.

---

# Idempotent Seeder Rule

Seeder harus aman dijalankan berulang kali.

---

## Good

```ts
await prisma.role.upsert({
  ...
})
```

---

## Bad

```ts
await prisma.role.create(...)
```

yang menyebabkan duplicate.

---

# Environment Variables

Wajib tersedia:

```env
SUPER_ADMIN_NAME=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

---

# Transaction Rule

Seluruh proses seeding wajib dijalankan dalam transaction.

---

## Example

```ts
await prisma.$transaction([
  ...
])
```

---

# Verification Checklist

## Departments

* [ ] Seluruh department berhasil dibuat
* [ ] Tidak ada duplicate code

---

## Roles

* [ ] Seluruh role berhasil dibuat
* [ ] Tidak ada duplicate role

---

## Permissions

* [ ] Seluruh permission RBAC berhasil dibuat

---

## Role Mapping

* [ ] Semua role memiliki permission sesuai matrix

---

## Super Admin

* [ ] Role terhubung
* [ ] Password ter-hash
* [ ] Login berhasil

---

# Production Rules

Saat deployment production:

```bash
npx prisma migrate deploy
npm run seed
```

---

# Source of Truth

Dokumen ini adalah standar resmi seeding database.

Apabila terjadi konflik antara implementasi dan dokumen ini, maka dokumen ini menjadi referensi utama sampai terdapat revisi resmi melalui ADR.
