# 11-DEPLOYMENT-RUNBOOK.md

# Deployment Runbook

## Sistem Informasi Terpadu IKMI Cirebon

---

# Document Information

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| Project       | Sistem Informasi Terpadu IKMI Cirebon |
| Document Type | Deployment Runbook                    |
| Version       | 1.0                                   |
| Status        | APPROVED & LOCKED                     |
| Environment   | Production                            |
| Last Updated  | 2026-06-05                            |

---

# Purpose

Dokumen ini mendefinisikan prosedur resmi deployment, maintenance, backup, restore, monitoring, dan rollback.

Tujuan:

* Deployment konsisten
* Mengurangi human error
* Menjamin recovery jika terjadi kegagalan
* Menjadi acuan DevOps dan Komdigi

---

# Production Architecture

```text
Internet
    │
    ▼
Nginx Reverse Proxy
    │
    ▼
Next.js Application
    │
    ├── PostgreSQL
    │
    ├── Redis
    │
    ├── Cloudinary / S3
    │
    └── WhatsApp Gateway
```

---

# Environment Requirements

## Minimum Server

### Staging

```text
2 CPU
4 GB RAM
50 GB SSD
```

---

### Production

```text
4 CPU
8 GB RAM
100 GB SSD
```

---

# Required Services

```text
Node.js 22+
PostgreSQL 16+
Redis 7+
Docker
Docker Compose
```

---

# Environment Variables

Lokasi:

```text
.env.production
```

---

# Required Variables

```env
DATABASE_URL=

AUTH_SECRET=
AUTH_URL=

REDIS_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SUPER_ADMIN_NAME=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=

WA_GATEWAY_URL=
WA_GATEWAY_TOKEN=

NEXT_PUBLIC_APP_URL=
```

---

# Environment Validation

Semua ENV wajib divalidasi menggunakan:

```text
src/core/config/env.ts
```

---

# Fail Fast Rule

Aplikasi wajib gagal startup jika:

* DATABASE_URL kosong
* AUTH_SECRET kosong
* Cloudinary tidak valid

---

# Dockerfile Standard

Lokasi:

```text
Dockerfile
```

---

# Build Command

```bash
npm run build
```

---

# Start Command

```bash
npm run start
```

---

# Docker Compose Structure

```text
docker-compose.yml
```

---

# Services

```text
app
postgres
redis
```

---

# Example Network

```yaml
networks:
  ikmi-network:
```

---

# First Deployment

## Step 1

Clone repository.

```bash
git clone ...
```

---

## Step 2

Setup environment.

```bash
cp .env.example .env.production
```

---

## Step 3

Install dependencies.

```bash
npm install
```

---

## Step 4

Generate Prisma Client.

```bash
npx prisma generate
```

---

## Step 5

Run migration.

```bash
npx prisma migrate deploy
```

---

## Step 6

Run seed.

```bash
npm run seed
```

---

## Step 7

Build application.

```bash
npm run build
```

---

## Step 8

Start application.

```bash
npm run start
```

---

# Deployment Verification

## Application

Check:

```text
/login
```

---

Expected:

```text
200 OK
```

---

## Database

Verify:

```text
roles
permissions
departments
super admin
```

sudah tersedia.

---

## Authentication

Verify:

```text
Super Admin Login
```

berhasil.

---

# Production Deployment Flow

## Step 1

Pull latest source.

```bash
git pull origin main
```

---

## Step 2

Install dependency.

```bash
npm ci
```

---

## Step 3

Generate Prisma Client.

```bash
npx prisma generate
```

---

## Step 4

Apply migration.

```bash
npx prisma migrate deploy
```

---

## Step 5

Build.

```bash
npm run build
```

---

## Step 6

Restart application.

```bash
pm2 restart ikmi-web
```

atau

```bash
docker compose restart
```

---

# Zero Downtime Strategy

Recommended:

```text
Blue Green Deployment
```

---

# Migration Rules

## Allowed

```bash
npx prisma migrate dev
```

hanya pada local.

---

## Production

```bash
npx prisma migrate deploy
```

