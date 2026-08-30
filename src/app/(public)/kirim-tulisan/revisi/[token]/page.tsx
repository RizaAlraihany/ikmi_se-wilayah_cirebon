import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getKaryaTulisRevisionTokenState } from '@/features/kirim-tulisan/actions'
import { KirimTulisanRevisionForm } from './revision-form'
import { PublicPageHero } from '../../../_components/public-page-hero'

export const metadata: Metadata = {
  title: 'Revisi Karya Tulis - IKMI Cirebon',
  robots: { index: false, follow: false },
}

export default async function KirimTulisanRevisionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const submission = await getKaryaTulisRevisionTokenState(token)
  if (!submission) notFound()

  return <main className="public-page-root min-h-screen">
    <PublicPageHero
      items={[
        { label: 'Kirim Tulisan', href: '/kirim-tulisan' },
        { label: 'Unggah revisi' },
      ]}
      title="Unggah revisi"
      lead={submission.title}
      image="https://res.cloudinary.com/dsgldeuuy/image/upload/v1781230548/psda_yufbw9.png"
    />
    <section className="public-page-content">
      <div className="public-container max-w-xl">
        {submission.reviewNotes ? <section className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-primary"><h2 className="font-semibold">Catatan redaksi</h2><p className="mt-2 whitespace-pre-wrap">{submission.reviewNotes}</p></section> : null}
        <KirimTulisanRevisionForm token={token} />
      </div>
    </section>
  </main>
}
