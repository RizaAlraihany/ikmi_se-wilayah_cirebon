import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { getKaryaTulisQueue } from '@/features/kirim-tulisan/actions'
import { WritingReviewActions } from './writing-review-actions'
import { KomdigiPageHeader, KomdigiPanel } from '../_components/komdigi-page-header'

export const metadata: Metadata = { title: 'Karya Tulis - Dashboard IKMI' }

const tone = { SUBMITTED: 'warning', UNDER_REVIEW: 'warning', REVISION_REQUIRED: 'danger', RESUBMITTED: 'warning', REJECTED: 'danger', APPROVED: 'success', ARTICLE_DRAFT_CREATED: 'accent', SCHEDULED: 'accent', PUBLISHED: 'success', ARCHIVED: 'surface' } as const

export default async function KaryaTulisDashboardPage() {
  const submissions = await getKaryaTulisQueue()
  const waitingCount = submissions.filter((item) => ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'].includes(item.status)).length
  const revisionCount = submissions.filter((item) => item.status === 'REVISION_REQUIRED').length
  const approvedCount = submissions.filter((item) => ['APPROVED', 'ARTICLE_DRAFT_CREATED', 'SCHEDULED', 'PUBLISHED'].includes(item.status)).length

  return (
    <main className="space-y-6">
      <KomdigiPageHeader
        title="Inbox Kiriman Tulisan"
        description="Pusat peninjauan naskah Opini, Artikel, dan Kajian dengan alur upload-first."
      />

      <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-border/60" aria-label="Ringkasan status tulisan">
        {[
          ['Menunggu Review', waitingCount, true],
          ['Perlu Revisi', revisionCount, false],
          ['Disetujui', approvedCount, false],
        ].map(([label, count, active]) => (
          <div key={String(label)} className={`whitespace-nowrap border-b-[3px] pb-3 text-sm ${active ? 'border-primary font-bold text-primary' : 'border-transparent font-medium text-text-secondary'}`}>
            {label} <span className="ml-1 rounded-sm bg-warning px-1.5 py-0.5 text-[9px] font-bold text-white">{count}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 md:hidden">
        {submissions.map((item) => (
          <article key={item.id} className="glass-subtle rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{item.category ?? 'Tulisan'}</p>
                <h2 className="mt-1 font-heading font-extrabold text-primary">{item.title}</h2>
                <p className="mt-1 break-all font-mono text-[10px] text-text-muted">{item.submissionNumber}</p>
                <p className="mt-1 text-xs text-text-secondary">{item.authorName ?? 'Penulis tidak diketahui'} · V{item.versions[0]?.versionNumber ?? 0}</p>
              </div>
              <Badge tone={tone[item.status]}>{item.status.replaceAll('_', ' ')}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">{item.versions.map((version) => <ButtonLink key={version.versionNumber} href={`/api/private/karya-tulis/${item.id}?version=${version.versionNumber}`} target="_blank" variant="outline" size="sm">Berkas V{version.versionNumber}</ButtonLink>)}<WritingReviewActions id={item.id} status={item.status} articleDraftId={item.articleDraft?.id} /></div>
          </article>
        ))}
        {submissions.length === 0 ? <p className="glass-subtle rounded-xl p-5 text-sm text-text-secondary">Belum ada Karya Tulis.</p> : null}
      </div>

      <KomdigiPanel className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/60 bg-white/40 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <tr><th className="px-6 py-4">Judul & Kategori</th><th className="px-6 py-4">Penulis</th><th className="px-6 py-4">Versi</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Tindakan</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {submissions.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-white/50">
                <td className="px-6 py-4"><p className="font-heading font-extrabold text-primary">{item.title}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-accent">{item.category ?? '-'}</p></td>
                <td className="px-6 py-4 text-text-secondary">{item.authorName ?? '-'}</td>
                <td className="px-6 py-4 text-text-secondary"><div className="flex flex-wrap gap-1">{item.versions.map((version) => <ButtonLink key={version.versionNumber} href={`/api/private/karya-tulis/${item.id}?version=${version.versionNumber}`} target="_blank" variant="ghost" size="sm">V{version.versionNumber}</ButtonLink>)}</div></td>
                <td className="px-6 py-4"><Badge tone={tone[item.status]}>{item.status.replaceAll('_', ' ')}</Badge></td>
                <td className="px-6 py-4"><div className="flex justify-end gap-2"><WritingReviewActions id={item.id} status={item.status} articleDraftId={item.articleDraft?.id} /></div></td>
              </tr>
            ))}
            {submissions.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-text-secondary">Belum ada Karya Tulis.</td></tr> : null}
          </tbody>
        </table>
      </KomdigiPanel>
    </main>
  )
}
