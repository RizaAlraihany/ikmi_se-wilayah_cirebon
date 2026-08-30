import { CredentialsSignin, type NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '../database/prisma'
import { env } from '../config/env'
import { isDashboardRole } from './roles'
import {
  assertLoginRateLimit,
  readClientIp,
  resetSuccessfulLoginRateLimit,
} from '../security/login-rate-limit'
import { RateLimitError } from '../security/rate-limiter'
import { authService } from '@/features/auth/services'

const isProduction = env.NODE_ENV === 'production'
const INVALID_LOGIN_HASH = '$2a$12$vKiSfRPXVLwC6bAdcKyDluCRmv9IKgKyQNO8hIsXNN5BqU35pMFtK'

class LoginRateLimitedError extends CredentialsSignin {
  code = 'rate_limited'
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (typeof credentials?.email !== 'string' || typeof credentials.password !== 'string') {
          return null
        }

        const email = credentials.email.trim().toLowerCase()
        const password = credentials.password
        if (!email || !password) return null

        const ip = readClientIp(
          request?.headers.get('x-forwarded-for') ?? null,
          request?.headers.get('x-real-ip') ?? null,
        )
        try {
          await assertLoginRateLimit(ip, email)
        } catch (error) {
          if (error instanceof RateLimitError) throw new LoginRateLimitedError()
          throw error
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            isActive: true,
            deletedAt: true,
            roleId: true,
            departmentId: true,
            positionId: true,
            sessionVersion: true,
          },
        })

        if (!user || !user.isActive || user.deletedAt || !isDashboardRole(user.roleId)) {
          await bcrypt.compare(password, INVALID_LOGIN_HASH)
          await authService.logFailedLoginEvent(user?.id ?? null).catch(() => undefined)
          return null
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
          await authService.logFailedLoginEvent(user.id).catch(() => undefined)
          return null
        }

        await resetSuccessfulLoginRateLimit(email)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roleId: user.roleId,
          departmentId: user.departmentId,
          positionId: user.positionId,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roleId = user.roleId
        token.departmentId = user.departmentId
        token.positionId = user.positionId
        token.sessionVersion = user.sessionVersion
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.roleId = token.roleId as string
        session.user.departmentId = token.departmentId as string | null
        session.user.positionId = token.positionId as string | null
        session.user.sessionVersion = token.sessionVersion as number | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    // Short-lived sessions bound the lifetime of a pre-revocation JWT.
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) await authService.logLoginEvent(user.id).catch(() => undefined)
    },
  },
  secret: env.AUTH_SECRET,
} satisfies NextAuthConfig
