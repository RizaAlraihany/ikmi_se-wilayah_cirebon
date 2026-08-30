export type PrdV2ProgramDefinition = {
  targetProgramId: string
  acceptedLegacyNames?: readonly string[]
  createDescription?: string
  name: string
  organizationalUnitId: string
  plannedStart?: string
  plannedEnd?: string
  scheduleStatus?: string
  plannedBudget: string | null
  requiresRegistration: boolean | null
  registrationType: 'MEMBERSHIP_RECRUITMENT' | null
}

export type PrdV2AgendaDefinition = {
  id: string
  name: string
  organizationalUnitId: string
  scheduleType: 'FIXED_DATE' | 'RECURRING' | 'CONDITIONAL' | 'RELATIVE_TO_PROGRAM'
  startDatetime?: string
  endDatetime?: string
  recurrenceRule?: string
  relativeToProgramId?: string
  relativeOffset?: number
  conditionalNote?: string
}

export const PRD_V2_PERIOD = {
  id: 'prd_period_2026_2027',
  name: 'Kepengurusan 2026–2027',
  cabinetName: null,
  chairmanName: null,
  startDate: null,
  endDate: null,
  status: 'DRAFT',
} as const

export const PRD_V2_ORGANIZATIONAL_UNITS = [
  { id: 'BPH', name: 'Badan Pengurus Harian', code: 'BPH', email: 'ikmicirebon.bph@gmail.com', unitType: 'BPH' },
  { id: 'SEKRETARIAT', name: 'Sekretariat', code: 'SEKRETARIAT', email: 'ikmicirebon.sekretariat@gmail.com', unitType: 'SECRETARIAT' },
  { id: 'BENDAHARA', name: 'Bendahara', code: 'BENDAHARA', email: 'ikmicirebon.bendahara@gmail.com', unitType: 'TREASURY' },
  { id: 'KAD', name: 'Kaderisasi', code: 'KAD', email: 'ikmicirebon.kaderisasi@gmail.com', unitType: 'DEPARTMENT' },
  { id: 'KAJ', name: 'Kajian & Advokasi', code: 'KAJ', email: 'ikmicirebon.kajian@gmail.com', unitType: 'DEPARTMENT' },
  { id: 'PSDA', name: 'Pengembangan Sumber Daya Anggota', code: 'PSDA', email: 'ikmicirebon.psda@gmail.com', unitType: 'DEPARTMENT' },
  { id: 'EKRAF', name: 'Ekonomi Kreatif', code: 'EKRAF', email: 'ikmicirebon.ekraf@gmail.com', unitType: 'DEPARTMENT' },
  { id: 'KOMDIGI', name: 'Komunikasi & Digitalisasi', code: 'KOMDIGI', email: 'ikmicirebon.komdig@gmail.com', unitType: 'DEPARTMENT' },
  { id: 'HPM', name: 'Hubungan & Pengabdian Masyarakat', code: 'HPM', email: 'ikmicirebon.hupmas@gmail.com', unitType: 'DEPARTMENT' },
] as const

