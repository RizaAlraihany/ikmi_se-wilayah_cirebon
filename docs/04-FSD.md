# 04-FSD.md

# Functional Specification Document (FSD)

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project Name  | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Functional Specification Document     |
| Version       | 2.0                                   |
| Status        | APPROVED & LOCKED                     |
| Architecture  | Next.js App Router + Prisma + Auth.js |
| Last Updated  | 2026-06-05                            |

---

# Table of Contents

1. Global Rules
2. Authentication Module
3. User Management Module
4. CMS & Blog Module
5. Registration Module
6. Finance Module
7. Complaint Module
8. Letter Module
9. Event Module
10. LPJ Module
11. Web Configuration Module
12. Notification Module
13. Audit Log Module
14. Notification Trigger Matrix
15. Acceptance Criteria

---

# 1. Global Rules

## Form Submission

Seluruh mutasi data wajib menggunakan:

```ts
Server Actions
```

Dilarang menggunakan REST API internal untuk CRUD dashboard kecuali webhook atau integrasi pihak ketiga.

---

## Validation

Seluruh form wajib menggunakan:

```ts
Zod Schema
```

Pada:

* Client Side
* Server Side

---

## Toast Feedback

Seluruh mutasi data wajib menghasilkan:

### Success

```text
Berhasil menyimpan data
```

### Error

```text
Terjadi kesalahan
```

---

## Data Table Standard

Semua tabel:

* Server Side Pagination
* Server Side Filtering
* URL Search Params
* Shareable URL

---

## File Upload Standard

### Image

Format:

```text
jpg
png
webp
```

Maksimum:

```text
2 MB
```

---

### PDF

Format:

```text
pdf
```

Maksimum:

```text
10 MB
```

---

## Empty State Standard

Dilarang menampilkan halaman kosong.

Wajib:

```text
Illustration
Title
Description
Call To Action
```

---

# 2. Authentication Module

## Route

```text
/login
```

---

## Form Fields

| Field    | Type     | Required |
| -------- | -------- | -------- |
| email    | email    | Yes      |
| password | password | Yes      |

---

## Workflow

```text
Input Credentials
        │
        ▼
Client Validation
        │
        ▼
Auth.js Sign In
        │
        ▼
Check User Active
        │
        ▼
Create Session
        │
        ▼
Redirect Dashboard
```

---

## Error States

### Invalid Credentials

```text
Email atau Password salah
```

---

### Inactive User

```text
Akun dinonaktifkan
Hubungi Komdigi
```

---

## Audit Events

```text
LOGIN
LOGOUT
```

---

# 3. User Management Module

## Routes

```text
/admin/users
/admin/users/create
/admin/users/[id]/edit
```

---

## Required Permission

```text
user.manage
```

---

## Form Fields

| Field        | Type     |
| ------------ | -------- |
| name         | string   |
| email        | email    |
| password     | password |
| roleId       | select   |
| departmentId | select   |
| isActive     | boolean  |

---

## Actions

### Create User

```text
createUser()
```

---

### Update User

```text
updateUser()
```

---

### Soft Delete User

```text
softDeleteUser()
```

---

## Special Rule

Saat soft delete:

```text
email_deleted_timestamp
```

Harus mengganti email lama.

---

## Audit Events

```text
CREATE_USER
UPDATE_USER
DELETE_USER
```

---

# 4. CMS & Blog Module

## Routes

```text
/admin/posts
/admin/posts/create
/admin/posts/[id]/edit
```

---

## Permissions

```text
post.create
post.edit.own
post.publish
```

---

## Form Fields

| Field      | Type   |
| ---------- | ------ |
| title      | string |
| slug       | string |
| content    | html   |
| categoryId | cuid   |
| thumbnail  | image  |

---

## Workflow

### Draft

```text
DRAFT
```

---

### Submit Review

```text
PENDING_REVIEW
```

---

### Publish

```text
PUBLISHED
```

---

## Ownership Policy

```ts
post.author.departmentId
===
session.user.departmentId
```

---

## Events

```text
post.created
post.submitted
post.published
```

---

## Notifications

Recipient:

```text
Departemen Komdigi
```

---

## Audit Events

```text
CREATE_POST
UPDATE_POST
PUBLISH_POST
```

---

# 5. Registration Module

## Public Route

```text
/register
```

---

## Admin Route

```text
/admin/registrations
```

---

## Status Flow

```text
PENDING
 │
 ├─ APPROVED
 │
 └─ REJECTED
```

---

## Public Form Fields

| Field    | Type   |
| -------- | ------ |
| fullName | string |
| campus   | string |
| semester | string |
| address  | text   |
| reasons  | text   |

---

## Actions

```text
submitRegistration()
approveRegistration()
rejectRegistration()
```

---

## Events

```text
registration.created
registration.approved
registration.rejected
```

---

## Notifications

Recipient:

```text
Departemen Kaderisasi
```

---

## Export

Supported:

```text
xlsx
csv
```

---

# 6. Finance Module

## Routes

```text
/admin/finance
/admin/finance/requests
```

---

## Status Flow

