import Image from 'next/image'
import { Metadata } from 'next'
import { LoginForm } from './login-form'
import { Card, CardContent } from '@/components/ui/card'
import { IKMI_LOGO_URL } from '@/core/brand/assets'

export const metadata: Metadata = {
  title: 'Login - Sistem Informasi Terpadu IKMI',
  description: 'Login ke dashboard sistem informasi terpadu IKMI Cirebon',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-background px-4 py-8 md:grid-cols-[1fr_0.95fr] md:px-8">
      <section className="hidden items-center justify-center rounded-2xl bg-primary p-10 text-surface md:flex">
        <div className="max-w-lg space-y-6">
          <Image src={IKMI_LOGO_URL} alt="Logo IKMI Cirebon" width={72} height={72} className="rounded-full" priority />
          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-extrabold leading-tight">Sistem Terpadu Pengurus IKMI</h1>
            <p className="text-surface/78">
              Ruang kerja internal untuk mengelola publikasi, keuangan, persuratan, LPJ, dan audit organisasi.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-6">
              <div className="space-y-3 text-center">
                <Image src={IKMI_LOGO_URL} alt="Logo IKMI Cirebon" width={64} height={64} className="mx-auto rounded-full md:hidden" />
                <div>
                  <h2 className="font-heading text-2xl font-extrabold text-primary">Masuk Dashboard</h2>
                  <p className="mt-1 text-sm text-muted">Gunakan akun pengurus yang sudah terdaftar.</p>
                </div>
              </div>
              <div className="space-y-3">
                <LoginForm />
                <p className="text-center text-sm text-muted">
                  hubungi komdigi untuk mendapatkan akses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