export const PRD_V2_PROGRAMS: readonly PrdV2ProgramDefinition[] = [
  {
    targetProgramId: 'prog_hpm_ikmi_sosial',
    acceptedLegacyNames: ['IKMI Sosial', 'IKMI SOSIAL'],
    name: 'IKMI SOSIAL',
    organizationalUnitId: 'HPM',
    plannedStart: '2026-06-28T00:00:00+07:00',
    plannedEnd: '2026-07-12T23:59:59+07:00',
    scheduleStatus: 'PLANNED_SOURCE',
    plannedBudget: '4500000',
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_kad_prabumi',
    acceptedLegacyNames: ['PRABUMI'],
    name: 'PRABUMI',
    organizationalUnitId: 'KAD',
    plannedStart: '2026-10-09T00:00:00+07:00',
    plannedEnd: '2026-10-11T23:59:59+07:00',
    scheduleStatus: 'PLANNED_SOURCE',
    plannedBudget: '20000000',
    requiresRegistration: true,
    registrationType: 'MEMBERSHIP_RECRUITMENT',
  },
  {
    targetProgramId: 'prog_kad_makrab',
    acceptedLegacyNames: ['MAKRAB'],
    name: 'MAKRAB',
    organizationalUnitId: 'KAD',
    plannedStart: '2026-11-14T00:00:00+07:00',
    plannedEnd: '2026-11-15T23:59:59+07:00',
    scheduleStatus: 'PLANNED_SOURCE',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_hpm_ikmi_dugawe',
    acceptedLegacyNames: ['IKMI Dugawe', 'IKMI DUGAWE'],
    name: 'IKMI DUGAWE',
    organizationalUnitId: 'HPM',
    scheduleStatus: 'DATE_REQUIRES_VERIFICATION: source lists 15 or 20 December 2026',
    plannedBudget: '6000000',
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prd_v2_kongres_ikmi',
    createDescription: 'Rangkaian LPJ, evaluasi, persidangan, rekomendasi, pemilihan Ketua Umum, dan penetapan hasil.',
    name: 'KONGRES IKMI',
    organizationalUnitId: 'BPH',
    scheduleStatus: 'CONDITIONAL: akhir periode; date requires verification',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_bph_rapat_pleno_1',
    acceptedLegacyNames: ['Rapat Pleno 1'],
    name: 'Rapat Pleno 1',
    organizationalUnitId: 'BPH',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_bph_pembukuan',
    acceptedLegacyNames: ['Pembukuan'],
    name: 'Pembukuan',
    organizationalUnitId: 'BENDAHARA',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_bph_iuran_uang_kegiatan',
    acceptedLegacyNames: ['Iuran Uang Kegiatan'],
    name: 'Pengelolaan Uang Iuran Kegiatan',
    organizationalUnitId: 'BENDAHARA',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_bph_laporan_keuangan',
    acceptedLegacyNames: ['Laporan Keuangan'],
    name: 'Laporan Keuangan',
    organizationalUnitId: 'BENDAHARA',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_kaj_diskusi_panel',
    acceptedLegacyNames: ['Diskusi Panel'],
    name: 'Diskusi Panel',
    organizationalUnitId: 'KAJ',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_psda_baskara',
    acceptedLegacyNames: ['BASKARA'],
    name: 'BASKARA',
    organizationalUnitId: 'PSDA',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_ekraf_kunjungan_industri',
    acceptedLegacyNames: ['Kunjungan Industri'],
    name: 'Kunjungan Industri',
    organizationalUnitId: 'EKRAF',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_ekraf_pembuatan_pdh',
    acceptedLegacyNames: ['Pembuatan PDH'],
    name: 'Pembuatan PDH dan Lanyard',
    organizationalUnitId: 'EKRAF',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
  {
    targetProgramId: 'prog_komdigi_company_profil_ikmi',
    acceptedLegacyNames: ['Company Profil IKMI'],
    name: 'Company Profile IKMI Cirebon',
    organizationalUnitId: 'KOMDIGI',
    plannedBudget: null,
    requiresRegistration: null,
    registrationType: null,
  },
]

export const PRD_V2_PROGRAM_RELATIONSHIPS = [
  {
    id: 'prd_rel_diskusi_panel_scheduled_with_ikmi_dugawe',
    sourceProgramId: 'prog_kaj_diskusi_panel',
    targetProgramId: 'prog_hpm_ikmi_dugawe',
    relationshipType: 'SCHEDULED_WITH',
    note: 'Hubungan jadwal dari PRD; tanggal pelaksanaan tetap memerlukan verifikasi.',
  },
  {
    id: 'prd_rel_kunjungan_industri_depends_on_ikmi_sosial',
    sourceProgramId: 'prog_ekraf_kunjungan_industri',
    targetProgramId: 'prog_hpm_ikmi_sosial',
    relationshipType: 'DEPENDS_ON',
    note: 'Ketergantungan program dari PRD; status pelaksanaan tidak diturunkan otomatis.',
  },
] as const

export const PRD_V2_AGENDAS: readonly PrdV2AgendaDefinition[] = [
  { id: 'prd_agenda_sekretariat_database', name: 'Database Anggota/Pengurus/Demisioner/Alumni', organizationalUnitId: 'SEKRETARIAT', scheduleType: 'FIXED_DATE', conditionalNote: 'Operational pada awal kepengurusan; tanggal belum tersedia.' },
  { id: 'prd_agenda_sekretariat_arsip_surat', name: 'Arsip Surat Masuk/Keluar', organizationalUnitId: 'SEKRETARIAT', scheduleType: 'CONDITIONAL', conditionalNote: 'Kondisional.' },
  { id: 'prd_agenda_sekretariat_koordinasi', name: 'Koordinasi Sekretaris', organizationalUnitId: 'SEKRETARIAT', scheduleType: 'CONDITIONAL', conditionalNote: 'Kondisional.' },
  { id: 'prd_agenda_sekretariat_rapat_evaluasi', name: 'Rapat Evaluasi', organizationalUnitId: 'SEKRETARIAT', scheduleType: 'RELATIVE_TO_PROGRAM', relativeOffset: 7, conditionalNote: 'H+7 setelah program terkait; program ditentukan saat penjadwalan.' },
  { id: 'prd_agenda_sekretariat_rapat_dwi_wulan', name: 'Rapat Dwi Wulan', organizationalUnitId: 'SEKRETARIAT', scheduleType: 'RECURRING', recurrenceRule: 'FREQ=MONTHLY;INTERVAL=2' },
  { id: 'prd_agenda_sekretariat_sosialisasi_sop', name: 'Sosialisasi SOP', organizationalUnitId: 'SEKRETARIAT', scheduleType: 'FIXED_DATE', conditionalNote: 'Awal kepengurusan; tanggal belum tersedia.' },
  { id: 'prd_agenda_sekretariat_organigram', name: 'Struktur Organigram', organizationalUnitId: 'SEKRETARIAT', scheduleType: 'FIXED_DATE', startDatetime: '2026-06-01T00:00:00+07:00', endDatetime: '2026-06-01T23:59:59+07:00' },
  { id: 'prd_agenda_sekretariat_kalender', name: 'Kalender Kegiatan', organizationalUnitId: 'SEKRETARIAT', scheduleType: 'RELATIVE_TO_PROGRAM', conditionalNote: 'Setelah Rapat Kerja; program rujukan belum ditetapkan.' },
  { id: 'prd_agenda_sekretariat_lpj_triwulan', name: 'LPJ Triwulan', organizationalUnitId: 'SEKRETARIAT', scheduleType: 'FIXED_DATE', startDatetime: '2026-09-04T00:00:00+07:00', endDatetime: '2026-09-05T23:59:59+07:00' },
  { id: 'prd_agenda_kaderisasi_ekspedisi_kampus', name: 'Ekspedisi Kampus', organizationalUnitId: 'KAD', scheduleType: 'RECURRING', recurrenceRule: 'FREQ=MONTHLY;INTERVAL=2' },
  { id: 'prd_agenda_kaderisasi_sapa_rasa', name: 'Sapa Rasa', organizationalUnitId: 'KAD', scheduleType: 'RECURRING', recurrenceRule: 'FREQ=MONTHLY;INTERVAL=1' },
  { id: 'prd_agenda_kajian_warlit', name: 'WARLIT', organizationalUnitId: 'KAJ', scheduleType: 'RECURRING', recurrenceRule: '2 kali per bulan; hari belum diverifikasi.' },
  { id: 'prd_agenda_kajian_refleksi_hari_besar', name: 'Refleksi Hari Besar', organizationalUnitId: 'KAJ', scheduleType: 'CONDITIONAL', conditionalNote: 'Sesuai hari besar.' },
  { id: 'prd_agenda_psda_cimanuk', name: 'CIMANUK', organizationalUnitId: 'PSDA', scheduleType: 'RECURRING', recurrenceRule: 'FREQ=MONTHLY;INTERVAL=4' },
  { id: 'prd_agenda_psda_reang', name: 'REANG', organizationalUnitId: 'PSDA', scheduleType: 'RECURRING', recurrenceRule: 'FREQ=MONTHLY;INTERVAL=1' },
  { id: 'prd_agenda_ekraf_pembukuan', name: 'Pembukuan Ekotif', organizationalUnitId: 'EKRAF', scheduleType: 'RECURRING', recurrenceRule: 'FREQ=MONTHLY;INTERVAL=1' },
  { id: 'prd_agenda_ekraf_penjualan', name: 'Penjualan Snack/Nasi Box', organizationalUnitId: 'EKRAF', scheduleType: 'CONDITIONAL', conditionalNote: 'Sesuai pesanan.' },
  { id: 'prd_agenda_ekraf_promosi_usaha', name: 'Promosi Usaha Anggota', organizationalUnitId: 'EKRAF', scheduleType: 'RECURRING', recurrenceRule: 'FREQ=MONTHLY;INTERVAL=3' },
  { id: 'prd_agenda_komdigi_medsos', name: 'Pengelolaan Media Sosial', organizationalUnitId: 'KOMDIGI', scheduleType: 'CONDITIONAL', conditionalNote: 'Kondisional dan berkelanjutan.' },
  { id: 'prd_agenda_komdigi_pelatihan', name: 'Pelatihan Internal', organizationalUnitId: 'KOMDIGI', scheduleType: 'CONDITIONAL', conditionalNote: 'Kondisional.' },
  { id: 'prd_agenda_komdigi_podcast', name: 'Podcast Lentera Ayu', organizationalUnitId: 'KOMDIGI', scheduleType: 'RECURRING', recurrenceRule: 'FREQ=MONTHLY;INTERVAL=3' },
  { id: 'prd_agenda_komdigi_kabar_indramayu', name: 'Kabar Indramayu', organizationalUnitId: 'KOMDIGI', scheduleType: 'CONDITIONAL', conditionalNote: 'Kondisional.' },
  { id: 'prd_agenda_hpm_ikmi_peduli', name: 'IKMI Peduli', organizationalUnitId: 'HPM', scheduleType: 'RECURRING', recurrenceRule: '3 kali per periode; tanggal belum diverifikasi.' },
  { id: 'prd_agenda_hpm_ngobor', name: 'NGOBOR', organizationalUnitId: 'HPM', scheduleType: 'CONDITIONAL', conditionalNote: 'Kondisional.' },
  { id: 'prd_agenda_hpm_sospen', name: 'SOSPEN', organizationalUnitId: 'HPM', scheduleType: 'CONDITIONAL', conditionalNote: 'Kondisional.' },
]

export type LegacyEventReview = {
  eventId: string
  legacyProgramId: string | null
  classification: 'PROGRAM_OCCURRENCE_REQUIRES_REVIEW' | 'UNMAPPED_LEGACY_EVENT_REQUIRES_REVIEW'
}

export function classifyLegacyEvents(events: readonly { id: string; programId: string | null }[]): LegacyEventReview[] {
  const masterProgramIds = new Set(PRD_V2_PROGRAMS.map((program) => program.targetProgramId))

  return events.map((event) => ({
    eventId: event.id,
    legacyProgramId: event.programId,
    classification: masterProgramIds.has(event.programId ?? '')
      ? 'PROGRAM_OCCURRENCE_REQUIRES_REVIEW'
      : 'UNMAPPED_LEGACY_EVENT_REQUIRES_REVIEW',
  }))
}

export function validatePrdV2MasterData() {
  const programIds = new Set(PRD_V2_PROGRAMS.map((program) => program.targetProgramId))
  const agendaIds = new Set(PRD_V2_AGENDAS.map((agenda) => agenda.id))
  const organizationalUnitIds = new Set<string>(PRD_V2_ORGANIZATIONAL_UNITS.map((unit) => unit.id))

  if (PRD_V2_PROGRAMS.length !== 14 || PRD_V2_AGENDAS.length !== 25) {
    throw new Error('Master data PRD harus berisi 14 Program dan 25 Agenda.')
  }

  if (programIds.size !== PRD_V2_PROGRAMS.length || agendaIds.size !== PRD_V2_AGENDAS.length) {
    throw new Error('ID master data PRD harus unik.')
  }

  if (organizationalUnitIds.size !== 9) {
    throw new Error('Master data PRD harus memuat 9 unit organisasi.')
  }

  if (PRD_V2_PROGRAMS.some((program) => program.plannedBudget === '0')) {
    throw new Error('Anggaran yang belum diketahui tidak boleh dimigrasikan sebagai 0.')
  }

  if (PRD_V2_AGENDAS.some((agenda) => !organizationalUnitIds.has(agenda.organizationalUnitId))) {
    throw new Error('Setiap Agenda harus menunjuk unit organisasi yang dikenal.')
  }
}