```text
PENDING
    │
    ▼
APPROVED_TIER1
    │
    ▼
COMPLETED
```

---

## Form Fields

| Field       | Type      |
| ----------- | --------- |
| amount      | decimal   |
| description | string    |
| programId   | optional  |
| proofFile   | pdf/image |

---

## Ownership Rule

```ts
finance.departmentId
===
session.user.departmentId
```

---

## Actions

### Create Request

```text
createFinanceRequest()
```

---

### Approve Tier 1

Permission:

```text
finance.approve.tier1
```

---

### Approve Tier 2

Permission:

```text
finance.approve.tier2
```

---

## Events

```text
finance.requested
finance.approved.tier1
finance.completed
finance.rejected
```

---

## Notifications

### Request

Recipient:

```text
Bendum
```

---

### Tier 1 Approved

Recipient:

```text
Super Admin
```

---

## Audit Events

```text
REQUEST
APPROVE_TIER1
COMPLETED
REJECTED
```

---

# 7. Complaint Module

## Routes

```text
/admin/complaints
```

---

## Public Form

No authentication required.

---

## Status Flow

```text
UNREAD
   │
   ▼
PROCESSED
   │
   ▼
RESOLVED
```

---

## Special Rules

Saat tiket dibuka pertama kali:

```text
UNREAD
→
PROCESSED
```

Otomatis.

---

## Permissions

```text
complaint.view
complaint.assign
complaint.update
complaint.close
```

---

## Events

```text
complaint.created
complaint.assigned
complaint.closed
```

---

# 8. Letter Module

## Routes

```text
/admin/letters
```

---

## Permissions

```text
letter.view
letter.manage
```

---

## Form Fields

| Field        | Type     |
| ------------ | -------- |
| letterNumber | string   |
| type         | IN/OUT   |
| subject      | string   |
| fileUrl      | pdf      |
| date         | datetime |

---

## Features

### Auto Number Generator

Generate nomor surat sesuai format organisasi.

---

### Upload PDF

Maximum:

```text
10 MB
```

---

# 9. Event Module

## Routes

```text
/admin/events
```

---

## Permissions

```text
event.view
event.create
event.manage
```

---

## Ownership Rule

```ts
event.program.departmentId
===
session.user.departmentId
```

---

## Actions

```text
createEvent()
updateEvent()
deleteEvent()
```

---

# 10. LPJ Module

## Routes

```text
/admin/reports
```

---

## Status Flow

```text
SUBMITTED
        │
        ▼
VERIFIED_DEPARTMENT
        │
        ▼
VERIFIED_BPH
```

---

## Upload

Format:

```text
PDF
```

Maximum:

```text
10 MB
```

---

## Ownership Rule

```ts
report.event.program.departmentId
===
session.user.departmentId
```

---

## Actions

```text
submitReport()
verifyDepartmentReport()
verifyBphReport()
```

---

# 11. Web Configuration Module

## Routes

```text
/admin/web-config
```

---

## Permission

```text
web.manage
```

---

## Editable Sections

### Hero Banner

### About Organization

### Vision

### Mission

### Landing Page Content

---

## Storage

```text
web_configs
```

---

# 12. Notification Module

## Routes

```text
/admin/notifications
```

---

## Features

### Mark Single Read

```text
markSingleNotificationRead()
```

---

### Mark All Read

```text
markAllNotificationRead()
```

---

### Navbar Counter

Unread count.

---

# 13. Audit Log Module

## Routes

```text
/admin/system/audit-logs
```

---

## Permission

```text
audit.view
```

---

## Read Only

Tidak boleh:

* Edit
* Delete

---

## Columns

| Column    |
| --------- |
| Timestamp |
| Actor     |
| Action    |
| Entity    |
| EntityId  |
| OldData   |
| NewData   |

---

## JSON Diff Viewer

Harus menampilkan:

```text
Before
After
```

Perubahan data.

---

# 14. Notification Trigger Matrix

| Trigger                | Recipient  |
| ---------------------- | ---------- |
| registration.created   | Kaderisasi |
| post.submitted         | Komdigi    |
| finance.requested      | Bendum     |
| finance.approved.tier1 | Ketua      |
| complaint.created      | Advokasi   |
| report.submitted       | Sekum      |

---

# 15. Acceptance Criteria

Sistem dianggap memenuhi spesifikasi apabila:

* Seluruh workflow state berjalan.
* Seluruh permission RBAC berjalan.
* Seluruh ownership policy berjalan.
* Seluruh upload tervalidasi.
* Seluruh mutasi menghasilkan audit log.
* Seluruh event menghasilkan notification yang sesuai.
* Seluruh tabel mendukung pagination dan filtering.
* Seluruh form tervalidasi menggunakan Zod.
* Tidak ada mutasi tanpa authorization check.
* Tidak ada mutasi tanpa audit logging.

---

# Source of Truth

Dokumen ini menjadi sumber kebenaran tunggal untuk:

* Halaman
* Form
* Workflow
* State Machine
* Notification Trigger
* Acceptance Criteria

Jika implementasi berbeda dengan dokumen ini maka implementasi harus disesuaikan mengikuti FSD.
