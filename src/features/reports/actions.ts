'use server'

import { auth } from '@/core/auth/auth'
import { reportService } from './services'
import { ReportSubmitInput } from './schemas'
import { revalidatePath } from 'next/cache'

export async function submitReportAction(data: ReportSubmitInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await reportService.submitReport(data, session.user.id)
    revalidatePath('/dashboard/reports')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function verifyDepartmentReportAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await reportService.verifyDepartmentReport(id, session.user.id)
    revalidatePath('/dashboard/reports')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function verifyBphReportAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await reportService.verifyBphReport(id, session.user.id)
    revalidatePath('/dashboard/reports')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function rejectReportAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await reportService.rejectReport(id, session.user.id)
    revalidatePath('/dashboard/reports')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
