import { defineConfig } from 'prisma/config'
import { existsSync } from 'node:fs'
import process from 'node:process'

if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
})
