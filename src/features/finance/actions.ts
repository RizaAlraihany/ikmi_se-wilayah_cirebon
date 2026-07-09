'use server'

import { auth } from '@/core/auth/auth'
import { revalidatePath } from 'next/cache'
import { financeRepository } from './repository'
import { financeTransactionCreateSchema, FinanceTransactionCreateInput } from './schemas'

export async function createTransactionAction(input: FinanceTransactionCreateInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak atau sesi habis.' }

    const validated = financeTransactionCreateSchema.parse(input)

    await financeRepository.create({
      ...validated,
      proofUrl: validated.proofUrl || null,
      proofPublicId: validated.proofPublicId || null,
      createdBy: session.user.id,
    })

    revalidatePath('/admin/finance')
    revalidatePath('/dashboard/finance')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function deleteTransactionAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await financeRepository.softDelete(id, session.user.id)

    revalidatePath('/admin/finance')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
