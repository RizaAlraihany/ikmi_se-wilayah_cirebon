import type { RegStatus } from '@prisma/client'

export const REGISTRATION_STATUS_LABELS: Record<RegStatus, string> = {
  NEW: 'Baru', NEEDS_VERIFICATION: 'Butuh Verifikasi', INCOMPLETE: 'Belum Lengkap', CONTACTED: 'Sudah Dihubungi', VERIFIED: 'Terverifikasi', PRABUMI_PARTICIPANT: 'Peserta PRABUMI', PASSED: 'Lulus', ACTIVE_MEMBER: 'Anggota Aktif', REJECTED: 'Ditolak', INACTIVE: 'Tidak Aktif', ALUMNI: 'Alumni',
}

export const REGISTRATION_STATUS_TONES: Record<RegStatus, 'surface' | 'warning' | 'accent' | 'success' | 'danger'> = {
  NEW: 'surface', NEEDS_VERIFICATION: 'warning', INCOMPLETE: 'warning', CONTACTED: 'accent', VERIFIED: 'accent', PRABUMI_PARTICIPANT: 'accent', PASSED: 'success', ACTIVE_MEMBER: 'success', REJECTED: 'danger', INACTIVE: 'surface', ALUMNI: 'surface',
}

export const REGISTRATION_TRANSITIONS: Record<RegStatus, RegStatus[]> = {
  NEW: ['NEEDS_VERIFICATION', 'CONTACTED', 'REJECTED'], NEEDS_VERIFICATION: ['INCOMPLETE', 'CONTACTED', 'VERIFIED', 'REJECTED'], INCOMPLETE: ['CONTACTED', 'NEEDS_VERIFICATION', 'REJECTED'], CONTACTED: ['NEEDS_VERIFICATION', 'VERIFIED', 'REJECTED'], VERIFIED: ['PRABUMI_PARTICIPANT', 'REJECTED'], PRABUMI_PARTICIPANT: ['PASSED', 'REJECTED'], PASSED: ['ACTIVE_MEMBER', 'REJECTED'], ACTIVE_MEMBER: ['INACTIVE', 'ALUMNI'], REJECTED: [], INACTIVE: ['ACTIVE_MEMBER', 'ALUMNI'], ALUMNI: [],
}

export function canTransitionRegistration(from: RegStatus, to: RegStatus) {
  return REGISTRATION_TRANSITIONS[from]?.includes(to) ?? false
}
