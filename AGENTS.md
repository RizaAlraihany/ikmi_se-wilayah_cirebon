# AGENTS.md

# AI Engineering Constitution

## Sistem Informasi Terpadu IKMI Cirebon

---

# Purpose

Dokumen ini merupakan instruksi permanen yang wajib dipatuhi oleh seluruh AI Coding Agent yang digunakan pada proyek:

```text
Sistem Informasi Terpadu IKMI Cirebon
```

Contoh:

- Codex
- Claude Code
- Cursor
- Cline
- Roo Code
- Windsurf
- Gemini CLI
- Continue
- OpenHands
- AI Agent lainnya

---

# Source Of Truth Priority

Apabila terjadi konflik antar dokumen:

```text
AGENTS.md
↓
PROJECT-CONSTITUTION.md
↓
MASTER-DATA.md
↓
05-DATABASE-DICTIONARY.md
↓
06-RBAC-MATRIX.md
↓
07-FOLDER-STRUCTURE.md
↓
ALUR-FLOW.md
↓
14-ENGINEERING-DOD.md
↓
15-DESIGN.md
↓
User Prompt
```

AI wajib mengikuti prioritas di atas.

---

# Project Overview

Nama:

Sistem Informasi Terpadu IKMI Cirebon

Arsitektur:

Enterprise Ready Modular Monolith

Framework:

Next.js App Router

Bahasa:

TypeScript Strict Mode

Database:

PostgreSQL + Prisma ORM

Authentication:

Auth.js v5 + JWT Strategy

Storage:

Cloudinary

Cache:

Upstash Redis

UI:

Tailwind CSS
Shadcn UI

---

# Domain Architecture

## Public Domain

https://ikmicirebon.or.id

Tidak memiliki login.

Fungsi:

- Landing Page
- Tentang Kami
- Struktur Pengurus
- Event
- Blog
- Pendaftaran Anggota
- Aduan Publik

---

## Internal Domain

https://dashboard.ikmicirebon.or.id

Hanya untuk pengurus.

Fungsi:

- Dashboard
- Membership
- Kaderisasi
- LPJ
- Persuratan
- Keuangan
- CMS
- Analytics
- Notification Center

---

# Master Data Rule

Single Source Of Truth:

MASTER-DATA.xlsx

Dokumen pendamping:

MASTER-DATA.md

AI dilarang membuat:

- Departemen baru
- Jabatan baru
- Program kerja baru

yang tidak terdapat pada MASTER-DATA.

---

# Architecture Rule

AI wajib mematuhi:

- PROJECT-CONSTITUTION.md
- MASTER-DATA.md
- 05-DATABASE-DICTIONARY.md
- 06-RBAC-MATRIX.md
- 07-FOLDER-STRUCTURE.md
- ALUR-FLOW.md
- 14-ENGINEERING-DOD.md
- 15-DESIGN.md

Dilarang membuat asumsi yang bertentangan dengan dokumen tersebut.
