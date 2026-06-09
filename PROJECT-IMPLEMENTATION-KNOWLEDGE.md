# PROJECT IMPLEMENTATION KNOWLEDGE

Dokumen ini adalah panduan fundamental untuk setiap *engineer*, *AI Agent*, maupun *developer* yang akan berpartisipasi dalam pengembangan **Sistem Informasi Terpadu IKMI Cirebon**. Dokumen ini merangkum visi, arsitektur target, serta batasan-batasan desain yang wajib dipatuhi tanpa perlu menelusuri puluhan dokumen secara manual.

---

## 1. Project Vision

**Mengapa project ini dibuat?**
Sistem Informasi Terpadu IKMI Cirebon dibangun untuk mentransformasi tata kelola manual Ikatan Keluarga Mahasiswa Indramayu (IKMI) di wilayah Cirebon menjadi sistem digital yang sentralistik, efisien, dan transparan.
Sistem ini bertujuan untuk memecahkan masalah administrasi yang berserakan, hilangnya arsip LPJ, kesulitan melacak status keanggotaan/alumni, serta birokrasi pengajuan dana yang panjang. Tujuan jangka panjangnya adalah menciptakan organisasi modern yang digerakkan oleh data (*data-driven organization*).

---

## 2. Final Target Architecture

**Bentuk akhir sistem seperti apa?**
Sistem akan berjalan sebagai *Modular Monolith* yang dibagi ke dalam dua domain utama secara tegas:

### Public Domain (`https://ikmicirebon.or.id`)
Berfungsi sebagai representasi wajah organisasi. Domain ini terbuka bebas (tanpa proses *login*), difokuskan untuk optimasi *Search Engine* (SEO), performa tinggi, dan konversi (pendaftaran & penyampaian aspirasi).

### Internal Domain (`https://dashboard.ikmicirebon.or.id`)
Berfungsi sebagai dapur operasional. Memerlukan autentikasi (*Login*), memuat *dashboard* manajemen enterprise untuk para pengurus dalam menjalankan roda organisasi.

---

## 3. Organization Model

**Siapa pengguna sistem?**
Pengguna sistem merepresentasikan hierarki kepengurusan IKMI yang nyata, yang dibagi menjadi:

- **Badan Pengurus Harian (BPH):**
  - Ketua Umum
  - Wakil Ketua Umum
  - Sekretaris Umum I & II
  - Bendahara Umum I & II
- **Departemen-Departemen Utama:**
  - Kaderisasi
  - Kajian & Advokasi Strategis
  - Pengembangan Sumber Daya Anggota (PSDA)
  - Ekonomi Kreatif (Ekraf)
  - Komunikasi & Digitalisasi (Komdigi)
  - Hubungan & Pengabdian Masyarakat (HPM)

---

## 4. Membership Management Vision

**Apa bisnis utama IKMI?**
Inti bisnis IKMI adalah pengembangan manusia (kader). Sistem ini dibangun untuk mencatat, mengelola, dan mendampingi *lifecycle* (siklus hidup) setiap mahasiswa Indramayu mulai dari:
`Pendaftar` → `Calon Anggota` → `Verifikasi Kaderisasi` → `Anggota Aktif` → `Pengurus` → `Demisioner` → `Alumni`.
Sistem ini memastikan tidak ada "kader yang hilang dari radar" dan semua memiliki rekam jejak.

---

## 5. Program & Activity Management Vision

**Bagaimana organisasi menjalankan program kerja?**
Seluruh program kerja dari tiap departemen akan dikelola 100% digital dalam sistem (*paperless*). Mulai dari:
- **Perencanaan** (Drafting & *budgeting*)
- **Pelaksanaan** (Monitoring status & pencatatan event *offline*)
- **LPJ** (Laporan Pertanggungjawaban diunggah secara digital)
- **Arsip** (Verifikasi dan penutupan program ke dalam arsip abadi)

---

## 6. Public Website Vision

**Apa yang harus dilihat masyarakat?**
Domain publik dirancang untuk memberikan informasi komprehensif kepada masyarakat dan calon pendaftar, meliputi:
- **Landing Page:** *Showcase* yang modern dan memikat.
- **Tentang Kami:** Visi, misi, nilai, sejarah, dan tujuan organisasi.
- **Struktur Organisasi:** Bagan/foto kepengurusan saat ini.
- **Event & Program Kerja:** Publikasi transparansi kegiatan.
- **Blog (Ruang Gagasan):** Opini, berita, dan hasil kajian.
- **Pendaftaran Anggota:** Gerbang utama rekrutmen.
- **Aduan Publik:** Saluran penyampaian isu-isu kemahasiswaan atau kedaerahan.

---

## 7. Dashboard Vision

**Apa yang harus dapat dilakukan pengurus?**
Melalui *Internal Domain*, pengurus dapat melakukan otomasi manajemen berdasarkan tupoksinya masing-masing:
- **Dashboard:** Menampilkan analitik & KPI (*Key Performance Indicator*).
- **Membership & Kaderisasi:** Mengelola siklus hidup anggota dan memvalidasi calon anggota.
- **Event & Program Kerja:** Manajemen pelaksanaan kegiatan organisasi.
- **LPJ & Finance:** *Approval* pengajuan dana bertingkat dan validasi laporan.
- **Persuratan:** Penomoran surat (*Letter Numbering*) otomatis untuk keluar/masuk.
- **Aduan:** Investigasi laporan masuk (sistem tiket).
- **CMS:** Publikasi blog dan tata letak *website* publik.
- **Notification Center:** Sentralisasi pemberitahuan aktivitas penting ke masing-masing *user*.

---

## 8. Data Management Vision

