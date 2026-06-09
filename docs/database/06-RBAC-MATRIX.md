# RBAC-MATRIX.md

# Role Based Access Control Matrix

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project Name  | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | RBAC Matrix                           |
| Version       | 3.0                                   |
| Status        | APPROVED & LOCKED                     |
| Architecture  | Enterprise Ready Modular Monolith     |
| Last Updated  | 2026-06-08                            |

---

# Purpose

Dokumen ini menjadi sumber kebenaran utama (Source of Truth) untuk:

- Authentication
- Authorization
- Permission Mapping
- Ownership Policy
- Service Layer Validation
- Dashboard Visibility
- Menu Visibility
- Action Authorization

Jika implementasi berbeda dengan dokumen ini maka implementasi harus mengikuti RBAC Matrix.

---

# Fundamental Rules

## Rule 1 — Public Domain

```text
https://ikmicirebon.or.id
```

Tidak menggunakan autentikasi.

Pengunjung hanya dapat:

- Membaca informasi publik
- Mendaftar anggota
- Mengirim aduan
- Membaca artikel
- Melihat struktur organisasi
- Melihat event dan program kerja

---

## Rule 2 — Internal Domain

```text
https://dashboard.ikmicirebon.or.id
```

Seluruh akses wajib melalui:

```text
Auth.js
+
RBAC
+
Ownership Policy
```

---

## Rule 3 — Super Admin Override

Role:

```text
super_admin
```

memiliki akses ke seluruh sistem.

Seluruh validasi permission dapat dilewati oleh Super Admin.

---

## Rule 4 — Ownership First

Meskipun memiliki permission, user tetap dibatasi oleh ownership.

Contoh:

Ketua Departemen Komdigi tidak dapat mengubah Program Kerja Departemen Kaderisasi.

---

# Organization Hierarchy

```text
Super Admin

Ketua Umum

Wakil Ketua Umum

Sekretaris Umum
Bendahara Umum

Ketua Departemen

Sekretaris Departemen

Anggota Departemen

Alumni
```

---

# Roles

## super_admin

Akses penuh seluruh sistem.

---

## ketua_umum

Pemegang otoritas tertinggi organisasi.

---

## wakil_ketua_umum

Koordinator seluruh departemen.

---

## sekretaris_umum

Pengelolaan administrasi organisasi.

---

## bendahara_umum

Pengelolaan keuangan organisasi.

---

## ketua_departemen

Kepala departemen.

Ownership berdasarkan department_id.

---

## sekretaris_departemen

Pengelola administrasi departemen.

Ownership berdasarkan department_id.

---

## anggota_departemen

Anggota operasional departemen.

Ownership berdasarkan department_id.

---

## alumni

Akses sangat terbatas.

Read only.

---

# Permission Registry

## Users

```text
user.view
user.create
user.update
user.delete
```

---

## Organization

```text
organization.view
organization.update
```

---

## Members

```text
member.view
member.create
member.update
member.verify
member.promote
```

---

## Registration

```text
registration.view
registration.review
registration.approve
registration.reject
```

---

## Blog

```text
post.view
post.create
post.update
post.delete
post.submit
post.publish
```

---

## Program

```text
program.view
program.create
program.update
program.delete
```

---

## Event

```text
event.view
event.create
event.update
event.delete
```

---

## LPJ

```text
lpj.view
lpj.submit
lpj.verify_department
lpj.verify_bph
```

---

## Finance

```text
finance.view
finance.create
finance.approve_tier1
finance.approve_tier2
finance.reject
```

---

## Complaints

```text
complaint.view
complaint.assign
complaint.process
complaint.resolve
```

---

## Letters

```text
letter.view
letter.create
letter.update
letter.delete
```

---

## CMS

```text
cms.view
cms.update
```

---

## Audit

```text
audit.view
```

---

## System

```text
system.manage
```

---

# Role Permission Matrix

