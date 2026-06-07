import NextAuth from 'next-auth'
import { authConfig } from './core/auth/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login')
  const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard')
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')

  if (isApiRoute) {
    return 
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/dashboard', req.nextUrl))
    }
    return
  }

  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL('/login', req.nextUrl))
    }
    return
  }

  return
})

export const config = {
  // Matches all routes except next internals, static files, and images
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
