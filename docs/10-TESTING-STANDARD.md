# 10-TESTING-STANDARD.md

# Engineering Testing Standard

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project       | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Testing Standard                      |
| Version       | 1.0                                   |
| Status        | APPROVED & LOCKED                     |
| Architecture  | Enterprise Modular Monolith           |
| Last Updated  | 2026-06-05                            |

---

# Purpose

Dokumen ini mendefinisikan standar pengujian resmi untuk seluruh aplikasi.

Tujuan:

* Menjamin kualitas sistem
* Mencegah regresi fitur
* Menjamin keamanan RBAC
* Menjamin workflow organisasi berjalan sesuai FSD
* Menjadi syarat Release Gate Production

---

# Testing Philosophy

Sistem menggunakan pendekatan:

```text
Unit Test
↓
Integration Test
↓
Workflow Test
↓
Security Test
↓
Release
```

---

# Testing Stack

## Required

```json
{
  "vitest": "latest",
  "@testing-library/react": "latest",
  "@testing-library/jest-dom": "latest",
  "@testing-library/user-event": "latest"
}
```

---

# Testing Folder Structure

```text
src/tests/

├── auth/
├── users/
├── blog/
├── registrations/
├── finance/
├── complaints/
├── reports/
├── notifications/
├── rbac/
├── events/
└── integration/
```

---

# Test Categories

## Unit Test

Menguji:

* Function
* Helper
* Service
* Policy
* Validator

Tanpa database asli.

---

## Integration Test

Menguji:

* Repository
* Prisma Query
* Service Layer
* Event Bus

Menggunakan test database.

---

## Workflow Test

Menguji:

* End-to-End workflow bisnis

Contoh:

```text
Submit Registration
↓
Approve Registration
↓
Notification Created
↓
Audit Log Created
```

---

## Security Test

Menguji:

* Authorization
* Ownership Policy
* Authentication

---

# Coverage Requirements

## Minimum Coverage

| Layer            | Coverage |
| ---------------- | -------- |
| Core             | 90%      |
| Authorization    | 95%      |
| Services         | 85%      |
| Repositories     | 80%      |
| Features Overall | 80%      |

---

## Production Requirement

Build tidak boleh release apabila:

```text
Coverage < 80%
```

---

# Authentication Testing

Lokasi:

```text
tests/auth/
```

---

# Login Success

## Test Case

```text
Given valid email
And valid password

When login

Then create session
And redirect dashboard
```

---

## Assertions

* JWT dibuat
* Session valid
* lastLoginAt ter-update

---

# Login Failure

## Test Case

```text
Given invalid password

When login

Then reject request
```

---

## Assertions

* Session tidak dibuat
* Error muncul

---

# Inactive User

## Test Case

```text
Given user inactive

When login

Then deny access
```

---

## Assertions

* Session null
* Unauthorized

---

# Authorization Testing

Lokasi:

```text
tests/rbac/
```

---

# can() Helper

## Test Matrix

### Super Admin

```text
can(any_permission)
```

Expected:

```text
TRUE
```

---

### User Tanpa Permission

Expected:

```text
FALSE
```

---

### User Dengan Permission

Expected:

```text
TRUE
```

---

# Ownership Policy Testing

## Blog

### Allowed

```text
User.departmentId
=
Post.departmentId
```

Expected:

```text
ALLOW
```

---

### Denied

```text
User.departmentId
≠
Post.departmentId
```

Expected:

```text
403 Forbidden
```

---

# User Module Testing

Lokasi:

```text
tests/users/
```

---

# Create User

Assertions:

* User berhasil dibuat
* Password ter-hash
* Audit Log dibuat

---

# Update User

Assertions:

* Data berubah
* Audit Log dibuat

---

# Soft Delete User

Assertions:

* deletedAt terisi
* email berubah

---

## Example

```text
admin@mail.com

↓

admin@mail.com_deleted_123456
```

---

# Blog Testing

Lokasi:

```text
tests/blog/
```

---

# Create Draft

Assertions:

* Status DRAFT
* Data tersimpan

---

# Submit Review

Assertions:

* Status PENDING_REVIEW
* Event dipancarkan

---

# Publish

Assertions:

* Status PUBLISHED
* publishedAt terisi
* Audit Log dibuat

---

# Registration Testing

Lokasi:

```text
tests/registrations/
```

---

# Submit Registration

Assertions:

* Data tersimpan
* Status PENDING
* Notification dibuat

