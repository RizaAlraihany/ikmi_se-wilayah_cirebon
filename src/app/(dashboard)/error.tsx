'use client'

import { ErrorState } from '@/components/ui/error-state'

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <ErrorState
        title="Ruang kerja tidak dapat dimuat"
        description="Silakan coba lagi. Jika masalah berulang, hubungi Super Admin."
        onRetry={reset}
      />
    </div>
  )
}
