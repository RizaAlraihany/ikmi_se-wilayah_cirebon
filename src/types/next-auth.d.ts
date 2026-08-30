import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      roleId: string
      departmentId: string | null
      positionId: string | null
      sessionVersion?: number
    } & DefaultSession['user']
  }

  interface User {
    roleId?: string | null
    departmentId?: string | null
    positionId?: string | null
    sessionVersion?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    roleId?: string | null
    departmentId?: string | null
    positionId?: string | null
    sessionVersion?: number
  }
}

export {}
