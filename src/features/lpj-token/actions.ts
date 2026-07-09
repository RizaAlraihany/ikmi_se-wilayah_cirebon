'use server'

import { auth } from '@/core/auth/auth'
import { revalidatePath } from 'next/cache'
import { lpjTokenRepository } from './repository'
import { generateLpjTokenSchema, GenerateLpjTokenInput } from './schemas'

export async function generateLpjTokenAction(input: GenerateLpjTokenInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak atau sesi habis.' }

    const validated = generateLpjTokenSchema.parse(input)
    const token = await lpjTokenRepository.generate({
      activityName: validated.activityName,
      description: validated.description,
      expiredAt: validated.expiredAt,
      generatedBy: session.user.id,
    })

    revalidatePath('/admin/finance/tokens')
    return { success: true, token: token.token, id: token.id }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function validateLpjTokenAction(token: string) {
  return lpjTokenRepository.validate(token)
}
