import Link from 'next/link'
import { Metadata } from 'next'
import { RegisterForm } from './register-form'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Pendaftaran Kader Baru - BEM IKMI Cirebon',
  description: 'Formulir pendaftaran kader baru Organisasi Mahasiswa IKMI Cirebon',
}

export default function PublicRegisterPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <Badge tone="surface" className="mx-auto w-fit">Kaderisasi IKMI</Badge>
          <h1 className="font-heading text-4xl font-extrabold leading-tight text-primary">Pendaftaran Kader Baru</h1>
          <p className="text-muted">
            Mari bergabung bersama keluarga besar IKMI Cirebon dan kembangkan potensimu bersama ruang belajar yang humanis, akademis, dan profesional.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <RegisterForm />
          </CardContent>
          <div className="border-t border-line px-6 py-4 text-center text-sm text-muted">
            Sudah memiliki akun pengurus?{' '}
            <Link href="/login" className="font-semibold text-accent">Login di sini</Link>
          </div>
        </Card>
      </div>
    </main>
  )
}
