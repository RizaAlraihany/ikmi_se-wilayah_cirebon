# 05-DATABASE-DICTIONARY.md

# Database Dictionary

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project Name  | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Database Dictionary                   |
| Version       | 2.0                                   |
| Status        | APPROVED & LOCKED                     |
| Database      | PostgreSQL                            |
| ORM           | Prisma ORM                            |
| Last Updated  | 2026-06-05                            |

---

# Table of Contents

1. Global Rules
2. Enum Definitions
3. Auth & RBAC
4. Organization
5. CMS & Blog
6. Program & Event
7. Reports (LPJ)
8. Registration
9. Complaint
10. Letter
11. Finance
12. Notifications
13. Audit Logs
14. Web Config
15. Index Strategy
16. Ownership Mapping
17. Soft Delete Strategy

---

# 1. Global Rules

## Primary Key Standard

Seluruh tabel utama wajib menggunakan:

```prisma
id String @id @default(cuid())
```

---

## Audit Fields Standard

Seluruh tabel master dan transaksional wajib memiliki:

| Field      | Type      |
| ---------- | --------- |
| created_at | DateTime  |
| updated_at | DateTime  |
| deleted_at | DateTime? |

---

## Audit Actor Fields

Jika entitas mendukung tracking pengguna:

| Field      |
| ---------- |
| created_by |
| updated_by |

---

## Naming Convention

### Database

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

### Application

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

# 2. Enum Definitions

## PostStatus

```text
DRAFT
PENDING_REVIEW
PUBLISHED
```

---

## RegStatus

```text
PENDING
APPROVED
REJECTED
```

---

## ComplaintStatus

```text
UNREAD
PROCESSED
RESOLVED
REJECTED
```

---

## FinanceStatus

```text
PENDING
APPROVED_TIER1
COMPLETED
REJECTED
```

---

## LPJStatus

```text
SUBMITTED
VERIFIED_DEPARTMENT
VERIFIED_BPH
REJECTED
```

---

## ProgramStatus

```text
PLANNED
ONGOING
COMPLETED
```

---

## EventStatus

```text
UPCOMING
ONGOING
COMPLETED
CANCELLED
```

---

## NotificationType

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

## AuditAction

```text
CREATE
UPDATE
DELETE
APPROVE
REJECT
LOGIN
LOGOUT
PUBLISH
VERIFY
```

---

## LetterType

```text
IN
OUT
```

---

# 3. Auth & RBAC Module

## Table: users

### Description

Menyimpan akun seluruh pengurus dan administrator.

| Column        | Type     | Nullable | Notes        |
| ------------- | -------- | -------- | ------------ |
| id            | String   | No       | PK           |
| name          | String   | No       |              |
| email         | String   | No       | Unique       |
| password_hash | String   | No       | Bcrypt       |
| is_active     | Boolean  | No       | Default true |
| last_login_at | DateTime | Yes      |              |
| role_id       | String   | No       | FK           |
| department_id | String   | No       | FK           |
| created_at    | DateTime | No       |              |
| updated_at    | DateTime | No       |              |
| deleted_at    | DateTime | Yes      |              |

### Indexes

```text
email (unique)
role_id
department_id
```

---

## Table: roles

### Description

Master role RBAC.

| Column      | Type    |
| ----------- | ------- |
| id          | String  |
| name        | String  |
| description | String? |

### Example Data

```text
super_admin
bph_sekum
bph_bendum
kadep_komdigi
staff_komdigi
kadep_kaderisasi
staff_kaderisasi
kadep_advokasi
staff_advokasi
```

---

## Table: permissions

### Description

Master permission sistem.

| Column | Type   |
| ------ | ------ |
| id     | String |
| name   | String |
| module | String |

### Example

```text
user.manage
finance.approve.tier1
post.publish
audit.view
```

---

## Table: role_permissions

### Description

Pivot Role dan Permission.

| Column        |
| ------------- |
| role_id       |
| permission_id |

### Primary Key

```text
(role_id, permission_id)
```

---

# 4. Organization Module

## Table: departments

### Description

Master departemen organisasi.

| Column | Type   |
| ------ | ------ |
| id     | String |
| name   | String |
| code   | String |

### Example

```text
Komdigi
Kaderisasi
Advokasi
PSDA
Ekraf
Hubmas
```

---

# 5. CMS & Blog Module

## Table: categories

| Column      | Type   |
| ----------- | ------ |
| id          | String |
| name        | String |
| slug        | String |
| description | Text   |

### Indexes

```text
slug (unique)
```

---

## Table: posts

### Description

Artikel dan berita organisasi.

| Column        | Type       |
| ------------- | ---------- |
| id            | String     |
| title         | String     |
| slug          | String     |
| content       | Text       |
| thumbnail_url | String     |
| status        | PostStatus |
| author_id     | String     |
| category_id   | String     |
| published_at  | DateTime   |
| created_at    | DateTime   |
| updated_at    | DateTime   |
| deleted_at    | DateTime   |

### Indexes

```text
slug
status
author_id
category_id
published_at
```

---

# 6. Program & Event Module

## Table: programs

### Description

Program kerja departemen.

