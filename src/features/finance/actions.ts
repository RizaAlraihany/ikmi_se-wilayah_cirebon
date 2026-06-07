'use server'

import { auth } from '@/core/auth/auth'
import { financeService } from './services'
import { FinanceRequestCreateInput } from './schemas'
import { revalidatePath } from 'next/cache'

export async function createFinanceRequestAction(data: FinanceRequestCreateInput) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.departmentId) {
      return { error: 'Akses ditolak atau sesi habis.' }
    }

    await financeService.createRequest(data, session.user.id, session.user.departmentId)
    revalidatePath('/dashboard/finance')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function approveTier1Action(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await financeService.approveTier1(id, session.user.id)
    revalidatePath('/dashboard/finance')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function approveTier2Action(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await financeService.approveTier2(id, session.user.id)
    revalidatePath('/dashboard/finance')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function rejectRequestAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await financeService.rejectRequest(id, session.user.id)
    revalidatePath('/dashboard/finance')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
