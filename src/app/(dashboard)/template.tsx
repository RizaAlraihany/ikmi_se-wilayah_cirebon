import { requireDashboardRouteAccess } from '@/core/authorization/guards'
import { ForbiddenError, UnauthorizedError } from '@/core/errors/custom-errors'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/** Re-runs the route guard on every dashboard navigation. */
export default async function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const pathname = requestHeaders.get('x-dashboard-pathname')

  try {
    await requireDashboardRouteAccess(pathname ?? '')
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/login')
    }

    if (error instanceof ForbiddenError) {
      redirect('/admin?error=forbidden')
    }

    throw error
  }

  return children
}
