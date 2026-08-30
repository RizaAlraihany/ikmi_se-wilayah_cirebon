import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL wajib diisi'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET minimal 32 karakter'),
  CRON_SECRET: z.string().min(32, 'CRON_SECRET minimal 32 karakter'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME wajib diisi'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY wajib diisi'),
  CLOUDINARY_API_SECRET: z.string().min(16, 'CLOUDINARY_API_SECRET minimal 16 karakter'),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  WA_CONTENT_PLAN_TARGET: z.string().trim().min(1).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('❌ Variabel Environment (ENV) tidak valid:', _env.error.format())
  throw new Error('Validasi Environment Variables gagal.')
}

export const env = _env.data
