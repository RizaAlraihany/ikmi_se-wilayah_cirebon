'use server'

import { signIn, signOut, auth } from '@/core/auth/auth'
import { authService } from './services'
import { LoginInput, loginSchema } from './schemas'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

export async function loginAction(data: LoginInput) {
  try {
    const parsed = loginSchema.parse(data)

    await signIn('credentials', {
      email: parsed.email,
      password: parsed.password,
      redirect: false
    })

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          if ('code' in error && error.code === 'rate_limited') {
            return { error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' }
          }
          return { error: 'Email atau password salah.' }
        default:
          return { error: 'Terjadi kesalahan saat login.' }
      }
    }
    
    // Zod Error
    if (error instanceof Error && error.name === 'ZodError') {
       return { error: 'Format data tidak valid.' }
    }
    
    return { error: 'Kredensial tidak valid.' }
  }

  redirect('/admin')
}

export async function logoutAction() {
  const session = await auth()
  if (session?.user?.id) {
    // Audit availability must never prevent session invalidation.
    try {
      await authService.logLogoutEvent(session.user.id)
    } catch {
      // Session invalidation remains the primary security outcome.
    }
  }
  await signOut({ redirectTo: '/login' })
}
