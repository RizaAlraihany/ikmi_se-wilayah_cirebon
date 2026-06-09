# MASTER-DATA.md

> Single Source of Truth (SSOT) Sistem Informasi Terpadu IKMI Cirebon

---

# Tujuan Dokumen

Dokumen ini merupakan representasi dokumentasi dari file:

```text
/docs/database/Master-Data.xlsx
```

Seluruh data organisasi yang digunakan oleh sistem wajib berasal dari /docs/database/Master-Data.xlsx

Dokumen ini dibuat untuk memudahkan developer, maintainer, dan pengurus memahami struktur data organisasi tanpa harus membuka spreadsheet secara langsung.

---

# Single Source of Truth (SSOT)

Sumber data resmi organisasi:

```text
MASTER-DATA.xlsx
```

MASTER-DATA.xlsx menjadi sumber utama untuk:

- Prisma Seeder
- Database PostgreSQL
- Dashboard Internal
- Website Publik
- CMS
- Analytics
- Kalender Kegiatan
- Membership Management
- Kaderisasi
- Program Kerja
- Content Plan

---

# Domain Sistem

## Domain Publik

```text
https://ikmicirebon.or.id
```

Digunakan untuk:

- Landing Page
- Profil Organisasi
- Struktur Pengurus
- Event & Program Kerja
- Blog & Ruang Gagasan
- Pendaftaran Anggota
- Aduan & Aspirasi

---

## Domain Internal

```text
https://dashboard.ikmicirebon.or.id
```

Digunakan untuk:

- Dashboard Pengurus
- Membership Management
- Kaderisasi
- Keuangan
- LPJ
- Persuratan
- CMS
- Analytics
- Notification Center

---

# Struktur Organisasi

## Badan Pengurus Harian (BPH)

1. Ketua Umum
2. Wakil Ketua Umum
3. Sekretaris Umum I
4. Sekretaris Umum II
5. Bendahara Umum I
6. Bendahara Umum II

---

## Departemen

### Departemen Kaderisasi

Fokus:

- Rekrutmen anggota
- Pembinaan anggota
- Pengembangan kader

Program:

- PRABUMI
- MAKRAB
- Ekspedisi Kampus
- Sapa Rasa

---

### Departemen Kajian & Advokasi Strategis

Fokus:

- Kajian isu strategis
- Advokasi mahasiswa
- Pengelolaan aduan publik

Program:

- WARLIT
- Diskusi Panel
- Refleksi Hari Besar
- Layanan Aduan Mahasiswa

---

### Departemen Pengembangan Sumber Daya Anggota (PSDA)

Fokus:

- Pengembangan kompetensi anggota

Program:

- BASKARA
- CIMANUK
- REANG

---

### Departemen Ekonomi Kreatif

Fokus:

- Pengembangan usaha organisasi

Program:

- Kunjungan Industri
- Seragam & Lanyard
- Pendataan Usaha
- Penjualan Produk

---

### Departemen Komunikasi & Digitalisasi (Komdigi)

Fokus:

- Media publikasi
- Website
- Branding organisasi

Program:

- Company Profile
- Media Sosial
- Pelatihan Internal
- Podcast Lentera Ayu
- Kabar Indramayu

---

### Departemen Hubungan & Pengabdian Masyarakat (HPM)

Fokus:

- Pengabdian masyarakat
- Hubungan eksternal

Program:

- IKMI Sosial
- Harlah IKMI
- IKMI Peduli
- Ngobor
- Sospen

---

# Membership Lifecycle

```text
Pendaftar
↓
Calon Anggota
↓
Verifikasi Kaderisasi
↓
Anggota Aktif
↓
Pengurus
↓
Demisioner
↓
Alumni
```

---

# Master Status Keanggotaan

| Status        |
| ------------- |
| Calon Anggota |
| Anggota Aktif |
| Pengurus      |
| Demisioner    |
| Alumni        |

---

# Master Departemen

| Kode    | Nama                             |
| ------- | -------------------------------- |
| KAD     | Kaderisasi                       |
| KAJ     | Kajian & Advokasi Strategis      |
| PSDA    | Pengembangan Sumber Daya Anggota |
| EKRAF   | Ekonomi Kreatif                  |
| KOMDIGI | Komunikasi & Digitalisasi        |
| HPM     | Hubungan & Pengabdian Masyarakat |

---

# Modul Sistem

## Website Publik

- Home
- Tentang Kami
- Struktur Organisasi
- Event
- Blog
- Pendaftaran Anggota
- Aduan & Aspirasi

---

## Dashboard Internal

- Dashboard
- Users
- Membership
- Kaderisasi
- Program Kerja
- Event
- LPJ
- Keuangan
- Persuratan
- CMS
- Aduan
- Notification Center
- Analytics

---

# Seeder Mapping

Data pada MASTER-DATA.xlsx digunakan untuk menghasilkan data awal sistem:

```text
departments
positions
members
programs
activities
events
content_plans
roles
permissions
organization_settings
```

---

# Data Governance

Aturan pengelolaan data organisasi:

1. Seluruh perubahan data dilakukan pada MASTER-DATA.xlsx terlebih dahulu.
2. Seeder wajib mengikuti data pada MASTER-DATA.xlsx.
3. Database tidak boleh menjadi sumber kebenaran utama.
4. Dokumentasi ini mengikuti MASTER-DATA.xlsx.
5. Jika terjadi perbedaan data, MASTER-DATA.xlsx dianggap paling benar.

---

# Ownership

Dokumen ini dimiliki oleh:

```text
Departemen Komunikasi & Digitalisasi (Komdigi)
IKMI Se-Wilayah Cirebon
Periode 2026–2027
```

Sebagai sumber referensi resmi seluruh pengembangan Sistem Informasi Terpadu IKMI Cirebon.
