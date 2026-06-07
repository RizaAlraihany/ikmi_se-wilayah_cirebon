# 01-PRD.md

# Product Requirements Document (PRD)

## Sistem Informasi Terpadu IKMI Cirebon

---

## Document Information

| Item             | Value                                              |
| ---------------- | -------------------------------------------------- |
| Project Name     | Sistem Informasi Terpadu IKMI Cirebon              |
| Document Type    | Product Requirements Document (PRD)                |
| Version          | 1.0                                                |
| Status           | APPROVED & LOCKED                                  |
| Architecture     | Enterprise-Ready Modular Monolith                  |
| Technology Stack | Next.js App Router, TypeScript, Prisma, PostgreSQL |
| Last Updated     | 2026-06-05                                         |

---

# Table of Contents

1. Executive Summary
2. Background
3. Problem Statement
4. Project Objectives
5. Scope
6. Stakeholders
7. User Roles
8. Business Processes
9. Functional Requirements
10. Non-Functional Requirements
11. Success Metrics
12. Constraints
13. Future Roadmap
14. Acceptance Criteria

---

# 1. Executive Summary

Sistem Informasi Terpadu IKMI Cirebon adalah platform digital terpusat yang digunakan untuk mengelola aktivitas organisasi secara end-to-end.

Sistem ini dirancang untuk:

* Mengelola anggota dan pengurus
* Mengelola publikasi dan website organisasi
* Mengelola pendaftaran kaderisasi
* Mengelola keuangan organisasi
* Mengelola kegiatan dan program kerja
* Mengelola LPJ kegiatan
* Mengelola surat menyurat
* Mengelola aduan mahasiswa
* Mengelola audit dan transparansi organisasi

Sistem menjadi satu sumber data terpusat (Single Source of Truth) bagi seluruh aktivitas organisasi.

---

# 2. Background

Saat ini proses administrasi organisasi masih tersebar di berbagai platform:

* Google Form
* Spreadsheet
* WhatsApp
* Google Drive
* Dokumen Manual

Kondisi tersebut menyebabkan:

* Data terduplikasi
* Sulit melakukan audit
* Sulit melakukan monitoring program kerja
* Sulit melacak histori perubahan data
* Tidak adanya integrasi antar departemen

Diperlukan sebuah sistem terpadu yang mampu mengintegrasikan seluruh proses bisnis organisasi ke dalam satu platform.

---

# 3. Problem Statement

Masalah utama yang ingin diselesaikan:

### Administrasi

* Data anggota tersebar
* Sulit melakukan validasi data

### Publikasi

* Tidak ada alur review artikel
* Tidak ada ownership konten

### Keuangan

* Approval masih manual
* Sulit melakukan tracking pencairan

### Kegiatan

* Agenda tidak terpusat
* LPJ tidak terdokumentasi dengan baik

### Advokasi

* Aduan mahasiswa tidak terdokumentasi
* Sulit melakukan monitoring status penyelesaian

### Transparansi

* Tidak ada audit trail yang jelas

---

# 4. Project Objectives

## Objective 1

Membangun pusat administrasi organisasi yang terintegrasi.

## Objective 2

Meningkatkan transparansi aktivitas organisasi.

## Objective 3

Mempercepat proses operasional antar departemen.

## Objective 4

Mengurangi pekerjaan administratif manual.

## Objective 5

Menyediakan fondasi digital jangka panjang organisasi.

---

# 5. Scope

## In Scope (MVP)

### Authentication & Authorization

* Login
* Session Management
* RBAC
* Permission Based Access

### User Management

* CRUD Pengguna
* Role Assignment
* Department Assignment

### CMS & Blog

* Artikel
* Kategori
* Workflow Review
* Publish Content

### Kaderisasi

* Form Pendaftaran
* Verifikasi Pendaftar
* Konversi Menjadi Pengurus

### Finance

* Pengajuan Dana
* Approval Bertingkat
* Audit Pencairan

### Event Management

* Program Kerja
* Agenda Kegiatan
* Kalender Organisasi

### LPJ

* Upload Dokumen LPJ
* Verifikasi Departemen
* Verifikasi BPH

### Complaints

* Aduan Mahasiswa
* Assignment Staff
* Tracking Status

### Letters

* Surat Masuk
* Surat Keluar
* Arsip Digital

### Notifications

* In-App Notification
* Broadcast Internal

### Audit Logs

* Tracking Seluruh Aktivitas Penting

### Landing Page CMS

* Hero Section
* Visi Misi
* Konten Dinamis

---

## Out of Scope (Versi MVP)

Tidak termasuk:

* Mobile Application
* Payment Gateway
* Single Sign-On (SSO)
* Multi Organization
* Real-Time Chat
* E-Signature
* Inventory Management
* Asset Management

---

# 6. Stakeholders

## Internal

### Super Admin

Ketua Umum organisasi.

### BPH

* Sekretaris Umum
* Bendahara Umum

### Departemen

