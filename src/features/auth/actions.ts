'use server'

import { signIn, signOut, auth } from '@/core/auth/auth'
import { authService } from './services'
import { LoginInput, loginSchema } from './schemas'
import { AuthError } from 'next-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { rateLimit, RateLimitError } from '@/core/security/rate-limiter'

export async function loginAction(data: LoginInput) {
  try {
    const headerStore = await headers()
    const ip = headerStore.get('x-forwarded-for') || 'unknown-ip'
    await rateLimit(`login:${ip}`, 5, 300) // max 5 attempts per 5 minutes

    const parsed = loginSchema.parse(data)
    
    await signIn('credentials', {
      email: parsed.email,
      password: parsed.password,
      redirect: false
    })

    await authService.logLoginEventByEmail(parsed.email).catch(() => undefined)

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Email atau password salah.' }
        default:
          return { error: 'Terjadi kesalahan saat login.' }
      }
    }
    
    // Zod Error
    if (error instanceof Error && error.name === 'ZodError') {
       return { error: 'Format data tidak valid.' }
    }
    
    if (error instanceof RateLimitError) {
      return { error: error.message }
    }

    return { error: 'Kredensial tidak valid.' }
  }

  redirect('/admin')
}

export async function logoutAction() {
  const session = await auth()
  if (session?.user?.id) {
    await authService.logLogoutEvent(session.user.id)
  }
  await signOut({ redirectTo: '/login' })
}
