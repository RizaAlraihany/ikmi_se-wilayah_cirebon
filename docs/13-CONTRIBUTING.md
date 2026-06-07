# 13-CONTRIBUTING.md

# Contributing Guide

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project       | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Contributing Guide                    |
| Version       | 1.0                                   |
| Status        | APPROVED & LOCKED                     |
| Last Updated  | 2026-06-05                            |

---

# Purpose

Dokumen ini mendefinisikan standar kontribusi pengembangan perangkat lunak untuk seluruh anggota tim.

Tujuan:

* Menjaga konsistensi kode.
* Mengurangi konflik Git.
* Memastikan kualitas Pull Request.
* Mempercepat proses review.
* Menjaga arsitektur tetap sesuai standar.

---

# Team Roles

## Product Owner

Tanggung jawab:

* Menentukan prioritas fitur.
* Menyetujui perubahan requirement.
* Menyetujui UAT.

---

## Technical Lead

Tanggung jawab:

* Menjaga kualitas arsitektur.
* Menyetujui perubahan teknis besar.
* Mereview Pull Request kritikal.

---

## Backend Developer

Tanggung jawab:

* Service Layer
* Repository Layer
* Prisma
* RBAC
* Server Actions

---

## Frontend Developer

Tanggung jawab:

* UI Components
* Dashboard
* Landing Page
* Form Validation

---

## QA Tester

Tanggung jawab:

* Testing
* Regression Testing
* UAT Support

---

# Development Workflow

## Branch Strategy

Menggunakan Git Flow Simplified.

---

## Protected Branches

### main

Production Branch.

Rules:

* Tidak boleh push langsung.
* Wajib melalui Pull Request.
* Wajib review.

---

### develop

Integration Branch.

Rules:

* Semua fitur digabungkan ke sini terlebih dahulu.

---

# Feature Branch Naming

Format:

```text
feature/<module>-<feature-name>
```

Contoh:

```text
feature/users-create-user
feature/blog-publish-post
feature/finance-approval-tier1
```

---

# Bugfix Branch Naming

Format:

```text
fix/<issue-name>
```

Contoh:

```text
fix/login-session
fix/ownership-policy
```

---

# Hotfix Branch Naming

Format:

```text
hotfix/<issue-name>
```

Contoh:

```text
hotfix/security-patch
```

---

# Commit Message Convention

Menggunakan Conventional Commits.

---

## Format

```text
type(scope): description
```

---

## Examples

### Feature

```text
feat(users): add create user action
```

### Fix

```text
fix(auth): resolve jwt refresh issue
```

### Refactor

```text
refactor(finance): simplify approval workflow
```

### Docs

```text
docs(rbac): update permission matrix
```

### Test

```text
test(auth): add login integration tests
```

---

# Allowed Commit Types

| Type     | Description                    |
| -------- | ------------------------------ |
| feat     | Fitur baru                     |
| fix      | Perbaikan bug                  |
| docs     | Dokumentasi                    |
| refactor | Refactor tanpa perubahan fitur |
| test     | Testing                        |
| chore    | Maintenance                    |
| ci       | CI/CD                          |
| perf     | Performance improvement        |

---

# Pull Request Rules

## Wajib Menggunakan Template

Semua Pull Request harus menjelaskan:

### Summary

Perubahan apa yang dilakukan.

### Related Issue

Issue atau task yang terkait.

### Screenshots

Jika ada perubahan UI.

### Testing Evidence

Bukti testing:

* Unit Test
* Manual Test
* Integration Test

---

# Pull Request Checklist

Developer wajib memastikan:

```text
[ ] TypeScript tidak error
[ ] ESLint tidak error
[ ] Build berhasil
[ ] Migration berhasil
[ ] Unit Test lulus
[ ] Tidak ada console.log()
[ ] Tidak ada hard-coded permission
[ ] Tidak ada hard-coded role checking
```

---

# Code Review Rules

## Reviewer Wajib Memeriksa

### Arsitektur

Apakah sesuai:

* SSD
* RBAC Matrix
* FSD
* Folder Structure

---

### Security

Pastikan:

```ts
can(permission, user)
```

dipanggil sebelum mutasi data.

---

### Ownership Policy

Pastikan:

```ts
departmentId
```

divalidasi jika diperlukan.

---

### Validation

Pastikan:

```ts
zod.parse()
```

digunakan di server.

---

### Soft Delete

Pastikan:

```ts
deletedAt
```

digunakan.

Tidak boleh:

```ts
delete()
```

untuk data bisnis.

---

# Forbidden Practices

## Hardcoded Role Checking

Dilarang:

```ts
if (user.role === "Bendum")
```

Gunakan:

```ts
can("finance.approve.tier1", user)
```

---

## Prisma di UI Layer

Dilarang:

```tsx
page.tsx
 └── prisma.user.findMany()
```

Gunakan:

```tsx
page.tsx
 └── queries.ts
```

---

## Business Logic di Server Action

Dilarang:

```ts
"use server"

await prisma.user.create(...)
```

Gunakan:

```ts
"use server"

await userService.createUser(...)
```

---

## Direct Notification Call

Dilarang:

```ts
await createNotification(...)
```

di dalam Service Layer.

Gunakan:

```ts
eventBus.emit(...)
```

---

# Definition of Ready (DoR)

Sebelum developer mulai mengerjakan task:

```text
[ ] Requirement jelas
[ ] Acceptance Criteria tersedia
[ ] UI Mockup tersedia (jika perlu)
[ ] Permission RBAC tersedia
[ ] Ownership Policy tersedia
[ ] Database schema tersedia
```

Task yang belum memenuhi DoR tidak boleh mulai dikerjakan.

---

# Definition of Done (DoD)

Sebuah task dianggap selesai jika:

```text
[ ] Kode selesai
[ ] Unit Test selesai
[ ] Integration Test selesai
[ ] Pull Request dibuat
[ ] Code Review disetujui
[ ] Build sukses
[ ] Tidak ada lint error
[ ] Dokumentasi diperbarui
```

---

# Module Creation Standard

Jika membuat modul baru:

Contoh:

```text
inventory
```

Developer wajib menyalin:

```text
features/_templates/
```

menjadi:

```text
features/inventory/
```

Minimal berisi:

```text
actions.ts
services.ts
repositories.ts
queries.ts
policies.ts
schemas.ts
```

---

# Testing Requirements

## Minimum Coverage

| Layer              | Coverage |
| ------------------ | -------- |
| RBAC               | 100%     |
| Finance Approval   | 100%     |
| Authentication     | 100%     |
| Ownership Policies | 100%     |
| Service Layer      | >= 80%   |

---

# Documentation Requirements

Perubahan berikut wajib memperbarui dokumentasi:

### Perubahan Permission

Update:

```text
03-RBAC-MATRIX.md
```

---

### Perubahan Database

Update:

```text
05-DATABASE-DICTIONARY.md
06-PRISMA-SCHEMA-STANDARD.md
```

---

### Perubahan Arsitektur

Update:

```text
12-ADR-LOG.md
```

---

# Security Rules

## Never Commit

```text
.env
.env.local
.env.production
```

---

## Never Commit

```text
API Keys
Database Credentials
JWT Secrets
Cloudinary Secrets
Redis Passwords
```

---

# CI/CD Quality Gates

Pull Request tidak boleh di-merge jika:

```text
❌ Build gagal
❌ Lint gagal
❌ Test gagal
❌ Migration gagal
❌ Review belum disetujui
```

---

# Release Process

Flow:

```text
feature/*
    ↓
develop
    ↓
staging
    ↓
main
```

---

# Governance

Perubahan terhadap:

* SSD
* RBAC
* FSD
* Database Schema
* Folder Structure
* ADR

wajib mendapat persetujuan Technical Lead.

---

# Final Principle

Seluruh anggota tim wajib mengikuti prinsip:

1. Security First
2. Type Safety First
3. Documentation First
4. Test Before Merge
5. Event Driven Over Tight Coupling
6. RBAC Over Hardcoded Roles
7. Service Layer Over Fat Controllers
8. Maintainability Over Shortcut

---

# Source of Truth

Dokumen ini merupakan panduan kontribusi resmi Sistem Informasi Terpadu IKMI Cirebon.

Seluruh Pull Request, review, dan pengembangan wajib mengikuti aturan yang tercantum di dalam dokumen ini.