---

# Approve Registration

Assertions:

* Status APPROVED
* Event dipancarkan
* Audit dibuat

---

# Reject Registration

Assertions:

* Status REJECTED
* Audit dibuat

---

# Finance Testing

Lokasi:

```text
tests/finance/
```

---

# Create Request

Assertions:

* Status PENDING
* Department Owner benar

---

# Approve Tier 1

Assertions:

* Status APPROVED_TIER1
* Approver tersimpan

---

# Unauthorized Tier 1

Assertions:

* ForbiddenError

---

# Approve Tier 2

Assertions:

* Status COMPLETED
* Approver kedua tersimpan

---

# Finance Ownership

Assertions:

* User hanya melihat request departemennya

---

# Complaint Testing

Lokasi:

```text
tests/complaints/
```

---

# Submit Complaint

Assertions:

* Status UNREAD

---

# Open Complaint

Assertions:

* Status PROCESSED

---

# Resolve Complaint

Assertions:

* Status RESOLVED

---

# Letters Testing

Lokasi:

```text
tests/letters/
```

---

# Create Letter

Assertions:

* Nomor surat unik
* PDF tersimpan

---

# Soft Delete Letter

Assertions:

* deletedAt terisi

---

# Event Testing

Lokasi:

```text
tests/events/
```

---

# Create Event

Assertions:

* Event dibuat

---

# Update Event

Assertions:

* Data berubah

---

# Ownership Policy

Assertions:

```text
event.program.departmentId
```

harus sesuai user.

---

# Report Testing

Lokasi:

```text
tests/reports/
```

---

# Submit Report

Assertions:

* Status SUBMITTED

---

# Verify Department

Assertions:

* Status VERIFIED_DEPARTMENT

---

# Verify BPH

Assertions:

* Status VERIFIED_BPH

---

# Notification Testing

Lokasi:

```text
tests/notifications/
```

---

# Create Notification

Assertions:

* User penerima benar

---

# Mark Read

Assertions:

```text
readAt != null
```

---

# Mark All Read

Assertions:

* Seluruh notification terbaca

---

# Audit Log Testing

Lokasi:

```text
tests/audit/
```

---

# Create Audit

Assertions:

* Action benar
* Entity benar
* EntityId benar

---

# Event Bus Testing

Lokasi:

```text
tests/events/
```

---

# Emit Event

Assertions:

* Handler dipanggil

---

# Handler Execution

Assertions:

* Audit dibuat
* Notification dibuat

---

# Database Testing

## Repository Tests

Semua repository wajib diuji:

```text
create
update
softDelete
findById
findMany
```

---

# Transaction Testing

Assertions:

Jika query ke-2 gagal:

```text
ROLLBACK
```

semua perubahan.

---

# Security Testing

## Authorization

Assertions:

Semua mutation:

```text
create
update
delete
approve
verify
publish
```

wajib memanggil authorization.

---

## Ownership

Assertions:

Tidak ada cross-department modification.

---

## Validation

Assertions:

Input invalid ditolak.

---

# Performance Testing

## Pagination

Assertions:

Tidak mengambil seluruh data.

---

## N+1 Query

Assertions:

Tidak terjadi query berulang.

---

# CI/CD Quality Gate

Pipeline wajib menjalankan:

```bash
npm run lint

npm run typecheck

npm run test

npm run build
```

---

# Release Gate

Release production hanya boleh dilakukan jika:

## Quality

* [ ] Semua test pass
* [ ] Coverage >= 80%
* [ ] Tidak ada TypeScript error
* [ ] Tidak ada ESLint error

---

## Security

* [ ] RBAC test pass
* [ ] Ownership test pass
* [ ] Validation test pass

---

## Workflow

* [ ] Blog workflow pass
* [ ] Registration workflow pass
* [ ] Finance workflow pass
* [ ] LPJ workflow pass

---

# Definition of Done

Sebuah fitur dianggap selesai apabila:

* Unit Test dibuat
* Integration Test dibuat
* Workflow Test dibuat (jika relevan)
* Coverage tidak turun
* Semua pipeline CI lulus

---

# Source of Truth

Dokumen ini adalah standar resmi testing Sistem Informasi Terpadu IKMI Cirebon.

Apabila terdapat konflik antara implementasi dan dokumen ini, maka dokumen ini menjadi referensi utama sampai terdapat revisi resmi melalui ADR (Architecture Decision Record).
