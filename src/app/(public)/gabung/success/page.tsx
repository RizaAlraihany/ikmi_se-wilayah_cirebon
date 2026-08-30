import type { Metadata } from 'next'
import { ArrowLeft, Check } from 'lucide-react'
import { redirect } from 'next/navigation'
import { ButtonLink } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Data Bergabung Terkirim',
  description: 'Konfirmasi penerimaan data untuk bergabung bersama IKMI Cirebon.',
  robots: { index: false, follow: false, nocache: true },
}

export default async function JoinSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ req?: string }>
}) {
  const registrationNumber = (await searchParams).req?.trim()
  if (!registrationNumber || !/^REG-\d{4}-\d{4}$/.test(registrationNumber)) redirect('/gabung')

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center bg-background px-4 py-12 sm:px-6">
      <section className="mx-auto w-full max-w-xl border-y border-border bg-surface py-9 text-center sm:rounded-lg sm:border sm:p-10 sm:shadow-sm" aria-labelledby="join-success-title">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-surface text-success-foreground">
          <Check className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-accent">Tersimpan di sistem</p>
        <h1 id="join-success-title" className="mt-2 font-heading text-2xl font-extrabold text-primary sm:text-3xl">Terima kasih sudah ingin bergabung</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-text-secondary">
          Data Anda sudah diterima dan akan diperiksa oleh Admin Organisasi. Simpan nomor referensi berikut untuk komunikasi lanjutan.
        </p>

        <div className="my-8 border-y border-border py-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">Nomor referensi</p>
          <p className="mt-2 break-all font-mono text-lg font-extrabold text-primary sm:text-xl">{registrationNumber}</p>
        </div>

        <ButtonLink href="/" className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Beranda
        </ButtonLink>
      </section>
    </main>
  )
}
