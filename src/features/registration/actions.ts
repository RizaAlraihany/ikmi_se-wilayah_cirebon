'use server'

import { registrationService } from './services'
import { registrationCreateSchema, RegistrationCreateInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { rateLimit } from '@/core/security/rate-limiter'


import { checkHoneypot, SpamError } from '@/core/security/anti-spam'
import type { RegStatus } from '@prisma/client'
import { requireRegistrationReviewAccess } from './access'
import { safeActionError } from '@/core/errors/safe-action-error'

export async function submitRegistrationAction(data: RegistrationCreateInput) {
  try {
    const parsed = registrationCreateSchema.parse(data)
    checkHoneypot(parsed.bot_field)

    const headerStore = await headers()
    const ip = headerStore.get('x-forwarded-for') || 'unknown-ip'
    await rateLimit(`register:${ip}`, 3, 3600) // Valid submissions only; invalid form attempts do not consume the limit.

    const registration = await registrationService.submitRegistration(parsed)
    revalidatePath('/admin/organization/registrations')
    return { success: true, registrationNumber: registration.registrationNumber }

  } catch (error) {
    if (error instanceof SpamError) return { error: 'Terdeteksi aktivitas spam' }
    return { error: safeActionError(error, 'Pendaftaran belum dapat disimpan.', 'registration.submit') }
  }
}

export async function updateRegistrationStatusAction(id: string, status: RegStatus) {
  try {
    const actor = await requireRegistrationReviewAccess()
    await registrationService.updateStatus(id, status, actor.id)
    revalidatePath('/admin/organization/registrations')
    revalidatePath(`/admin/organization/registrations/${id}`)
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Pendaftaran belum dapat diproses.', 'registration.review') }
  }
}
