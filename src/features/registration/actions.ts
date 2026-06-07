'use server'

import { auth } from '@/core/auth/auth'
import { registrationService } from './services'
import { registrationCreateSchema, RegistrationCreateInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { rateLimit } from '@/core/security/rate-limiter'
import { can } from '@/core/authorization/rbac'
import { checkHoneypot, SpamError } from '@/core/security/anti-spam'

export async function submitRegistrationAction(data: RegistrationCreateInput) {
  try {
    const headerStore = await headers()
    const ip = headerStore.get('x-forwarded-for') || 'unknown-ip'
    await rateLimit(`register:${ip}`, 3, 3600) // max 3 per hour

    const parsed = registrationCreateSchema.parse(data)
    
    // Anti-spam check
    checkHoneypot(parsed.bot_field)
    
    await registrationService.submitRegistration(parsed)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Format isian pendaftaran tidak valid' }
    if (error instanceof SpamError) return { error: 'Terdeteksi aktivitas spam' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan saat menyimpan formulir' }
    return { error: 'Terjadi kesalahan saat menyimpan formulir' }
  }
}

export async function reviewRegistrationAction(id: string, status: 'APPROVED' | 'REJECTED') {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await can('registration.review', { 
      id: session.user.id, 
      roleId: (session.user as { roleId: string }).roleId, 
      departmentId: session.user.departmentId! 
    }))) {
      return { error: 'Anda tidak memiliki akses untuk melakukan aksi ini' }
    }
    
    await registrationService.reviewRegistration(id, status, session.user.id)
    revalidatePath('/dashboard/registrations')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan saat memproses pendaftaran' }
    return { error: 'Terjadi kesalahan saat memproses pendaftaran' }
  }
}