| Permission            | SA  | Ketua | Wakil | Sekum | Bendum | Kadep    | Sekdep   | Anggota |
| --------------------- | --- | ----- | ----- | ----- | ------ | -------- | -------- | ------- |
| user.view             | ✅  | ✅    | ✅    | ✅    | ❌     | ❌       | ❌       | ❌      |
| user.create           | ✅  | ✅    | ❌    | ❌    | ❌     | ❌       | ❌       | ❌      |
| user.update           | ✅  | ✅    | ❌    | ❌    | ❌     | ❌       | ❌       | ❌      |
| user.delete           | ✅  | ✅    | ❌    | ❌    | ❌     | ❌       | ❌       | ❌      |
| member.view           | ✅  | ✅    | ✅    | ✅    | ❌     | ✅       | ✅       | ❌      |
| member.verify         | ✅  | ❌    | ❌    | ❌    | ❌     | ✅       | ❌       | ❌      |
| member.promote        | ✅  | ✅    | ✅    | ❌    | ❌     | ❌       | ❌       | ❌      |
| registration.review   | ✅  | ❌    | ❌    | ❌    | ❌     | ✅       | ✅       | ❌      |
| registration.approve  | ✅  | ❌    | ❌    | ❌    | ❌     | ✅       | ❌       | ❌      |
| post.create           | ✅  | ✅    | ✅    | ✅    | ✅     | ✅       | ✅       | ✅      |
| post.publish          | ✅  | ❌    | ❌    | ❌    | ❌     | Komdigi  | Komdigi  | ❌      |
| program.create        | ✅  | ❌    | ✅    | ❌    | ❌     | ✅       | ✅       | ❌      |
| event.create          | ✅  | ❌    | ✅    | ❌    | ❌     | ✅       | ✅       | ❌      |
| lpj.submit            | ✅  | ❌    | ❌    | ❌    | ❌     | ✅       | ✅       | ✅      |
| lpj.verify_department | ✅  | ❌    | ❌    | ❌    | ❌     | ✅       | ❌       | ❌      |
| lpj.verify_bph        | ✅  | ✅    | ✅    | ✅    | ✅     | ❌       | ❌       | ❌      |
| finance.create        | ✅  | ❌    | ❌    | ❌    | ❌     | ✅       | ✅       | ❌      |
| finance.approve_tier1 | ✅  | ❌    | ❌    | ❌    | ✅     | ❌       | ❌       | ❌      |
| finance.approve_tier2 | ✅  | ✅    | ❌    | ❌    | ✅     | ❌       | ❌       | ❌      |
| complaint.process     | ✅  | ❌    | ❌    | ❌    | ❌     | Advokasi | Advokasi | ❌      |
| letter.create         | ✅  | ❌    | ❌    | ✅    | ❌     | ❌       | ❌       | ❌      |
| cms.update            | ✅  | ❌    | ❌    | ❌    | ❌     | Komdigi  | Komdigi  | ❌      |
| audit.view            | ✅  | ✅    | ✅    | ✅    | ✅     | ❌       | ❌       | ❌      |
| system.manage         | ✅  | ❌    | ❌    | ❌    | ❌     | ❌       | ❌       | ❌      |

---

# Ownership Policy

## Blog

```ts
post.author.departmentId === session.user.departmentId;
```

---

## Program

```ts
program.departmentId === session.user.departmentId;
```

---

## Event

```ts
event.program.departmentId === session.user.departmentId;
```

---

## LPJ

```ts
report.event.program.departmentId === session.user.departmentId;
```

---

## Finance

```ts
finance.departmentId === session.user.departmentId;
```

---

## Complaint

```ts
complaint.assignedDepartmentId === session.user.departmentId;
```

---

# Dashboard Visibility

## Ketua Umum

- Executive Dashboard
- Approval Center
- Finance Overview
- Organization Overview
- Audit Log

---

## Wakil Ketua Umum

- Monitoring Program
- Monitoring LPJ
- Monitoring Departemen

---

## Sekretaris Umum

- Persuratan
- Arsip Organisasi
- Kalender Organisasi

---

## Bendahara Umum

- Keuangan
- Approval Dana
- Laporan Kas

---

## Ketua Departemen

- Program Departemen
- LPJ Departemen
- Anggota Departemen
- Approval Internal

---

## Sekretaris Departemen

- Administrasi Departemen
- Surat Departemen
- LPJ Departemen

---

## Anggota Departemen

- Dashboard Personal
- Program Aktif
- Tugas & Agenda

---

# Source of Truth

Dokumen ini menjadi referensi utama untuk:

- Auth.js
- Prisma Seeder
- RBAC Engine
- Dashboard Menu
- Middleware Authorization
- Service Layer Authorization
- Ownership Validation

Jika implementasi berbeda dengan dokumen ini maka implementasi harus mengikuti RBAC Matrix.
