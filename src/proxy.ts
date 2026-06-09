import NextAuth from 'next-auth'
import { authConfig } from './core/auth/auth.config'
import { logger } from './core/monitoring/logger'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const startedAt = Date.now()
  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login')
  const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard')
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')
  const logRequest = (status: number) => {
    logger.request({
      method: req.method,
      path: req.nextUrl.pathname,
      status,
      userId: req.auth?.user?.id,
      durationMs: Date.now() - startedAt,
    })
  }

  if (isApiRoute) {
    logRequest(200)
    return
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      logRequest(302)
      return Response.redirect(new URL('/dashboard', req.nextUrl))
    }
    logRequest(200)
    return
  }

  if (isDashboardRoute) {
    if (!isLoggedIn) {
      logRequest(302)
      return Response.redirect(new URL('/login', req.nextUrl))
    }
    logRequest(200)
    return
  }

  logRequest(200)
  return
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
