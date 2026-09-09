'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteUserAction } from '@/features/users/actions'
import { Button } from '@/components/ui/button'

export function DeleteUserButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  return <div><Button variant="ghost" size="sm" disabled={pending} aria-label={`Hapus ${name}`} onClick={async () => {
    setPending(true)
    try { const result = await deleteUserAction(id); setError(result.error || ''); if (!result.error) router.refresh() }
    catch { setError('Pengguna belum dapat dihapus.') }
    finally { setPending(false) }
  }}>Hapus</Button>{error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}</div>
}
