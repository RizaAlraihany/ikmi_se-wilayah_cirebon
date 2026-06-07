# 03-RBAC-MATRIX.md

# Role-Based Access Control (RBAC) Permission Matrix

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                    |
| ------------- | ---------------------------------------- |
| Project Name  | Sistem Informasi Terpadu IKMI Cirebon    |
| Document Type | RBAC Permission Matrix                   |
| Version       | 2.0                                      |
| Status        | APPROVED & LOCKED                        |
| Architecture  | Permission-Based RBAC + Ownership Policy |
| Last Updated  | 2026-06-05                               |

---

# Table of Contents

1. Purpose
2. Authorization Model
3. Role Definitions
4. Permission Naming Convention
5. Permission Dictionary
6. Role-Permission Matrix
7. Ownership Policies
8. Super Admin Override
9. Authorization Flow
10. Seeder Requirements
11. Developer Rules
12. Acceptance Criteria

---

# 1. Purpose

Dokumen ini mendefinisikan sistem otorisasi aplikasi.

Dokumen ini menjadi sumber kebenaran tunggal (Single Source of Truth) untuk:

* Roles
* Permissions
* Ownership Policies
* Authorization Rules

---

# 2. Authorization Model

Sistem menggunakan:

```text
RBAC
+
Ownership Policy
```

atau:

```text
Permission Check
AND
Resource Ownership Check
```

---

## Layer 1

Permission Validation

Contoh:

```ts
await can(
  "finance.approve.tier1",
  session.user
)
```

---

## Layer 2

Ownership Validation

Contoh:

```ts
post.author.departmentId
===
session.user.departmentId
```

---

User harus lolos kedua lapisan tersebut sebelum dapat melakukan mutasi data.

---

# 3. Role Definitions

## Super Admin

Ketua Umum organisasi.

Memiliki akses penuh terhadap seluruh sistem.

---

## BPH Sekum

Sekretaris Umum.

Fokus pada:

* Administrasi
* LPJ
* Persuratan

---

## BPH Bendum

Bendahara Umum.

Fokus pada:

* Keuangan
* Approval Dana

---

## Kadep Komdigi

Administrator teknis organisasi.

Fokus pada:

* User Management
* Website Management
* CMS Management

---

## Staff Komdigi

Pengelola konten dan publikasi.

---

## Kadep Kaderisasi

Pengelola kaderisasi dan data anggota.

---

## Staff Kaderisasi

Pelaksana operasional kaderisasi.

---

## Kadep Advokasi

Pengelola aduan mahasiswa.

---

## Staff Advokasi

Pelaksana advokasi mahasiswa.

---

## Kadep PSDA

Pengelola data sumber daya anggota.

---

## Staff PSDA

Pelaksana PSDA.

---

## Kadep Ekraf

Pengelola unit usaha organisasi.

---

## Staff Ekraf

Pelaksana Ekraf.

---

## Kadep Hubmas

Pengelola hubungan eksternal.

---

## Staff Hubmas

Pelaksana Hubmas.

---

## Reviewer

Dewan Pertimbangan.

Akses baca lintas modul.

---

# 4. Permission Naming Convention

Format:

```text
module.action.scope
```

Contoh:

```text
user.manage
post.publish
finance.approve.tier1
finance.approve.tier2
lpj.verify.department
```

---

## Rules

Permission wajib:

* lowercase
* menggunakan titik (.)
* tidak menggunakan underscore

---

# 5. Permission Dictionary

## System

```text
system.view
system.manage
```

---

## User

```text
user.view
user.manage
```

---

## Audit

```text
audit.view
```

---

## Notification

```text
notification.view
notification.manage
```

---

## Finance

```text
finance.view
finance.request

finance.approve.tier1
finance.approve.tier2

finance.manage.global
finance.manage.department
```

---

## Letters

```text
letter.view
letter.manage
```

---

## Membership

```text
member.view
member.manage
```

---

## CMS

```text
post.view
post.create
post.edit.own
post.publish

web.manage
```

---

## Events

```text
event.view
event.create
event.manage
```

---

## LPJ

```text
lpj.submit
lpj.verify.department
lpj.verify.bph
```

---

## Complaints

```text
complaint.view
complaint.assign
complaint.update
complaint.close
```

---

# 6. Role-Permission Matrix

## System & Audit

