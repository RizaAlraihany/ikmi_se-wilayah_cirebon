# Audit Dashboard UI/UX, Menu, Flow, dan Hak Akses

Tanggal audit: 2026-06-17  
Checkout: `web-komdigi-ikmi`  
Tujuan: bahan perbaikan UI/UX dashboard internal IKMI Cirebon.

## Ringkasan Eksekutif

Dashboard internal saat ini memakai shell utama di `src/app/(dashboard)/layout.tsx` dengan sidebar desktop berbasis permission dan navigasi mobile berbasis role. Secara arsitektur, role aktif yang digunakan kode adalah:

- `super_admin` - Super Admin
- `admin_komdigi` - Admin Komdigi
- `admin_sekretaris` - Admin Sekretaris
- `admin_bendahara` - Admin Bendahara
- `user` - Anggota umum

Menu dashboard sudah cukup dekat dengan scope refaktor: Komdigi untuk CMS/publikasi, Sekretaris untuk kalender/pengumuman/persuratan/pengurus/pendaftar, Bendahara untuk buku kas/LPJ/token, dan Super Admin untuk overview lintas modul. Namun ada beberapa gap penting untuk UI/UX dan konsistensi akses:

- Beberapa halaman admin belum memiliki guard permission eksplisit di page, meskipun sidebar menyembunyikan menu dan action/service melakukan sebagian validasi.
- Copy `Pendaftaran Kader` masih muncul di dashboard, padahal scope saat ini adalah `Anggota Baru` dari form publik tanpa approval.
- `User` memiliki permission read/submit tertentu di seed, tetapi dashboard shell belum menyediakan menu/flow user yang lengkap sesuai AGENTS.
- Ada route dashboard legacy/kurang aktif seperti `/admin/programs`, `/admin/notifications`, dan `/admin/cms/analytics` yang tidak semuanya muncul di sidebar utama atau tidak sepenuhnya selaras dengan scope refaktor.
- Beberapa action lama masih revalidate path `/dashboard/...`; sebagian sudah ditambah `/admin/...`, tetapi perlu audit lanjutan agar tidak ada stale UI.

## Source of Truth dan File yang Diaudit

Dokumen/brief:

- `AGENTS.md`
- Instruksi user pada sesi ini

File inti role, RBAC, dan navigasi:

