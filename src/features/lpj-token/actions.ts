'use server'

import { requirePermission } from '@/core/authorization/guards'
import { revalidatePath } from 'next/cache'
import { safeActionError } from '@/core/errors/safe-action-error'
import { lpjTokenRepository } from './repository'
import { lpjTokenService } from './services'
import { generateLpjTokenSchema, GenerateLpjTokenInput } from './schemas'

export async function generateLpjTokenAction(input: GenerateLpjTokenInput) {
  try {
    const actor = await requirePermission('lpj_token.manage')
    const validated = generateLpjTokenSchema.parse(input)
    const token = await lpjTokenService.generateToken(validated, actor.id)

    revalidatePath('/admin/finance/tokens')
    return { success: true, token: token.token, id: token.id }
  } catch (error) {
    return { error: safeActionError(error, 'Token LPJ belum dapat dibuat.', 'lpj_token.create') }
  }
}

export async function validateLpjTokenAction(token: string) {
  return lpjTokenRepository.validate(token)
}