| Permission    | Sekum | Bendum | Komdigi | Staff Komdigi | Dept       | Reviewer |
| ------------- | ----- | ------ | ------- | ------------- | ---------- | -------- |
| system.view   | ❌     | ❌      | ✅       | ❌             | ❌          | ✅        |
| system.manage | ❌     | ❌      | ✅       | ❌             | ❌          | ❌        |
| user.view     | ✅     | ✅      | ✅       | ❌             | Kadep Only | ✅        |
| user.manage   | ❌     | ❌      | ✅       | ❌             | ❌          | ❌        |
| audit.view    | ❌     | ❌      | ✅       | ❌             | ❌          | ✅        |

---

## Notification

| Permission          | Sekum | Bendum | Komdigi | Staff Komdigi | Dept | Reviewer |
| ------------------- | ----- | ------ | ------- | ------------- | ---- | -------- |
| notification.view   | ✅     | ✅      | ✅       | ✅             | ✅    | ✅        |
| notification.manage | ❌     | ❌      | ✅       | ❌             | ❌    | ❌        |

---

## Finance

| Permission                | Sekum            | Bendum           | Dept  |
| ------------------------- | ---------------- | ---------------- | ----- |
| finance.view              | ✅                | ✅                | ❌     |
| finance.request           | ❌                | ❌                | ✅     |
| finance.approve.tier1     | ❌                | ✅                | ❌     |
| finance.approve.tier2     | Super Admin Only | Super Admin Only | ❌     |
| finance.manage.global     | ❌                | ✅                | ❌     |
| finance.manage.department | ❌                | ❌                | Ekraf |

---

## CMS

| Permission    | Komdigi | Staff Komdigi | Dept |
| ------------- | ------- | ------------- | ---- |
| post.view     | ✅       | ✅             | ✅    |
| post.create   | ✅       | ✅             | ✅    |
| post.edit.own | ✅       | ✅             | ✅    |
| post.publish  | ✅       | ✅             | ❌    |
| web.manage    | ✅       | ✅             | ❌    |

---

## Events & LPJ

| Permission            | Sekum | Komdigi | Dept       |
| --------------------- | ----- | ------- | ---------- |
| event.view            | ✅     | ✅       | ✅          |
| event.create          | ❌     | ✅       | ✅          |
| event.manage          | ✅     | ❌       | ❌          |
| lpj.submit            | ❌     | ✅       | ✅          |
| lpj.verify.department | ❌     | ❌       | Kadep Only |
| lpj.verify.bph        | ✅     | ❌       | ❌          |

---

## Complaints

| Permission       | Advokasi |
| ---------------- | -------- |
| complaint.view   | ✅        |
| complaint.assign | Kadep    |
| complaint.update | ✅        |
| complaint.close  | Kadep    |

---

# 7. Ownership Policies

RBAC saja tidak cukup.

Sistem wajib menjalankan ownership policy.

---

## Post

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

## Finance Request

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

## Failure Response

Jika ownership gagal:

```http
403 Forbidden
```

---

# 8. Super Admin Override

Sistem wajib mengimplementasikan bypass global.

```ts
if (
  user.role.name === "super_admin"
) {
  return true
}
```

---

Tujuan:

Tidak perlu menambahkan mapping permission baru ke Super Admin setiap kali sistem berkembang.

---

# 9. Authorization Flow

```text
User Request
      │
      ▼
Permission Check
      │
      ▼
Ownership Check
      │
      ▼
Allow / Deny
```

---

Contoh:

```text
Edit Post
      │
      ▼
can("post.edit.own")
      │
      ▼
department match?
      │
      ▼
ALLOW
```

---

# 10. Seeder Requirements

Seed wajib dibuat pada:

```text
prisma/seed.ts
```

---

Seeder harus:

* membuat seluruh role
* membuat seluruh permission
* membuat role-permission mapping
* membuat departments
* membuat Super Admin pertama

---

# 11. Developer Rules

## Dilarang

```ts
if (
 user.role === "Bendum"
)
```

---

## Wajib

```ts
await can(
 "finance.approve.tier1",
 session.user
)
```

---

## Dilarang

Role checking hard-coded.

---

## Wajib

Menggunakan Permission System.

---

## Dilarang

Melewati Ownership Policy.

---

# 12. Acceptance Criteria

Dokumen dianggap selesai apabila:

* Seluruh role terdefinisi.
* Seluruh permission terdefinisi.
* Ownership policy terdefinisi.
* Authorization flow terdokumentasi.
* Seeder requirements terdokumentasi.
* Menjadi sumber kebenaran untuk seluruh implementasi authorization.

---

# Source of Truth

Dokumen ini merupakan sumber kebenaran tunggal untuk:

* Role
* Permission
* Ownership Rules
* Authorization Policies

Jika terjadi konflik antara implementasi kode dan dokumen ini, maka implementasi wajib mengikuti dokumen RBAC ini.