**Data apa yang menjadi fondasi sistem?**
Seluruh entitas dan data inisial dikunci (*locked*) mengikuti dokumen `MASTER-DATA.xlsx`, `MASTER-DATA.md`, dan `DATABASE-DICTIONARY.md`. Kumpulan *Master Data* ini bertindak sebagai *Single Source of Truth*. Tidak boleh ada *engineer/Agent* yang secara mandiri merancang departemen fiktif, role palsu, atau nama tabel sembarangan yang menyalahi dokumen tersebut.

---

## 9. Security & Governance Vision

**Bagaimana sistem menjaga kontrol organisasi?**
- **RBAC (Role-Based Access Control):** Menentukan visibilitas menu dan tombol sesuai jabatan.
- **Ownership Policy:** Sekalipun memiliki *permission*, pengguna hanya berwenang mengubah data miliknya (misal: Ketua Departemen hanya bisa *edit* LPJ milik departemennya sendiri).
- **Audit Log:** Melacak dan merekam setiap aksi *Create*, *Update*, *Delete*, *Approve*, atau *Login* beserta data *sebelum* dan *sesudah*nya.
- **Approval Workflow:** Keputusan krusial seperti pencairan keuangan atau verifikasi LPJ memerlukan persetujuan berjenjang (misal: Tier 1 Kadep, Tier 2 Bendahara/Ketum).

---

## 10. UI/UX Vision

**Seperti apa sistem ini harus terlihat?**
Sesuai dengan `15-DESIGN.md`, pengalaman pengguna wajib mengikuti kaidah:
- **Modern SaaS:** Tampilan solid dan interaktif layaknya *software enterprise*.
- **Mobile First:** Sepenuhnya *responsive*, sangat optimal saat dibuka di *smartphone*.
- **Light Theme:** Menggunakan tema terang secara penuh agar informasi mudah dibaca dan inklusif.
- **Professional:** Menggunakan sistem desain (*Shadcn UI* & *Tailwind*) yang konsisten dan tegas.
- **Human Centered:** Bebas kebingungan, instruksi jelas, anti-*clunky*.

---

## 11. Engineering Vision

**Bagaimana sistem harus dibangun?**
Arsitektur kode mematuhi dokumen `PROJECT-CONSTITUTION.md` dan `14-ENGINEERING-DOD.md`:
- **Modular Monolith:** Monolit namun dipecah bersih berdasarkan batasan logika bisnis.
- **Feature First:** Kode tidak dipisah berdasarkan folder tipe file (bukan folder `controllers`, `models`), melainkan difokuskan di folder fitur (`src/features/blog`, `src/features/finance`).
- **CQRS Lite:** Logika baca (`queries.ts`) dipisahkan sepenuhnya dengan logika mutasi tulis (`services.ts`).
- **Repository Pattern:** Seluruh transaksi dan *query Builder* Prisma *database* terisolasi di `repositories.ts` (tidak boleh bocor ke *UI Controller*).
- **Event Driven:** Aksi yang menimbulkan efek domino (contoh: Pendaftaran Berhasil → Kirim Notif & Email) dilepas secara asinkron menggunakan *Event Bus*.

---

## 12. Implementation Roadmap

**Apa yang akan dikerjakan selanjutnya?**
Pengembangan sistem akan dijalankan mengikuti 7 fase berkelanjutan:
1. **Phase 1 — Foundation:** Validasi arsitektur, *setup database*, CI/CD, dan struktur folder awal.
2. **Phase 2 — Public Domain:** Pembuatan komponen antarmuka web, integrasi beranda, tentang kami, struktur organisasi, dan statik rute lainnya.
3. **Phase 3 — Membership:** Modul krusial Pendaftaran, Kaderisasi, dan manajemen *Users* (Autentikasi).
4. **Phase 4 — Dashboard:** Dashboard khusus RBAC, Program Kerja, Event, *Finance*, dan *Approval* LPJ.
5. **Phase 5 — CMS:** Integrasi modul *Blog*, pengelolaan dokumen/persuratan, dan konfigurasi Web Dinamis.
6. **Phase 6 — Workflow:** Integrasi sistem Aduan Publik (*Ticketing*), *Audit Logs*, dan notifikasi asinkron.
7. **Phase 7 — Hardening & Production:** Optimalisasi performa (Caching Redis), perbaikan *Technical Debt*, pengujian (*Testing*), dan *Final Release* ke produksi.


## 13. Locked Decisions

Dokumen berikut telah ditetapkan sebagai Source of Truth dan tidak boleh diubah tanpa persetujuan pemilik project:

- AGENTS.md
- PROJECT-CONSTITUTION.md
- MASTER-DATA.xlsx
- MASTER-DATA.md
- 05-DATABASE-DICTIONARY.md
- 06-RBAC-MATRIX.md
- 07-ALUR-FLOW.md
- 15-DESIGN.md
- 07-FOLDER-STRUCTURE.md
- 14-ENGINEERING-DOD.md

Diagram:
- 01-organization-structure
- 02-membership-lifecycle
- 03-program-lifecycle
- 04-enterprise-business-flow

Jika implementasi berbeda dengan dokumen di atas,
maka implementasi yang harus disesuaikan,
bukan dokumennya.

## 14. Current Project Status

Status:
Documentation Locked

Current Sprint:
Sprint 1 - Foundation Refactor

Objective:

- Menyesuaikan codebase dengan dokumentasi final
- Menyesuaikan schema.prisma dengan DATABASE-DICTIONARY
- Menyesuaikan folder structure dengan 07-FOLDER-STRUCTURE
- Menyiapkan seed berdasarkan MASTER-DATA
- Menyiapkan RBAC berdasarkan RBAC-MATRIX

Belum masuk:

- UI Development
- Feature Development
- Production Deployment

Fokus saat ini adalah Foundation Refactor.


