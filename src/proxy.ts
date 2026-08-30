import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './core/auth/auth.config'
import { logger } from './core/monitoring/logger'
import { isAuthenticatedDashboardUser } from './core/auth/roles'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const startedAt = Date.now()
  const hostname = (req.headers.get('host') ?? req.nextUrl.hostname).split(':')[0].toLowerCase()
  const isLoggedIn = isAuthenticatedDashboardUser(req.auth?.user)
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
    '/admin/cms/analytics',
  ]
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')
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
  const withNoIndex = <T extends Response>(response: T) => {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    return response
  }

  // Request Pamflet is a public-tool entry point on the same application.
  // Keeping this rewrite here avoids a second middleware/proxy entry point,
  // which Next.js 16 rejects during production builds.
  if (hostname.startsWith('request.') && !req.nextUrl.pathname.startsWith('/request-pamflet')) {
    if (req.nextUrl.pathname === '/robots.txt') {
      const response = new Response('User-agent: *\nDisallow: /\n', {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
        },
      })
      logRequest(200)
      return response
    }
    const requestUrl = req.nextUrl.clone()
    requestUrl.pathname = `/request-pamflet${requestUrl.pathname}`
    const response = NextResponse.rewrite(requestUrl)
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    logRequest(200)
    return response
  }

  if (req.nextUrl.pathname.startsWith('/request-pamflet')) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    logRequest(200)
    return response
  }

  if (dashboardHosts.has(hostname) && req.nextUrl.pathname === '/') {
    logRequest(302)
    return withNoIndex(NextResponse.redirect(new URL('/admin', req.nextUrl)))
  }

  if (dashboardHosts.has(hostname) && !isAuthRoute && !isDashboardRoute) {
    logRequest(302)
    return withNoIndex(NextResponse.redirect(new URL('/admin', req.nextUrl)))
  }

  const dashboardHost = publicToDashboardHost.get(hostname)
  if (dashboardHost && (isAuthRoute || isDashboardRoute)) {
    const dashboardUrl = new URL(req.nextUrl)
    dashboardUrl.protocol = 'https:'
    dashboardUrl.hostname = dashboardHost
    logRequest(308)
    return withNoIndex(NextResponse.redirect(dashboardUrl, 308))
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      logRequest(302)
      return withNoIndex(NextResponse.redirect(new URL('/admin', req.nextUrl)))
    }
    logRequest(200)
    return withNoIndex(NextResponse.next())
  }

  if (isDashboardRoute) {
    if (!isLoggedIn) {
      logRequest(302)
      return withNoIndex(NextResponse.redirect(new URL('/login', req.nextUrl)))
    }

    if (deprecatedDashboardPrefixes.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
      logRequest(302)
      return withNoIndex(NextResponse.redirect(new URL('/admin', req.nextUrl)))
    }

    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-dashboard-pathname', req.nextUrl.pathname)

    logRequest(200)
    return withNoIndex(NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }))
  }

  logRequest(200)
  return
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
