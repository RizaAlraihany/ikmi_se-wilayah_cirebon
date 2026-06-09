# 05-DATABASE-DICTIONARY.md

# Database Dictionary

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project Name  | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Database Dictionary                   |
| Version       | 3.0                                   |
| Status        | APPROVED & LOCKED                     |
| Database      | PostgreSQL                            |
| ORM           | Prisma ORM                            |
| Architecture  | Enterprise Ready Modular Monolith     |
| Last Updated  | 2026-06-08                            |

---

# Purpose

Dokumen ini merupakan sumber kebenaran utama (*Source of Truth*) untuk seluruh desain basis data Sistem Informasi Terpadu IKMI Cirebon.

Dokumen ini digunakan sebagai referensi resmi dalam pengembangan:

* Prisma Schema
* Database Migration
* Database Seeder
* Repository Layer
* Query Layer
* Service Layer
* RBAC System
* Ownership Policy
* Audit System
* Dashboard Analytics
* Public Website Integration

Seluruh implementasi database wajib mengikuti dokumen ini.

Jika terdapat perbedaan antara implementasi dan dokumen ini maka implementasi harus disesuaikan mengikuti Database Dictionary.

---

# System Domain Architecture

Sistem terdiri dari dua domain utama yang saling terhubung.

## Public Domain

```text
https://ikmicirebon.or.id
```

Fungsi:

* Landing Page Organisasi
* Informasi IKMI
* Struktur Organisasi
* Event & Program Kerja
* Blog & Ruang Gagasan
* Form Pendaftaran Anggota
* Form Aduan & Aspirasi

Public Domain tidak memiliki fitur Login.

---

## Internal Domain

```text
https://dashboard.ikmicirebon.or.id
```

Fungsi:

* Dashboard Pengurus
* CMS Website
* Kaderisasi
* Keuangan
* Persuratan
* LPJ
* Aduan & Advokasi
* Monitoring Program
* Manajemen Organisasi
* Audit Log
* Notification Center

Seluruh autentikasi sistem berada pada domain ini.

---

# Organization Structure

Struktur organisasi resmi IKMI yang digunakan oleh sistem.

```text
Ketua Umum
│
├── Wakil Ketua Umum
│
├── Sekretaris Umum I
├── Sekretaris Umum II
│
├── Bendahara Umum I
├── Bendahara Umum II
│
└── Departemen
    ├── Kaderisasi
    ├── Kajian & Advokasi Strategis
    ├── PSDA
    ├── Ekonomi Kreatif
    ├── Komdigi
    └── HPM
```

---

# Membership Lifecycle

Siklus keanggotaan yang digunakan sistem.

```text
Registration
↓
Candidate Member
↓
Active Member
↓
Management
↓
Demisioner
↓
Alumni
```

Seluruh data anggota harus dapat ditelusuri sepanjang siklus tersebut tanpa kehilangan histori.

---

# Table of Contents

1. Global Rules
2. Enum Definitions
3. Authentication & RBAC
4. Organization Structure
5. Membership Management
6. CMS & Blog
7. Program & Event Management
8. Reports (LPJ)
9. Registration
10. Complaint & Advocacy
11. Letter Management
12. Finance Management
13. Notification System
14. Audit Log System
15. Website Configuration
16. Index Strategy
17. Ownership Mapping
18. Soft Delete Strategy
19. Database Constraints
20. Future Expansion Policy

---

# 1. Global Rules

## Primary Key Standard

Seluruh tabel wajib menggunakan:

```prisma
id String @id @default(cuid())
```

---

## Audit Fields Standard

Seluruh tabel master maupun transaksional wajib memiliki:

| Column     | Type      |
| ---------- | --------- |
| created_at | DateTime  |
| updated_at | DateTime  |
| deleted_at | DateTime? |

---

## Audit Actor Fields

Jika entitas mendukung tracking pengguna maka wajib memiliki:

| Column     |
| ---------- |
| created_by |
| updated_by |

---

## Naming Convention

### Database Layer

Menggunakan:

```text
snake_case
```

Contoh:

```text
created_at
updated_at
department_id
```

---

### Application Layer

Menggunakan:

```text
camelCase
```

Contoh:

```ts
createdAt
updatedAt
departmentId
```

---

## Soft Delete Policy

Seluruh data sistem menggunakan Soft Delete.

Dilarang menggunakan:

```ts
delete()
```

Gunakan:

```ts
deletedAt = new Date()
```

untuk menjaga integritas histori organisasi.
