import '@testing-library/jest-dom'

Reflect.set(process.env, 'NODE_ENV', 'test')
Reflect.set(process.env, 'WA_DEBUG', 'false')
delete process.env.FONNTE_TOKEN
delete process.env.UPSTASH_REDIS_REST_URL
delete process.env.UPSTASH_REDIS_REST_TOKEN

jest.mock('next-auth', () => {
  class AuthError extends Error {
    type = 'AuthError'
  }

  class CredentialsSignin extends AuthError {
    type = 'CredentialsSignin'
    code = 'credentials'
  }

  return {
    __esModule: true,
    AuthError,
    CredentialsSignin,
    default: jest.fn(() => ({
      auth: jest.fn(),
      handlers: { GET: jest.fn(), POST: jest.fn() },
      signIn: jest.fn(),
      signOut: jest.fn(),
    })),
  }
})

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn((config) => config),
}))

jest.mock('@upstash/redis', () => {
  const createClient = () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })

  return {
    Redis: Object.assign(jest.fn(createClient), { fromEnv: jest.fn(createClient) }),
  }
})

// The current isomorphic-dompurify transitive JSDOM package publishes an ESM
// helper which Next/Jest does not transform. Unit workflow tests use this DOM
// fallback; a separate subprocess test executes the real production module.
jest.mock('isomorphic-dompurify', () => ({
  __esModule: true,
  default: { sanitize: jest.fn((value: string) => value) },
}))

jest.mock('server-only', () => ({}))

jest.mock('@/core/notifications/wa-service', () => ({
  waService: {
    sendMessage: jest.fn().mockResolvedValue({ success: true, provider: 'test' }),
    sendBulk: jest.fn().mockResolvedValue([]),
  },
}))

import './src/tests/prisma-mock'

jest.mock('@/core/events/event-bus', () => ({
  eventBus: {
    emit: jest.fn(),
    on: jest.fn(),
  },
}))
