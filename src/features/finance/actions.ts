'use server'

import { requirePermission } from '@/core/authorization/guards'
import { revalidatePath } from 'next/cache'
import { safeActionError } from '@/core/errors/safe-action-error'
import { financeService } from './services'
import { financeTransactionCreateSchema, FinanceTransactionCreateInput } from './schemas'

export async function createTransactionAction(input: FinanceTransactionCreateInput) {
  try {
    const actor = await requirePermission('finance.create')
    const validated = financeTransactionCreateSchema.parse(input)
    await financeService.createTransaction(validated, actor.id)

    revalidatePath('/admin/finance')
    revalidatePath('/dashboard/finance')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Transaksi belum dapat dibuat.', 'finance.create') }
  }
}

export async function deleteTransactionAction(id: string) {
  try {
    const actor = await requirePermission('finance.create')
    await financeService.deleteTransaction(id, actor.id)

    revalidatePath('/admin/finance')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Transaksi belum dapat disetujui.', 'finance.approve') }
  }
}