| Column        | Type          |
| ------------- | ------------- |
| id            | String        |
| name          | String        |
| department_id | String        |
| budget_plan   | Decimal       |
| description   | Text          |
| status        | ProgramStatus |

### Indexes

```text
department_id
status
```

---

## Table: events

### Description

Kegiatan yang berasal dari program kerja.

| Column      | Type        |
| ----------- | ----------- |
| id          | String      |
| program_id  | String      |
| title       | String      |
| description | Text        |
| location    | String      |
| start_date  | DateTime    |
| end_date    | DateTime    |
| status      | EventStatus |

### Indexes

```text
program_id
start_date
status
```

---

# 7. Reports Module (LPJ)

## Table: reports

### Description

Dokumen LPJ kegiatan.

| Column       | Type      |
| ------------ | --------- |
| id           | String    |
| event_id     | String    |
| document_url | String    |
| status       | LPJStatus |
| submitted_by | String    |
| verified_by  | String    |
| verified_at  | DateTime  |

### Constraints

```text
event_id UNIQUE
```

### Indexes

```text
status
```

---

# 8. Registration Module

## Table: registrations

### Description

Pendaftar anggota baru.

| Column     | Type      |
| ---------- | --------- |
| id         | String    |
| full_name  | String    |
| campus     | String    |
| semester   | String    |
| address    | Text      |
| reasons    | Text      |
| status     | RegStatus |
| created_at | DateTime  |

### Indexes

```text
status
campus
```

---

# 9. Complaint Module

## Table: complaints

### Description

Aduan mahasiswa.

| Column      | Type            |
| ----------- | --------------- |
| id          | String          |
| sender_name | String          |
| campus      | String          |
| category    | String          |
| message     | Text            |
| status      | ComplaintStatus |
| assigned_to | String          |
| created_at  | DateTime        |
| updated_at  | DateTime        |

### Indexes

```text
status
assigned_to
```

---

# 10. Letter Module

## Table: letters

### Description

Persuratan organisasi.

| Column        | Type       |
| ------------- | ---------- |
| id            | String     |
| letter_number | String     |
| type          | LetterType |
| subject       | String     |
| file_url      | String     |
| date          | DateTime   |

### Indexes

```text
letter_number (unique)
type
```

---

# 11. Finance Module

## Table: finance_requests

### Description

Pengajuan dana departemen.

| Column        | Type          |
| ------------- | ------------- |
| id            | String        |
| amount        | Decimal       |
| description   | String        |
| proof_url     | String        |
| status        | FinanceStatus |
| department_id | String        |
| approved_by_1 | String        |
| approved_by_2 | String        |

### Indexes

```text
status
department_id
```

---

# 12. Notification Module

## Table: notifications

### Description

Notifikasi internal aplikasi.

| Column     | Type             |
| ---------- | ---------------- |
| id         | String           |
| type       | NotificationType |
| title      | String           |
| message    | String           |
| action_url | String           |
| read_at    | DateTime         |
| user_id    | String           |
| created_at | DateTime         |

### Indexes

```text
user_id
type
```

---

# 13. Audit Log Module

## Table: audit_logs

### Description

Jejak aktivitas sistem.

| Column     | Type        |
| ---------- | ----------- |
| id         | String      |
| action     | AuditAction |
| entity     | String      |
| entity_id  | String      |
| old_data   | Json        |
| new_data   | Json        |
| user_id    | String      |
| created_at | DateTime    |

### Indexes

```text
(entity, entity_id)
user_id
```

---

# 14. Web Configuration Module

## Table: web_configs

### Description

CMS konfigurasi landing page.

| Column     | Type     |
| ---------- | -------- |
| id         | String   |
| key        | String   |
| value_json | Json     |
| created_at | DateTime |
| updated_at | DateTime |

### Example Keys

```text
landing_page_hero
visi_misi
about_organization
contact_information
```

---

# 15. Index Strategy

Kolom berikut wajib memiliki index:

```text
FK Columns
status
slug
email
published_at
start_date
assigned_to
department_id
```

---

# 16. Ownership Mapping

## Blog

```ts
post.author.departmentId
===
session.user.departmentId
```

---

## Program

```ts
program.departmentId
===
session.user.departmentId
```

---

## Event

```ts
event.program.departmentId
===
session.user.departmentId
```

---

## Finance

```ts
finance.departmentId
===
session.user.departmentId
```

---

## LPJ

```ts
report.event.program.departmentId
===
session.user.departmentId
```

---

# 17. Soft Delete Strategy

## Global Rule

Data tidak boleh dihapus permanen.

Gunakan:

```ts
deletedAt = new Date()
```

---

## User Email Strategy

Saat user di-soft delete:

```text
azier@gmail.com
```

menjadi

```text
azier@gmail.com_deleted_1749123123
```

Tujuan:

* Menghindari konflik unique email.
* Tetap menjaga histori audit.
* Memungkinkan registrasi ulang email yang sama.

---

# Source of Truth

Dokumen ini menjadi referensi utama untuk:

* Prisma Schema
* Database Migration
* Seeder
* Repository Layer
* Query Layer
* Ownership Policy
* Audit System

Jika implementasi database berbeda dengan dokumen ini maka implementasi harus mengikuti Database Dictionary.
