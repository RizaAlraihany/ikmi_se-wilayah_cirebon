import { type DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's role ID. */
      roleId: string
      /** The user's department ID. */
      departmentId: string | null
      /** The user's position ID. */
      positionId: string | null
    } & DefaultSession['user']
  }

  interface User {
    roleId: string
    departmentId: string | null
    positionId: string | null
  }
}