- `src/core/auth/roles.ts`
- `src/core/authorization/rbac.ts`
- `src/core/auth/rbac.ts`
- `prisma/seed.ts`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/dashboard-navigation.tsx`

Folder route dashboard:

- `src/app/(dashboard)/admin/**`
- `src/app/(dashboard)/dashboard/**`
- `src/app/(dashboard)/users/**`
- `src/app/(dashboard)/registrations/**`

Folder feature/action yang relevan:

- `src/features/blog/**`
- `src/features/categories/**`
- `src/features/content-plan/**`
- `src/features/web-config/**`
- `src/features/media/**`
- `src/features/events/**`
- `src/features/announcements/**`
- `src/features/letters/**`
- `src/features/document-archives/**`
- `src/features/management/**`
- `src/features/registration/**`
- `src/features/finance/**`
- `src/features/reports/**`
- `src/features/lpj-token/**`
- `src/features/users/**`
- `src/features/audit/**`
- `src/features/notifications/**`

## Role dan Hak Akses Dasar

### Super Admin

Role ID: `super_admin`

Sumber role:

- Ketua
- Wakil Ketua

Perilaku RBAC:

- `can()` otomatis mengembalikan `true` untuk `super_admin`.
- Mendapat semua permission yang ada di seed.
- Mobile menggunakan drawer/hamburger, bukan bottom navigation.

Fokus dashboard:

- Overview lintas modul
- Manajemen user dan role
- Generate LPJ token
- Audit logs
- Read/write access lintas modul

### Admin Komdigi

Role ID: `admin_komdigi`

Permission utama:

- `post.view`
- `post.create`
- `post.update`
- `post.delete`
- `post.submit`
- `post.publish`
- `cms.view`
- `cms.update`
- `content_plan.view`
- `content_plan.manage`
- `article_queue.view`
- `article_queue.manage`
- `pamphlet_request.manage`

Fokus dashboard:

- Landing page dan konfigurasi website
- Blog/artikel/berita acara
- Kategori artikel
- Media library
- Content plan

Catatan UI/UX:

- Bottom nav Komdigi saat ini: Dashboard, Landing, Plan, Blog, Media.
- `Kategori` tidak masuk bottom nav karena batas 5 item, tetapi ada di sidebar desktop dan quick action dashboard.
- Permission `article_queue.*` dan `pamphlet_request.manage` belum tampak sebagai menu dashboard khusus.

### Admin Sekretaris

Role ID: `admin_sekretaris`

Permission utama:

- `user.view`
- `user.update`
- `registration.view`
- `registration.review`
- `event.view`
- `event.create`
- `event.update`
- `event.delete`
- `calendar.view`
- `calendar.manage`
- `announcement.view`
- `announcement.manage`
- `letter.view`
- `letter.create`
- `letter.update`
- `letter.delete`

Fokus dashboard:

- Kalender kegiatan
- Pengumuman dan WA blast
- Surat masuk/keluar
- Arsip dokumen
- Manajemen pengurus
- Arsip anggota baru dari form publik

Catatan UI/UX:

- Bottom nav Sekretaris: Dashboard, Kalender, Surat, Arsip, Pengurus.
- `Pengumuman` dan `Anggota Baru` tidak masuk bottom nav karena batas 5 item, tetapi tersedia sebagai quick action pada dashboard.
- Copy `Pendaftaran Kader` perlu diganti menjadi `Anggota Baru`/`Pendaftar Baru` agar tidak keluar dari scope.

### Admin Bendahara

Role ID: `admin_bendahara`

Permission utama:

- `finance.view`
- `finance.create`
- `finance.approve_tier1`
- `finance.approve_tier2`
- `finance.reject`
- `cashbook.view`
- `cashbook.manage`
- `financial_report.view`
- `financial_report.export`
- `lpj.view`
- `lpj.verify_bph`
- `lpj_token.manage`

Fokus dashboard:

- Buku kas/iuran
- Laporan keuangan
- LPJ module
- LPJ submission token

Catatan UI/UX:

- Bottom nav Bendahara: Dashboard, Iuran, Token, LPJ.
- Halaman `/admin/reports/[id]` masih mengecek `lpj.verify`, sedangkan seed memberi `lpj.verify_bph`. Ini perlu diselaraskan agar tombol/detail verifikasi tidak salah baca permission.

### User

Role ID: `user`

Permission utama:

- `profile.update`
- `calendar.view`
- `announcement.view`
- `financial_report.view`
- `pamphlet_request.create`
- `post.submit`
- `lpj.submit`
- `lpj_token.use`

Fokus menurut AGENTS:

- Kalender kegiatan read only
- Pengumuman read only
- Dashboard keuangan read only
- Request pamflet
- Submit karya tulis
- Submit LPJ via token
- Edit profil

Catatan UI/UX:

- Implementasi menu user belum lengkap. User bisa mendapat nav yang lolos permission seperti Kalender dan Pengumuman, tetapi route admin terkait tidak semuanya didesain sebagai read-only user experience.
- Belum terlihat menu eksplisit untuk Request Pamflet, Submit Karya Tulis, Submit LPJ via Token, dan Dashboard Keuangan read-only.

## Inventory Menu Dashboard Saat Ini

### Desktop Sidebar

Sumber: `src/app/(dashboard)/layout.tsx`

| Grup | Menu | Route | Permission Sidebar |
|---|---|---|---|
| Overview | Dashboard | `/admin` | publik untuk user login |
| Super Admin | Manajemen User | `/admin/users` | `user.view` |
| Super Admin | LPJ Token | `/admin/finance/tokens` | `lpj_token.manage` |
| Super Admin | Audit Logs | `/admin/system/audit-logs` | `audit.view` |
| Super Admin | Landing Page | `/admin/cms/settings` | `cms.update` |
| Komdigi | Content Plan | `/admin/cms/content-plan` | `content_plan.view` |
| Komdigi | Blog & Artikel | `/admin/cms/posts` | `post.view` |
| Komdigi | Kategori | `/admin/cms/categories` | `cms.view` |
| Komdigi | Media Library | `/admin/cms/media` | `cms.view` |
| Sekretaris | Kalender Kegiatan | `/admin/events` | `calendar.view` |
| Sekretaris | Pengumuman | `/admin/announcements` | `announcement.view` |
| Sekretaris | Persuratan | `/admin/letters` | `letter.view` |
| Sekretaris | Arsip Dokumen | `/admin/documents` | `letter.view` |
| Sekretaris | Manajemen Pengurus | `/admin/management` | `user.view` |
| Sekretaris | Anggota Baru | `/admin/registrations` | `registration.view` |
| Bendahara | Buku Kas | `/admin/finance` | `finance.view` |
| Bendahara | LPJ Module | `/admin/reports` | `lpj.view` |

### Mobile Navigation per Role

Super Admin:

- Menggunakan drawer berisi seluruh grup authorized.

Admin Komdigi:

- Dashboard
- Landing
- Plan
- Blog
- Media

Admin Sekretaris:

- Dashboard
- Kalender
- Surat
- Arsip
- Pengurus

Admin Bendahara:

- Dashboard
- Iuran
- Token
- LPJ

Default/User:

- Dashboard
- Kalender
- Surat
- Arsip
- Pengurus
- Info
- Artikel
- Profil

Catatan: setelah filter permission dan `.slice(0, 5)`, user umum kemungkinan hanya melihat sebagian menu yang lolos permission. Ini perlu diuji dengan akun user karena beberapa route admin belum didesain khusus read-only.

## Route dan Flow Modul

### `/admin` - Dashboard Overview

Sumber: `src/app/(dashboard)/admin/page.tsx`

Fitur:

- Hero role-aware untuk Super Admin, Komdigi, Sekretaris, Bendahara, User.
- KPI role-aware:
  - Anggota aktif
  - Kalender
  - Saldo kas
  - LPJ pending
  - Persuratan
  - Dokumen
  - Pendaftar
  - Artikel
  - Content Plan
- Quick action mobile:
  - Sekretaris: Kalender, Persuratan, Arsip Dokumen, Pengumuman, Pengurus, Anggota Baru.
  - Komdigi: CMS Landing Page, Content Plan, Blog & Berita Acara, Kategori, Media Library, Preview Publik.
  - Bendahara: Iuran & Laporan, LPJ Token, Review LPJ.
- Ruang Tindak Lanjut role-aware.

Flow:

1. User login.
2. Dashboard mengambil data lintas query.
3. Role menentukan hero, KPI, quick action, dan tindak lanjut.
4. User klik quick action menuju modul.

Catatan UI/UX:

- Dashboard sudah menjadi entry point yang baik untuk mobile role admin.
- Super Admin mengambil banyak data lintas modul; perlu skeleton/loading strategy jika nanti menjadi lambat.
- User dashboard copy sudah ada, tetapi menu/route user belum lengkap.

### `/admin/users` dan `/admin/users/create` - Manajemen User

Sumber:

- `src/app/(dashboard)/admin/users/page.tsx`
- `src/app/(dashboard)/admin/users/create/page.tsx`
- `src/features/users/actions.ts`

Fitur:

- List user dengan search.
- Table desktop dan card mobile.
- Status aktif/nonaktif.
- Tambah pengguna.
- Delete user action.

Flow:

1. Super Admin membuka list user.
2. Search nama/email.
3. Tambah pengguna via `/admin/users/create`.
4. Delete user dari table.

Catatan audit:

- Sidebar membutuhkan `user.view`.
- Page list belum terlihat guard `can('user.view')` eksplisit.
- Action users memiliki TODO RBAC check untuk create/update/delete. Ini prioritas tinggi sebelum UI/UX polish lebih jauh.
- Tombol edit di table belum mengarah ke halaman edit; saat ini button icon tanpa href/action.

### `/admin/cms/settings` - Landing Page / Web Config

Sumber:

- `src/app/(dashboard)/admin/cms/settings/page.tsx`
- `src/app/(dashboard)/admin/cms/settings/components/WebConfigForm.tsx`
- `src/features/web-config/actions.ts`

Fitur:

- Edit landing hero.
- Edit landing about.
- Edit landing section.
- Edit CTA.
- Edit about page.
- Edit contact info.
- Edit SEO config.
- Upload image config.

Flow:

1. Komdigi/Super Admin membuka Web Config.
2. Form memuat config DB atau default config.
3. Admin mengubah section.
4. Save melakukan upsert config dan revalidate public pages.

Hak akses:

- Page guard: `requireCmsUpdate()` atau `cms.update`.

Catatan UI/UX:

- Ini surface utama Komdigi untuk website publik.
- Form sangat panjang; disarankan dibuat tab/accordion per area: Hero, Tentang, Section Landing, CTA, SEO, Kontak.
- Perlu preview panel atau link preview setelah save.

### `/admin/cms/content-plan` - Content Plan

Sumber:

- `src/app/(dashboard)/admin/cms/content-plan/page.tsx`
- `src/app/(dashboard)/admin/cms/content-plan/components/ContentPlanForm.tsx`
- `src/features/content-plan/actions.ts`
- `src/features/content-plan/services.ts`

Fitur:

- Filter bulan via input month.
- KPI status plan.
- Form tambah content plan.
- List publikasi per bulan.
- Progress status: `PLANNED -> IN_PROGRESS -> READY -> PUBLISHED`.

Flow:

1. Admin Komdigi pilih bulan.
2. Tambah plan dengan title/platform/publish date/author.
3. Plan muncul di daftar.
4. Status dinaikkan bertahap sampai published.

Hak akses:

- Sidebar: `content_plan.view`.
- Service create/update: `content_plan.manage`.
- Page belum terlihat guard eksplisit `content_plan.view`.

Catatan UI/UX:

- Cocok diarahkan ke grid kalender bulanan.
- Saat ini status hanya maju satu arah; jika user butuh koreksi, perlu dropdown status reversible.
- Form di mobile tampil penuh; untuk UI/UX lebih baik modal/bottom sheet tambah plan.

### `/admin/cms/posts` - Blog & Artikel

Sumber:

- `src/app/(dashboard)/admin/cms/posts/page.tsx`
- `src/app/(dashboard)/admin/cms/posts/create/page.tsx`
- `src/app/(dashboard)/admin/cms/posts/[id]/page.tsx`
- `src/app/(dashboard)/admin/cms/posts/[id]/PostWorkflowActions.tsx`
- `src/features/blog/actions.ts`
- `src/features/blog/services.ts`

Fitur:

- List artikel dengan search.
- Create artikel.
- Edit artikel.
- Upload cover.
- Workflow draft/review/approve/publish/archive/delete.
- Status artikel: draft, pending review, approved, published, archived.

Flow:

1. Komdigi membuat atau mengedit artikel.
2. Artikel dapat disubmit/review.
3. Publisher mempublish.
4. Public blog dan detail blog direvalidate.

Hak akses:

- Sidebar: `post.view`.
- Service:
  - Create: `post.create`
  - Update: `post.update`
  - Submit: `post.submit` atau `post.publish`
  - Publish/approve/archive: publisher path memakai `post.publish`
  - Delete: `post.delete`
- Page list/create/edit belum terlihat guard eksplisit di page.

Catatan UI/UX:

- List mobile sudah card-based.
- Perlu filter status/category/author untuk workflow editorial.
- Tombol workflow sebaiknya dibuat stepper/status rail agar urutan editorial jelas.

### `/admin/cms/categories` - Kategori Artikel

Sumber:

- `src/app/(dashboard)/admin/cms/categories/page.tsx`
- `src/app/(dashboard)/admin/cms/categories/components/CategoryList.tsx`
- `src/app/(dashboard)/admin/cms/categories/components/CategoryModal.tsx`
- `src/features/categories/actions.ts`

Fitur:

- List kategori.
- Create/update/delete kategori.
- Modal kategori.

Hak akses:

- Page guard: `requireCmsUpdate()`.
- Service: `requireCmsUpdate()`.

Catatan UI/UX:

- Sudah lebih aman dari sisi gate dibanding beberapa page lain.
- Perlu indikator kategori sedang digunakan agar user tahu kenapa kategori tidak bisa dihapus.

### `/admin/cms/media` dan `/admin/media` - Media Library

Sumber:

- `src/app/(dashboard)/admin/cms/media/page.tsx`
- `src/app/(dashboard)/admin/cms/media/MediaLibraryClient.tsx`
- `src/app/(dashboard)/admin/media/page.tsx`
- `src/features/media/actions.ts`

Fitur:

- List media asset.
- Upload media ke Cloudinary.
- Delete media.
- `/admin/media` redirect ke `/admin/cms/media`.

Hak akses:

- Page guard: `requireCmsUpdate()`.
- Service: `requireCmsUpdate()`.

Catatan UI/UX:

- Perlu reusable asset picker untuk Web Config dan Post Form agar admin tidak copy URL manual.

### `/admin/cms/analytics` - CMS Analytics

Sumber:

- `src/app/(dashboard)/admin/cms/analytics/page.tsx`

Fitur:

- KPI total posts, published, draft, publication months.
- Breakdown by category.
- Breakdown by author.
- Monthly publication counts.

Hak akses:

- Page guard: `cms.view` atau `post.view`.

Catatan audit:

- Route ada dan guarded, tetapi tidak muncul di sidebar utama setelah refactor.
- Putuskan: tampilkan sebagai submenu Komdigi atau arsipkan jika tidak masuk scope.

### `/admin/events` - Kalender Kegiatan

Sumber:

- `src/app/(dashboard)/admin/events/page.tsx`
- `src/app/(dashboard)/admin/events/components/EventsManager.tsx`
- `src/app/(dashboard)/admin/events/new/page.tsx`
- `src/app/(dashboard)/admin/events/[id]/page.tsx`
- `src/app/(dashboard)/admin/events/[id]/components/StatusUpdater.tsx`
- `src/features/events/actions.ts`
- `src/features/events/services.ts`

Fitur:

- List/manager kalender kegiatan.
- Create event.
- Detail event.
- Update status.
- Delete event.
- Program relation.

Flow:

1. Sekretaris membuka kalender.
2. Tambah/edit kegiatan.
3. Status dapat diperbarui.
4. Detail menampilkan data kegiatan dan status updater.

Hak akses:

- Sidebar: `calendar.view`.
- Service:
  - Create: `event.create` atau `calendar.manage` atau `system.manage`
  - Update: `event.update` atau `calendar.manage` atau `system.manage`
  - Delete: `event.delete` atau `calendar.manage` atau `system.manage`
- Page belum terlihat guard eksplisit `calendar.view`.

Catatan UI/UX:

- Status sebaiknya berupa dropdown reversible, bukan hanya tombol satu arah.
- Pastikan semua revalidate memakai `/admin/events` dan detail route terkait.
- Untuk Sekretaris, LPJ jangan difokuskan di detail kalender kecuali kebutuhan berubah.

### `/admin/announcements` - Pengumuman + WA Blast

Sumber:

- `src/app/(dashboard)/admin/announcements/page.tsx`
- `src/app/(dashboard)/admin/announcements/new/page.tsx`
- `src/features/announcements/actions.ts`
- `src/features/announcements/services.ts`

Fitur:

- List pengumuman.
- Draft/publish state.
- Publish & Blast WA.
- Delete pengumuman.

Flow:

1. Sekretaris membuat pengumuman.
2. Pengumuman dapat disimpan draft atau langsung publish.
3. Publish menjalankan WA blast ke user aktif.
4. Status WA tampil sebagai `WA Terkirim`.

Hak akses:

- Sidebar: `announcement.view`.
- Seed: Sekretaris punya `announcement.view` dan `announcement.manage`.
- Page belum terlihat guard eksplisit.

Catatan UI/UX:

- Ini satu dari dua trigger WA yang diizinkan AGENTS.
- Perlu preview penerima/jumlah kontak sebelum blast.
- Perlu konfirmasi sebelum `Publish & Blast WA`.

### `/admin/letters` - Persuratan

Sumber:

- `src/app/(dashboard)/admin/letters/page.tsx`
- `src/app/(dashboard)/admin/letters/components/LetterBoard.tsx`
- `src/app/(dashboard)/admin/letters/components/LetterForm.tsx`
- `src/features/letters/actions.ts`

Fitur:

- Surat masuk/keluar.
- Filter type `IN`/`OUT`.
- Search.
- Create letter.
- Upload document.
- Delete letter.

Hak akses:

- Page guard: `letter.view`.
- Action/service:
  - Create/upload/delete saat ini menggunakan `letter.create` untuk create/upload dan `letter.delete` untuk delete.

Catatan UI/UX:

- Sudah cukup selaras untuk Sekretaris.
- Upload dokumen dan metadata surat sebaiknya satu flow modal/bottom sheet.

### `/admin/documents` - Arsip Dokumen

Sumber:

- `src/app/(dashboard)/admin/documents/page.tsx`
- `src/app/(dashboard)/admin/documents/components/DocumentArchiveBoard.tsx`
- `src/app/(dashboard)/admin/documents/components/DocumentArchiveForm.tsx`
- `src/features/document-archives/actions.ts`

Fitur:

- Arsip dokumen internal.
- Filter kategori.
- Search.
- Upload dokumen.
- Delete dokumen.

Hak akses:

- Page guard: `letter.view`.
- Action/service create memakai `letter.create`, update/upload memakai `letter.update`/`letter.create`, delete memakai `letter.delete`.

Catatan UI/UX:

- Secara IA masih memakai permission letter, bukan permission dokumen khusus.
- Bisa tetap diterima jika dianggap bagian dari Sekretaris, tetapi label permission di matrix perlu jelas.

### `/admin/management` - Manajemen Pengurus

Sumber:

- `src/app/(dashboard)/admin/management/page.tsx`
- `src/app/(dashboard)/admin/management/[id]/page.tsx`
- `src/app/(dashboard)/admin/management/[id]/components/PengurusEditor.tsx`
- `src/features/management/actions.ts`

Fitur:

- List pengurus dikelompokkan departemen.
- Card click menuju detail/edit.
- Edit nama, jabatan, departemen, status aktif, WA, foto.
- Remove pengurus secara soft: clear position/department dan nonaktif.

Hak akses:

- Sidebar: `user.view`.
- Detail page guard: `user.update`.
- List page belum terlihat guard eksplisit `user.view`.

Catatan UI/UX:

- Sesuai AGENTS: pengurus semua departemen tetap dikelola Sekretaris, walau departemen dipangkas tidak jadi modul aktif.
- Copy `aktif & demisioner` sudah cocok.
- Perlu bedakan aksi `Nonaktifkan dari pengurus` vs `Hapus permanen`, karena action saat ini bukan hard delete.

### `/admin/registrations` - Anggota Baru

Sumber:

- `src/app/(dashboard)/admin/registrations/page.tsx`
- `src/features/registration/actions.ts`

Fitur:

- List pendaftar dari form publik.
- Search nama/kampus.
- Status pending/processed.
- Tandai diproses.

Hak akses:

- Sidebar: `registration.view`.
- Action mark processed: `registration.review`.
- Page belum terlihat guard eksplisit.

Gap scope:

- UI masih memakai copy `Pendaftaran Kader`, `Review pendaftar baru`, dan `proses kaderisasi`.
- AGENTS menyatakan anggota baru mendaftar tanpa akun, otomatis dapat link WA, tercatat di dashboard Sekretaris sebagai arsip, tanpa approval.

Rekomendasi UI/UX:

- Ganti judul menjadi `Anggota Baru`.
- Ganti deskripsi menjadi `Arsip pendaftar dari form publik dan status tindak lanjut WhatsApp`.
- Ubah aksi dari `Tandai Diproses` menjadi copy netral seperti `Tandai Sudah Ditindaklanjuti`.
- Hilangkan kata `kaderisasi`.

### `/admin/finance` - Buku Kas / Iuran

Sumber:

- `src/app/(dashboard)/admin/finance/page.tsx`
- `src/app/(dashboard)/admin/finance/new/page.tsx`
- `src/features/finance/actions.ts`

Fitur:

- KPI pemasukan, pengeluaran, saldo.
- List transaksi.
- Catat transaksi.
- Hapus transaksi.
- Proof URL.

Hak akses:

- Sidebar: `finance.view`.
- Seed Bendahara: `finance.view`, `finance.create`, `cashbook.view`, `cashbook.manage`.
- Page belum terlihat guard eksplisit `finance.view`.

Catatan UI/UX:

- Copy `Buku Iuran (Keuangan)` perlu diputuskan: jika ini buku kas umum, gunakan `Buku Kas`; jika khusus iuran, pisahkan label.
- Card saldo mobile sudah compact, tetapi table transaksi di mobile masih perlu alternatif card jika data melebar.

### `/admin/finance/tokens` - LPJ Token

Sumber:

- `src/app/(dashboard)/admin/finance/tokens/page.tsx`
- `src/app/(dashboard)/admin/finance/tokens/new/page.tsx`
- `src/features/lpj-token/actions.ts`

Fitur:

- List token.
- Status aktif/used/expired.
- Tampilkan token aktif.
- Generate token baru.

Hak akses:

- Sidebar: `lpj_token.manage`.
- Action generate harus dikaitkan dengan `lpj_token.manage`.
- Page belum terlihat guard eksplisit.

Catatan UI/UX:

- Token tampil plaintext untuk token aktif. Tambahkan copy button dan masking opsional.
- Tambahkan warning expired/sekali pakai.

### `/admin/reports` dan `/admin/reports/[id]` - LPJ Module

Sumber:

- `src/app/(dashboard)/admin/reports/page.tsx`
- `src/app/(dashboard)/admin/reports/[id]/page.tsx`
- `src/app/(dashboard)/admin/reports/components/LpjForm.tsx`
- `src/app/(dashboard)/admin/reports/components/LpjViewer.tsx`
- `src/app/(dashboard)/admin/reports/[id]/components/ReportActions.tsx`
- `src/features/reports/actions.ts`
- `src/features/reports/services.ts`

Fitur:

- List LPJ.
- Viewer dokumen.
- Submit LPJ untuk event tanpa report.
- Detail LPJ.
- Verify/reject LPJ.

Hak akses:

- Sidebar: `lpj.view`.
- Seed Bendahara: `lpj.view`, `lpj.verify_bph`.
- User: `lpj.submit`, `lpj_token.use`.

Gap:

- Page reports tidak terlihat guard eksplisit `lpj.view`.
- Detail page dan service memakai `lpj.verify`, tetapi seed permission yang ada adalah `lpj.verify_department` dan `lpj.verify_bph`.
- Flow submit LPJ via token untuk user belum terlihat sebagai route/menu khusus di dashboard.

Rekomendasi UI/UX:

- Pisahkan mode Bendahara `Review LPJ` dari mode User `Submit LPJ via Token`.
- Selaraskan permission `lpj.verify` vs `lpj.verify_bph`.

### `/admin/system/audit-logs` - Audit Logs

Sumber:

- `src/app/(dashboard)/admin/system/audit-logs/page.tsx`

Fitur:

- List audit logs.
- Filter entity.
- Pagination.
- Diff old/new data.

Hak akses:

- Page guard saat ini: `session.user.roleId === 'super_admin'`.
- Sidebar permission: `audit.view`.
- Seed memberi `audit.view` ke super admin lewat all permissions.

Catatan UI/UX:

- Guard role hardcoded cukup jelas untuk Super Admin, tetapi bisa diselaraskan ke `can('audit.view')` agar konsisten dengan sidebar.

### `/admin/programs` - Program Kerja

Sumber:

- `src/app/(dashboard)/admin/programs/**`
- `src/features/programs/**`

Fitur:

- List program.
- Create/update/delete program.
- Detail program.
- Activity list.
- Event list.

Hak akses:

- Permission seed masih punya `program.*` dan `event.*`.
- Sidebar utama tidak menampilkan Program Kerja.
- Beberapa action masih revalidate `/dashboard/programs`, bukan `/admin/programs`.

Catatan scope:

- Public domain masih punya Event & Program Kerja.
- Internal AGENTS untuk Sekretaris menekankan Kalender Kegiatan; Program Kerja internal perlu diputuskan apakah masih aktif, read-only, atau legacy helper.

### `/admin/notifications` - Notifications

Sumber:

- `src/app/(dashboard)/admin/notifications/page.tsx`
- `src/features/notifications/**`

Fitur:

- Notification list/preferences/analytics style.

Catatan scope:

- AGENTS menyatakan Notification Center terpusat dihapus dari scope.
- Route masih ada, tetapi tidak muncul di sidebar utama.

Rekomendasi:

- Jika tidak dipakai, arsipkan/hapus route dari dashboard.
- Jika masih dibutuhkan untuk dropdown internal, jangan tampilkan sebagai module publik dashboard.

### Redirect Legacy

Route redirect:

- `/dashboard` -> `/admin`
- `/users` -> `/admin/users`
- `/users/create` -> `/admin/users/create`
- `/registrations` -> `/admin/registrations`
- `/admin/media` -> `/admin/cms/media`

Catatan UI/UX:

- Redirect membantu kompatibilitas.
- Pastikan semua link baru memakai route canonical `/admin/...`.

## Matrix Hak Akses Per Role

Legenda:

- `Full` = akses penuh/bypass atau semua action modul.
- `Manage` = create/update/delete/publish sesuai permission.
- `View` = read/list/detail.
- `Submit` = submit khusus user.
- `-` = tidak seharusnya tampil.
- `Gap` = permission/flow ada sebagian, tetapi UI belum utuh atau guard tidak konsisten.

| Modul / Menu | Route Utama | Super Admin | Komdigi | Sekretaris | Bendahara | User |
|---|---|---:|---:|---:|---:|---:|
| Dashboard | `/admin` | Full | View role dashboard | View role dashboard | View role dashboard | Gap |
| Manajemen User | `/admin/users` | Full | - | View/Update pengurus via `user.view/update` | - | - |
| LPJ Token | `/admin/finance/tokens` | Full | - | - | Manage | - |
| Audit Logs | `/admin/system/audit-logs` | Full | - | - | - | - |
| Landing Page / Web Config | `/admin/cms/settings` | Full | Manage | - | - | - |
| Content Plan | `/admin/cms/content-plan` | Full | Manage | - | - | - |
| Blog & Artikel | `/admin/cms/posts` | Full | Manage/Publish | - | - | Submit permission ada, UI belum khusus |
| Kategori Artikel | `/admin/cms/categories` | Full | Manage | - | - | - |
| Media Library | `/admin/cms/media` | Full | Manage | - | - | - |
| Kalender Kegiatan | `/admin/events` | Full | - | Manage | - | View permission ada, UI belum read-only |
| Pengumuman | `/admin/announcements` | Full | - | Manage + WA Blast | - | View permission ada, UI belum read-only |
| Persuratan | `/admin/letters` | Full | - | Manage | - | - |
| Arsip Dokumen | `/admin/documents` | Full | - | Manage via letter permissions | - | - |
| Manajemen Pengurus | `/admin/management` | Full | - | Manage pengurus | - | - |
| Anggota Baru | `/admin/registrations` | Full | - | View/Review | - | - |
| Buku Kas | `/admin/finance` | Full | - | - | Manage | Financial report view ada, UI belum read-only |
| LPJ Module | `/admin/reports` | Full | - | - | Manage/Verify | Submit/token permission ada, UI belum khusus |
| Program Kerja | `/admin/programs` | Full | - | Gap/legacy | Gap/legacy | - |
| Notification Center | `/admin/notifications` | Legacy | Legacy | Legacy | Legacy | Legacy |
| Profil Saya | `/dashboard/profile` | Own profile | Own profile | Own profile | Own profile | Own profile |

## Risiko dan Gap Prioritas

### Prioritas Tinggi

1. Tambahkan guard permission eksplisit di semua page admin utama.

   Route yang perlu dicek:

   - `/admin/users`
   - `/admin/users/create`
   - `/admin/cms/posts`
   - `/admin/cms/posts/create`
   - `/admin/cms/posts/[id]`
   - `/admin/cms/content-plan`
   - `/admin/events`
   - `/admin/events/new`
   - `/admin/events/[id]`
   - `/admin/announcements`
   - `/admin/announcements/new`
   - `/admin/management`
   - `/admin/registrations`
   - `/admin/finance`
   - `/admin/finance/new`
   - `/admin/finance/tokens`
   - `/admin/finance/tokens/new`
   - `/admin/reports`

2. Selaraskan permission LPJ verify.

   Saat ini ada pemakaian `lpj.verify`, tetapi seed menggunakan `lpj.verify_department` dan `lpj.verify_bph`.

3. Selesaikan RBAC pada `src/features/users/actions.ts`.

   File ini masih memuat TODO RBAC check untuk action user.

4. Bersihkan copy lama terkait kaderisasi.

   Ganti:

   - `Pendaftaran Kader`
   - `Review pendaftar baru`
   - `proses kaderisasi`
   - link `/register`

   Menjadi copy anggota baru sesuai AGENTS:

   - `Anggota Baru`
   - `Arsip pendaftar dari form publik`
   - `Tindak lanjut WhatsApp`
   - link `/gabung`

5. Putuskan status `/admin/notifications`.

   Karena Notification Center terpusat dihapus dari scope, route ini perlu dihapus/diarsipkan atau dijelaskan sebagai internal dropdown-only.

### Prioritas Menengah

1. Buat dashboard User yang benar-benar read-only dan action-specific.

   Menu user yang perlu ada:

   - Kalender read only
   - Pengumuman read only
   - Keuangan read only
   - Request pamflet
   - Submit karya tulis
   - Submit LPJ via token
   - Edit profil

2. Ubah Content Plan menjadi grid bulanan.

   Gunakan parameter `month` yang sudah ada. Tambahkan:

   - calendar grid per tanggal
   - filter bulan jelas
   - status dropdown reversible
   - quick create bottom sheet

3. Perjelas IA Bendahara.

   Pisahkan:

   - Buku Kas
   - Laporan Keuangan
   - LPJ Inbox/Review
   - LPJ Token
   - Arsip LPJ

4. Jadikan action berisiko memakai confirmation.

   Contoh:

   - Publish & Blast WA
   - Delete pengumuman
   - Delete user
   - Delete document/letter/media/post
   - Nonaktifkan pengurus

5. Rapikan empty state dan pagination.

   Beberapa pagination masih visual-only disabled button tanpa link nyata. Untuk UX, tombol pagination harus navigasi query page.

### Prioritas Rendah

1. Satukan label `Buku Iuran`, `Buku Kas`, dan `Keuangan`.
2. Tambahkan breadcrumbs di detail/create pages.
3. Tambahkan “last updated” atau audit mini di modul administrasi penting.
4. Tambahkan preview publik pada CMS settings/post/content plan.
5. Kurangi penggunaan table di mobile dengan cards/action sheets.

## Rekomendasi Struktur UI/UX Baru

### Super Admin

Desktop:

- Overview
- User & Role
- LPJ Token
- Audit Logs
- Read access per divisi

Mobile:

- Drawer semua modul
- Dashboard cards lintas divisi
- Search cepat modul

### Komdigi

Menu utama:

- Dashboard Komdigi
- Landing Page
- Content Plan
- Blog & Artikel
- Kategori
- Media Library
- Preview Website

Flow utama:

1. Buat content plan.
2. Buat draft artikel/konten.
3. Upload media.
4. Publish artikel.
5. Review tampilan publik.

UI improvement:

- Content plan kalender bulanan.
- Blog workflow board per status.
- Media picker reusable.
- Web Config memakai tab/accordion.

### Sekretaris

Menu utama:

- Dashboard Sekretaris
- Kalender Kegiatan
- Pengumuman
- Persuratan
- Arsip Dokumen
- Manajemen Pengurus
- Anggota Baru

Flow utama:

1. Kelola jadwal kegiatan.
2. Buat pengumuman dan blast WA.
3. Catat surat masuk/keluar.
4. Arsipkan dokumen.
5. Kelola struktur pengurus.
6. Pantau arsip pendaftar dari form publik.

UI improvement:

- Kalender dengan list+calendar toggle.
- Detail kegiatan modal/bottom sheet.
- Status kegiatan dropdown reversible.
- Form surat/dokumen modal.
- Anggota Baru sebagai arsip, bukan approval kaderisasi.

### Bendahara

Menu utama:

- Dashboard Bendahara
- Buku Kas
- Laporan Keuangan
- LPJ Inbox
- Generate LPJ Token
- Arsip LPJ

Flow utama:

1. Catat pemasukan/pengeluaran.
2. Upload bukti transaksi.
3. Generate token LPJ.
4. Review LPJ masuk.
5. Verifikasi/tolak LPJ.
6. Export laporan keuangan.

UI improvement:

- Ringkasan kas sticky.
- Transaction card mobile.
- Token copy/mask.
- LPJ inbox filter status.

### User

Menu utama:

- Beranda Anggota
- Kalender
- Pengumuman
- Keuangan
- Request Pamflet
- Karya Tulis
- Submit LPJ Token
- Profil

Flow utama:

1. User login.
2. Melihat kalender/pengumuman/keuangan read-only.
3. Submit request pamflet atau karya tulis.
4. Submit LPJ menggunakan token sekali pakai.
5. Edit profil.

UI improvement:

- Jangan arahkan user umum ke page admin yang punya affordance create/delete.
- Buat page user-facing yang read-only atau action-specific.

## Checklist Perbaikan UI/UX

### Navigasi dan IA

- [ ] Pastikan semua menu yang tampil punya route dan guard yang sama.
- [ ] Sembunyikan route legacy yang tidak masuk scope.
- [ ] Buat subnav role-specific di dashboard mobile.
- [ ] Tambahkan breadcrumbs pada create/detail pages.
- [ ] Pastikan label modul sama antara desktop, mobile, dan dashboard quick action.

### Permission dan Guard

- [ ] Tambahkan helper page guard per permission.
- [ ] Terapkan guard di semua route admin.
- [ ] Selaraskan `lpj.verify` dengan `lpj.verify_bph`.
- [ ] Selesaikan TODO RBAC di user actions.
- [ ] Buat test role-to-route untuk route utama.

### Copy dan Scope

- [ ] Hapus copy `kaderisasi` dari anggota baru.
- [ ] Hapus/arsipkan Notification Center terpusat.
- [ ] Hindari label departemen dipangkas sebagai modul aktif.
- [ ] Ubah `Buku Iuran (Keuangan)` menjadi istilah final.
- [ ] Konsisten menggunakan `IKMI Cirebon` dan `IKMI Se-Wilayah Cirebon`.

### Mobile UX

- [ ] Form besar menjadi modal/bottom sheet.
- [ ] Table admin punya card mobile.
- [ ] Action berisiko punya confirmation.
- [ ] Bottom nav tidak memotong fitur utama role.
- [ ] Tombol tambah memakai FAB hanya jika konteks jelas.

### Modul Komdigi

- [ ] Content plan grid bulanan.
- [ ] Blog workflow board.
- [ ] Media picker reusable.
- [ ] Web config tab/accordion.
- [ ] Preview publik setelah save.

### Modul Sekretaris

- [ ] Calendar/list toggle.
- [ ] Status event dropdown reversible.
- [ ] Detail event modal/bottom sheet.
- [ ] Surat/dokumen modal-oriented.
- [ ] Anggota Baru sebagai arsip tanpa approval flow.

### Modul Bendahara

- [ ] LPJ inbox dipisah dari submit form user.
- [ ] Token copy/masking/expiry warning.
- [ ] Export laporan keuangan.
- [ ] Transaction card mobile.
- [ ] Filter transaksi per periode/type.

## Rekomendasi Urutan Sprint UI/UX

1. Sprint 1 - Hardening akses dan copy scope

   Fokus:

   - Page guard semua route admin.
   - Permission LPJ verify.
   - Users actions RBAC.
   - Copy Anggota Baru.
   - Arsipkan Notification Center jika tidak dipakai.

2. Sprint 2 - Dashboard mobile per role

   Fokus:

   - Komdigi, Sekretaris, Bendahara quick action final.
   - User dashboard read-only/action-specific.
   - Bottom nav per role.

3. Sprint 3 - Modul Sekretaris

   Fokus:

   - Kalender Kegiatan.
   - Pengumuman + WA Blast.
   - Persuratan.
   - Arsip Dokumen.
   - Manajemen Pengurus.
   - Anggota Baru.

4. Sprint 4 - Modul Komdigi

   Fokus:

   - CMS Landing Page.
   - Content Plan grid bulanan.
   - Blog workflow.
   - Media Library.

5. Sprint 5 - Modul Bendahara dan User

   Fokus:

   - Buku Kas.
   - Laporan Keuangan.
   - LPJ Review.
   - LPJ Token.
   - User Submit LPJ via token.

## Catatan Verifikasi Audit

Audit ini berbasis pembacaan kode statis, bukan walkthrough browser per role. Validasi visual dan flow nyata masih perlu dilakukan dengan akun masing-masing role:

- Super Admin
- Admin Komdigi
- Admin Sekretaris
- Admin Bendahara
- User

Quality gate yang disarankan setelah perbaikan:

- `npm run lint`
- `npm run build`
- role-based route smoke test
- browser QA mobile/desktop untuk route utama
- verifikasi DB permission seed