---

## Forbidden

```bash
prisma db push
```

langsung ke production.

---

# Database Backup

Lokasi:

```text
jobs/handlers/daily-backup.ts
```

---

# Schedule

```text
Daily
01:00 WIB
```

---

# PostgreSQL Backup

```bash
pg_dump
```

---

# Naming Convention

```text
backup_YYYY_MM_DD.sql
```

---

# Backup Retention

```text
30 hari
```

---

# Restore Procedure

## Step 1

Stop application.

```bash
pm2 stop ikmi-web
```

---

## Step 2

Restore database.

```bash
psql database_name < backup.sql
```

---

## Step 3

Start application.

```bash
pm2 start ikmi-web
```

---

# Redis Cache

## Flush Cache

```bash
redis-cli FLUSHALL
```

---

## When Required

* Permission update
* Seeder role update
* Notification cache issue

---

# Monitoring

## Required Monitoring

### Application

```text
Response Time
Error Rate
Memory Usage
CPU Usage
```

---

### Database

```text
Connection Count
Slow Query
Storage Usage
```

---

# Recommended Tools

```text
BetterStack
Sentry
Grafana
Prometheus
```

---

# Error Logging

Lokasi:

```text
Sentry
```

atau

```text
BetterStack
```

---

# Alert Rules

Critical Alert:

```text
Application Down
Database Down
Redis Down
```

---

Immediate notification:

```text
Komdigi Administrator
```

---

# Security Checklist

## Authentication

* [ ] Auth Secret kuat
* [ ] JWT minimal payload
* [ ] Session invalid jika user nonaktif

---

## Database

* [ ] Tidak expose PostgreSQL ke internet
* [ ] Backup aktif
* [ ] SSL aktif

---

## File Upload

* [ ] Validasi ukuran file
* [ ] Validasi mime type
* [ ] Cloudinary private config aman

---

## Authorization

* [ ] Semua mutation melalui can()
* [ ] Semua ownership policy aktif

---

# Rollback Procedure

## When

Rollback dilakukan jika:

```text
Deployment gagal
Migration gagal
Critical bug production
```

---

# Rollback Steps

## Step 1

Checkout previous release.

```bash
git checkout <tag>
```

---

## Step 2

Build.

```bash
npm run build
```

---

## Step 3

Restart service.

```bash
pm2 restart ikmi-web
```

---

# Release Checklist

## Code Quality

* [ ] ESLint pass
* [ ] TypeScript pass
* [ ] Test pass

---

## Database

* [ ] Migration tested
* [ ] Seed tested

---

## Security

* [ ] Authorization tested
* [ ] Ownership tested

---

## Infrastructure

* [ ] Redis healthy
* [ ] PostgreSQL healthy
* [ ] Cloudinary healthy

---

# Production Gate

Deployment hanya boleh dilakukan jika:

* [ ] Sprint selesai
* [ ] QA selesai
* [ ] UAT selesai
* [ ] Backup berhasil
* [ ] Monitoring aktif

---

# Incident Response

## Severity Levels

### P1

```text
System Down
Database Corruption
Security Breach
```

Response:

```text
< 30 menit
```

---

### P2

```text
Critical Feature Broken
```

Response:

```text
< 2 jam
```

---

### P3

```text
Minor Bug
```

Response:

```text
< 24 jam
```

---

# Disaster Recovery Objective

## RPO

```text
24 Jam
```

Maksimal kehilangan data.

---

## RTO

```text
2 Jam
```

Maksimal waktu pemulihan.

---

# Definition of Done

Deployment dianggap berhasil apabila:

* Migration sukses
* Seeder sukses
* Login berhasil
* Dashboard dapat diakses
* Monitoring aktif
* Backup aktif

---

# Source of Truth

Dokumen ini adalah standar resmi deployment dan operasional Sistem Informasi Terpadu IKMI Cirebon.

Apabila terjadi konflik antara implementasi dan dokumen ini, maka dokumen ini menjadi referensi utama sampai terdapat revisi resmi melalui ADR (Architecture Decision Record).
