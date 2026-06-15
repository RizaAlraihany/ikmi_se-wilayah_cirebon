import NextAuth from 'next-auth'
import { authConfig } from './core/auth/auth.config'
import { logger } from './core/monitoring/logger'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const startedAt = Date.now()
  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login')
  const isDashboardRoute =
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/admin')
  const deprecatedDashboardPrefixes = [
    '/admin/kaderisasi',
    '/admin/membership',
    '/admin/complaints',
    '/admin/notifications',
    '/admin/operations',
    '/admin/programs',
    '/admin/cms/analytics',
  ]
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')
  const hostname = (req.headers.get('host') ?? req.nextUrl.hostname).split(':')[0].toLowerCase()
  const publicToDashboardHost = new Map([
    ['ikmicirebon.web.id', 'dashboard.ikmicirebon.web.id'],
    ['www.ikmicirebon.web.id', 'dashboard.ikmicirebon.web.id'],
    ['ikmicirebon.or.id', 'dashboard.ikmicirebon.or.id'],
    ['www.ikmicirebon.or.id', 'dashboard.ikmicirebon.or.id'],
    ['ikmicirebon.vercel.app', 'dashboard-ikmicirebon.vercel.app'],
  ])
  const dashboardHosts = new Set([
    'dashboard.ikmicirebon.web.id',
    'dashboard.ikmicirebon.or.id',
    'dashboard-ikmicirebon.vercel.app',
  ])
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

  if (dashboardHosts.has(hostname) && req.nextUrl.pathname === '/') {
    logRequest(302)
    return Response.redirect(new URL('/admin', req.nextUrl))
  }

  if (dashboardHosts.has(hostname) && !isAuthRoute && !isDashboardRoute) {
    logRequest(302)
    return Response.redirect(new URL('/admin', req.nextUrl))
  }

  const dashboardHost = publicToDashboardHost.get(hostname)
  if (dashboardHost && (isAuthRoute || isDashboardRoute)) {
    const dashboardUrl = new URL(req.nextUrl)
    dashboardUrl.protocol = 'https:'
    dashboardUrl.hostname = dashboardHost
    logRequest(308)
    return Response.redirect(dashboardUrl, 308)
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      logRequest(302)
      return Response.redirect(new URL('/admin', req.nextUrl))
    }
    logRequest(200)
    return
  }

  if (isDashboardRoute) {
    if (!isLoggedIn) {
      logRequest(302)
      return Response.redirect(new URL('/login', req.nextUrl))
    }

    if (deprecatedDashboardPrefixes.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
      logRequest(302)
      return Response.redirect(new URL('/admin', req.nextUrl))
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