* Komdigi
* Kaderisasi
* Advokasi
* PSDA
* Ekraf
* Hubmas

### Reviewer

Dewan Pertimbangan Organisasi.

---

## External

### Mahasiswa

Pengguna layanan advokasi.

### Calon Anggota

Pendaftar kaderisasi.

### Publik

Pengunjung website organisasi.

---

# 7. User Roles

## Super Admin

Akses penuh terhadap seluruh sistem.

## BPH Sekum

Fokus pada administrasi organisasi.

## BPH Bendum

Fokus pada keuangan organisasi.

## Kadep Komdigi

Pengelola sistem dan publikasi.

## Staff Komdigi

Pengelola konten.

## Kadep Departemen

Pengelola aktivitas departemen.

## Staff Departemen

Pelaksana kegiatan departemen.

## Reviewer

Akses baca lintas modul.

---

# 8. Business Processes

## Proses Artikel

Draft

↓

Review

↓

Publish

---

## Proses Pendaftaran

Submit

↓

Review

↓

Approve / Reject

---

## Proses Keuangan

Submit Request

↓

Approval Bendum

↓

Approval Ketua

↓

Pencairan

---

## Proses Aduan

Submit Aduan

↓

Diproses

↓

Ditugaskan

↓

Selesai

---

## Proses LPJ

Upload

↓

Verifikasi Kadep

↓

Verifikasi Sekum

↓

Arsip

---

# 9. Functional Requirements

## FR-01 Authentication

Sistem harus menyediakan login berbasis email dan password.

---

## FR-02 Authorization

Sistem harus menggunakan RBAC berbasis permission.

---

## FR-03 User Management

Sistem harus mampu mengelola pengguna organisasi.

---

## FR-04 Content Management

Sistem harus mampu mengelola artikel dan publikasi.

---

## FR-05 Registration Management

Sistem harus mampu menerima dan memverifikasi pendaftaran anggota.

---

## FR-06 Finance Management

Sistem harus mendukung approval keuangan bertingkat.

---

## FR-07 Event Management

Sistem harus mengelola agenda organisasi.

---

## FR-08 Report Management

Sistem harus mengelola LPJ kegiatan.

---

## FR-09 Complaint Management

Sistem harus mengelola aduan mahasiswa.

---

## FR-10 Notification Management

Sistem harus menyediakan notifikasi internal.

---

## FR-11 Audit Management

Sistem harus mencatat seluruh aktivitas penting.

---

# 10. Non-Functional Requirements

## Security

* Password wajib di-hash menggunakan bcrypt
* Session menggunakan JWT
* Semua mutasi wajib melalui authorization layer
* Semua upload wajib divalidasi

---

## Performance

* Pagination server-side
* Index database sesuai SSD
* Permission caching
* Redis caching (future ready)

---

## Scalability

* Modular Monolith Architecture
* CQRS-lite Pattern
* Event-Driven Architecture

---

## Maintainability

* Service Layer Pattern
* Base Repository Pattern
* Shared Validation Layer

---

## Reliability

* Audit Log
* Daily Backup
* Error Monitoring

---

# 11. Success Metrics

## Operasional

* 100% pengajuan dana tercatat di sistem

* 100% artikel dipublikasikan melalui workflow review

* 100% LPJ tersimpan secara digital

---

## Administrasi

* Pengurangan penggunaan spreadsheet manual

* Pengurangan proses approval melalui chat pribadi

---

## Teknis

* Tidak ada data orphan

* Tidak ada bypass authorization

* Tidak ada mutasi tanpa audit log

---

# 12. Constraints

## Teknologi

* Next.js App Router
* PostgreSQL
* Prisma ORM
* Auth.js

## Infrastruktur

* Cloudinary/S3
* WhatsApp Gateway
* Redis (Opsional)

## Tim

* Tim pengembang internal organisasi

---

# 13. Future Roadmap

## Phase 2

* Mobile App
* Push Notification
* Dashboard Analytics

## Phase 3

* Inventory Management
* Asset Management
* Procurement System

## Phase 4

* Multi Cabang Organisasi
* Multi Tenant Architecture

---

# 14. Acceptance Criteria

Dokumen PRD dianggap selesai apabila:

* Seluruh stakeholder memahami tujuan sistem
* Seluruh ruang lingkup MVP telah disetujui
* Seluruh modul utama terdefinisi
* Seluruh kebutuhan non-fungsional terdokumentasi
* Menjadi referensi utama untuk SSD, FSD, RBAC, Database Dictionary, dan Engineering Roadmap

---

# Source of Truth

Dokumen ini merupakan dokumen tingkat tertinggi (Level-1 Documentation).

Hierarki dokumentasi proyek:

PRD
↓
SSD
↓
FSD
↓
RBAC Matrix
↓
Database Dictionary
↓
Prisma Schema
↓
Engineering DoD
↓
Implementation

Apabila terjadi konflik antar dokumen, maka dokumen dengan level lebih tinggi memiliki prioritas.
