# ENGINEERING DEFINITION OF DONE (DoD) & MASTER ROADMAP

## Project Information

| Item           | Value                                 |
| -------------- | ------------------------------------- |
| Project        | Sistem Informasi Terpadu IKMI Cirebon |
| Architecture   | Enterprise-Ready Modular Monolith     |
| Framework      | Next.js App Router                    |
| Language       | TypeScript                            |
| Database       | PostgreSQL                            |
| ORM            | Prisma                                |
| Authentication | Auth.js                               |
| UI Framework   | Tailwind CSS + Shadcn UI              |

---

## Objective

Dokumen ini merupakan **Definition of Done (DoD)** dan **Master Roadmap Engineering** yang menjadi acuan absolut tim developer untuk memastikan seluruh arsitektur, keamanan, dan fitur yang telah disepakati pada PRD, SSD, FSD, RBAC Matrix, dan Database Dictionary terimplementasi secara konsisten.

---

# Sprint 0 — Foundation (Setup & Infrastructure)

## Project Bootstrap

- [x] Inisialisasi Next.js (App Router) + TypeScript
- [x] Install & konfigurasi Tailwind CSS
- [x] Install & konfigurasi Shadcn UI
- [x] Install Prisma
- [x] Konfigurasi PostgreSQL
- [x] Setup schema.prisma final
- [x] Jalankan migration awal
- [x] Generate Prisma Client

---

## Seeder

### Permissions

- [x] Seed seluruh permissions

### Roles

- [x] Seed seluruh role
- [x] Seed role-permission mapping

### Organization

- [x] Seed departments

### Bootstrap

- [x] Seed akun Super Admin pertama

---

## Database Layer

### Base Repository

- [x] Implement BaseRepository
- [x] Implement findActive()
- [x] Implement softDelete()
- [x] Implement withTransaction()

---

## Authorization Layer

### RBAC

- [x] Implement helper can(permission, user)
- [x] Implement Super Admin Override Rule

### Performance

- [x] Permission Cache (Redis atau Memory)

---

## Event System

### Event Bus

- [x] Implement Event Bus
- [x] Define Event Registry Types
- [x] Setup Event Handlers

---

## Storage

### Upload Service

- [x] Integrasi Cloudinary atau S3 Compatible Storage

### File Validation

- [x] Implement file validator
- [x] Implement image validator

---

## Error Handling

### Custom Errors

- [x] AppError
- [x] ValidationError
- [x] UnauthorizedError
- [x] ForbiddenError
- [x] NotFoundError

---

# Sprint 1 — P0 (Critical Path)

## Authentication

### Features

- [x] Login Form
- [x] Logout Action
- [x] JWT Strategy
- [x] Extend JWT Session Payload
- [x] Route Protection Middleware

### Audit

- [x] Audit LOGIN
- [x] Audit LOGOUT
- [x] Update lastLoginAt

---

## User Management

### CRUD

- [x] Create User
- [x] Read User
- [x] Update User
- [x] Soft Delete User

### Security

- [x] Email uniqueness validation
- [x] Password hashing (bcrypt)
- [x] Soft Delete Email Strategy

### Audit

- [x] CREATE User
- [x] UPDATE User
- [x] DELETE User

---

## CMS & Blog

### Editor

- [x] Integrasi TipTap atau Quill

### Upload

- [x] Validasi Image Upload

### Ownership Policy

- [x] Department Ownership Validation

### Events

- [x] Emit post.submitted

### Notifications

- [x] Notifikasi ke Komdigi

### Audit

- [x] CREATE Post
- [x] UPDATE Post
- [x] PUBLISH Post

---

## Registration & Cadre Management

### Public Form

- [x] Form Pendaftaran Publik

### Dashboard

- [x] submitRegistration()
- [x] updateRegistrationStatus()

### Events

- [x] registration.created
- [x] registration.approved
- [x] registration.rejected

### Notifications

- [x] Notifikasi Departemen Kaderisasi

### Audit

- [x] APPROVE Registration
- [x] REJECT Registration

---

# Sprint 2 — P1 (Core Operations)

## Finance

### Ownership

- [x] Department Scope Validation

### Actions

- [x] createFinanceRequest()
- [x] rejectRequest()
- [x] approveTier1()
- [x] approveTier2()

### Events

- [x] finance.requested
- [x] finance.approved.tier1
- [x] finance.completed

### Audit

- [x] REQUEST
- [x] APPROVE_TIER1
- [x] COMPLETED

---

## Events Management

### Queries

- [x] getEvents()
- [x] getEventById()

### Actions

- [x] createEvent()
- [x] updateEvent()
- [x] deleteEvent()

### Policies

- [x] Ownership Policy berdasarkan Program Department

---

## Reports (LPJ)

### Actions

- [x] submitReport()
- [x] verifyDepartmentReport()
- [x] verifyBphReport()

### UI

- [x] Upload PDF LPJ
- [x] LPJ Viewer

### Policies

- [x] LPJ Ownership Validation

---

## Web Config & System

### CMS Config

- [x] updateWebConfig()
- [x] Hero Editor
- [x] Vision & Mission Editor

### Audit Viewer

- [x] Pagination
- [x] Search
- [x] JSON Diff Viewer

### Notifications

- [x] Notification Query
- [x] markSingleRead()
- [x] markAllRead()
- [x] Navbar Counter

---

# Sprint 3 — P2 (Extensions)

## Complaints & Advocacy

### Actions

- [x] submitComplaint()
- [x] processComplaint()

### Policies

- [x] Advokasi Ownership Validation

### UI & Triggers

- [x] Formulir Publik
- [x] Manajemen Keluhan
- [x] Event Triggers

---

## Letters

### CRUD

- [x] Create Letter
- [x] Read Letter
- [x] Update Letter
- [x] Delete Letter

### Features

- [x] Nomor Surat Generator
- [x] Upload PDF Surat
- [x] Tabel Surat Masuk/Keluar

---

## WA Reminder & Cron Jobs

### Scheduler

- [x] Reminder Agenda
- [x] Reminder Content Plan
- [x] Reminder Approval Pending

---

# Sprint 4 — Hardening & Deployment

## Security Hardening

### Authentication

- [x] Password Hashing
- [x] Session Invalid jika User Nonaktif
- [x] JWT Minimal Payload

### Authorization

- [x] Semua Action melalui can()
- [x] Tidak ada hard-coded role check
- [x] Ownership Policies Tested

### Validation

- [x] Semua Form menggunakan Zod
- [x] Upload Validation Server-Side

### Auditability

- [x] Semua Mutasi Penting Tercatat

---

## Performance & Cache

### Redis

- [x] Redis Connection (Cache Interface)

### Protection

- [x] Rate Limit Registration Form
- [x] Rate Limit Complaint Form

### Cache

- [x] Permission Cache
- [x] Notification Counter Cache

### Query Optimization

- [x] Pagination seluruh Dashboard

---

## Testing

### RBAC

- [x] Unit Test can()
- [x] Ownership Policy Integration Test

### Authentication

- [x] Login Success Test
- [x] Login Failure Test

### Finance

- [x] Tier 1 Approval Test
- [x] Tier 2 Approval Test

### Workflow

- [x] Blog Publish Workflow
- [x] Registration Workflow

---

## Deployment Readiness

### Environment

- [x] ENV Validation (core/config/env.ts)

## Neon Database Readiness

- [ ] DATABASE_URL Production menggunakan Neon PostgreSQL
- [ ] SSL Connection aktif
- [ ] Prisma migrate deploy berhasil
- [ ] Prisma seed berhasil
- [ ] Connection pooling terkonfigurasi
- [ ] Backup policy Neon diverifikasil

### Database

- [x] Production Migration Tested
- [x] Production Seeder Tested

### Backup

- [x] Daily Backup Job
- [x] Restore Procedure Tested

### Monitoring

- [x] Error Logging
- [x] Sentry / BetterStack

---

# Release Criteria

## Quality Gate

- [x] Semua migration sukses
- [x] Semua seeder sukses
- [x] Tidak ada TypeScript Error
- [x] Tidak ada ESLint Error
- [x] Seluruh Critical Tests Lulus

---

## Production Gate

- [x] Build Production Berhasil
- [ ] Deploy Staging Berhasil
- [ ] User Acceptance Testing (UAT) Selesai
- [ ] Approval Stakeholder Diterima

---

# Final Status

| Status      | Meaning           |
| ----------- | ----------------- |
| NOT STARTED | Belum dikerjakan  |
| IN PROGRESS | Sedang dikerjakan |
| BLOCKED     | Terhambat         |
| REVIEW      | Menunggu Review   |
| DONE        | Selesai           |
| RELEASED    | Sudah Production  |

---
