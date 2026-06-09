'use server'

import { complaintService } from './services'
import { submitComplaintSchema, processComplaintSchema } from './schemas'
import { auth } from '@/core/auth/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { rateLimit } from '@/core/security/rate-limiter'
import { checkHoneypot, SpamError } from '@/core/security/anti-spam'

export async function submitComplaintAction(data: unknown) {
  try {
    const headerStore = await headers()
    const ip = headerStore.get('x-forwarded-for') || 'unknown-ip'
    await rateLimit(`complaint:${ip}`, 5, 3600) // max 5 per hour

    const parsed = submitComplaintSchema.parse(data)
    
    // Anti-spam
    checkHoneypot(parsed.bot_field)
    
    await complaintService.submitComplaint(parsed)
    return { success: true }
  } catch (error) {
    if (error instanceof SpamError) return { error: 'Terdeteksi aktivitas spam' }
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan saat mengirim aduan' }
  }
}

export async function processComplaintAction(id: string, data: unknown) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }

    const parsed = processComplaintSchema.parse(data)
    await complaintService.processComplaint(id, parsed, {
      id: session.user.id!,
      roleId: (session.user as { roleId: string }).roleId,
      departmentId: session.user.departmentId!,
    positionId: null
    })

    revalidatePath('/admin/complaints')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan saat memproses aduan' }
  }
}
