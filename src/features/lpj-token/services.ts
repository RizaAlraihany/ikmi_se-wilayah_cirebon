import { requirePermissionForUser } from '@/core/authorization/guards'
import { generateLpjTokenSchema, type GenerateLpjTokenInput } from './schemas'
import { lpjTokenRepository } from './repository'

export const lpjTokenService = {
  async generateToken(input: GenerateLpjTokenInput, userId: string) {
    await requirePermissionForUser(userId, 'lpj_token.manage')
    const validated = generateLpjTokenSchema.parse(input)
    return lpjTokenRepository.generate({
      activityName: validated.activityName,
      description: validated.description,
      expiredAt: validated.expiredAt,
      generatedBy: userId,
    })
  },
}
