import { z } from 'zod'
export { contactInfoSchema, type ContactInfoInput } from './contact-contract'

export const webConfigSchema = z.object({
  key: z.string().min(1, { message: 'Key tidak boleh kosong' }),
  valueJson: z.string(),
})

export type WebConfigInput = z.infer<typeof webConfigSchema>
