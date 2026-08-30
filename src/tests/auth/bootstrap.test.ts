import { assertDevelopmentSeedAllowed } from '../../../prisma/bootstrap'

describe('development seed safety', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalAllowed = process.env.ALLOW_DEVELOPMENT_SEED
  const originalPassword = process.env.DEV_SEED_PASSWORD

  afterEach(() => {
    Reflect.set(process.env, 'NODE_ENV', originalNodeEnv)
    process.env.ALLOW_DEVELOPMENT_SEED = originalAllowed
    process.env.DEV_SEED_PASSWORD = originalPassword
  })

  it('never permits development seed credentials in production', () => {
    Reflect.set(process.env, 'NODE_ENV', 'production')
    process.env.ALLOW_DEVELOPMENT_SEED = 'true'
    process.env.DEV_SEED_PASSWORD = 'password-development-only'

    expect(assertDevelopmentSeedAllowed).toThrow('Development seed cannot run in production')
  })

  it('requires an explicit development-only flag and a non-default password', () => {
    Reflect.set(process.env, 'NODE_ENV', 'development')
    process.env.ALLOW_DEVELOPMENT_SEED = 'false'
    process.env.DEV_SEED_PASSWORD = 'password-development-only'
    expect(assertDevelopmentSeedAllowed).toThrow('ALLOW_DEVELOPMENT_SEED=true')

    process.env.ALLOW_DEVELOPMENT_SEED = 'true'
    process.env.DEV_SEED_PASSWORD = 'short'
    expect(assertDevelopmentSeedAllowed).toThrow('minimal 12 karakter')
  })
})
