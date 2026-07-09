import { Metadata } from 'next'
import { RegisterForm } from './register-form'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Pendaftaran Anggota Baru - BEM IKMI Cirebon',
  description: 'Formulir pendaftaran anggota baru Organisasi Mahasiswa IKMI Cirebon',
}

export default function PublicRegisterPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-7 md:px-6 md:py-10 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5 md:space-y-8">
        <div className="mx-auto max-w-2xl space-y-3 text-center md:space-y-4">
          <Badge tone="surface" className="mx-auto w-fit text-[11px] md:text-xs">Pendaftaran Anggota</Badge>
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-primary md:text-4xl">Pendaftaran Anggota Baru</h1>
          <p className="text-sm leading-6 text-muted md:text-base">
            Mari bergabung bersama keluarga besar IKMI Cirebon dan kembangkan potensimu bersama ruang belajar yang humanis, akademis, dan profesional.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-8">
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
