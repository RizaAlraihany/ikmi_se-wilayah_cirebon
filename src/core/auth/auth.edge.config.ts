import type { NextAuthConfig } from 'next-auth'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Configuration reachable from the Edge proxy must stay free of database,
 * password-hashing, cache, and other Node-only dependencies. Credentials
 * verification and authoritative user validation remain in the Node path.
 */
export const authEdgeConfig = {
  // Middleware only reads/decrypts the session; credentials are configured in
  // the Node server config and replace this empty provider list there.
  providers: [],
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
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig
