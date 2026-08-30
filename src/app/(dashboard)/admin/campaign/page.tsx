import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Image as ImageIcon, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import {
  campaignPhaseLabel,
  campaignStateLabel,
  deriveCampaignState,
  isSafeCampaignImageUrl,
  type CampaignState,
} from '@/features/homepage-banner/domain'
import { getHomepageBanners } from '@/features/homepage-banner/queries'
import { KomdigiPageHeader } from '../_components/komdigi-page-header'

export const metadata = { title: 'CMS Beranda' }

function stateTone(state: CampaignState) {
  if (state === 'ACTIVE') return 'success'
  if (state === 'SCHEDULED') return 'warning'
  if (state === 'EXPIRED' || state === 'ARCHIVED') return 'surface'
  if (state === 'PAUSED') return 'danger'
  return 'surface'
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(value)
}

export default async function AdminCampaignPage() {
  const banners = await getHomepageBanners()
  const now = new Date()

  return (
    <div className="space-y-7">
      <KomdigiPageHeader
        title="CMS Beranda"
        description="Atur campaign homepage, jadwal tayang, urutan prioritas, dan gambar khusus mobile."
        action={<ButtonLink href="/admin/campaign/create"><Plus className="h-4 w-4" aria-hidden="true" />Tambah Banner</ButtonLink>}
      />

      {banners.length > 0 ? (
        <section className="divide-y divide-border border-y border-border" aria-label="Daftar banner campaign">
          {banners.map((banner) => {
            const state = deriveCampaignState(banner, now)
            const preview = isSafeCampaignImageUrl(banner.desktopImage) ? banner.desktopImage : null
            return (
              <article key={banner.id} className="grid min-w-0 gap-5 py-6 md:grid-cols-[12rem_minmax(0,1fr)_12rem] md:items-center">
                <div className="relative aspect-[16/8] overflow-hidden rounded-md bg-surface-alt">
                  {preview ? <Image src={preview} alt="" fill sizes="192px" className="object-cover" /> : <span className="flex h-full items-center justify-center"><ImageIcon className="h-7 w-7 text-text-muted" aria-hidden="true" /></span>}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{campaignPhaseLabel(banner.phase)}</Badge>
                    <Badge tone={stateTone(state)}>{campaignStateLabel(state)}</Badge>
                    <span className="text-xs font-semibold text-text-muted">Prioritas {banner.priority}</span>
                  </div>
                  <h2 className="mt-3 break-words font-heading text-lg font-extrabold text-primary">
                    <Link href={`/admin/campaign/${banner.id}`} prefetch={false} className="inline-flex min-h-11 items-center hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{banner.internalTitle}</Link>
                  </h2>
                  <p className="break-words text-sm leading-6 text-text-secondary">{banner.headline}</p>
                  {banner.program ? <p className="mt-2 break-words text-xs font-semibold text-text-muted">Program: {banner.program.name}</p> : null}
                </div>
                <div className="min-w-0 space-y-2 text-xs leading-5 text-text-secondary md:text-right">
                  {banner.startAt ? <p className="flex items-start gap-2 md:justify-end"><Calendar className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" /><span>Mulai<br />{formatDateTime(banner.startAt)} WIB</span></p> : <p>Aktif tanpa waktu mulai</p>}
                  {banner.endAt ? <p>Berakhir<br />{formatDateTime(banner.endAt)} WIB</p> : <p>Tanpa waktu selesai</p>}
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <section className="border-l-2 border-accent py-8 pl-5" aria-labelledby="empty-campaign-heading">
          <h2 id="empty-campaign-heading" className="font-heading text-xl font-extrabold text-primary">Belum ada banner campaign</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">Tambahkan banner pertama ketika materi homepage sudah siap.</p>
          <ButtonLink href="/admin/campaign/create" variant="secondary" className="mt-5"><Plus className="h-4 w-4" aria-hidden="true" />Tambah Banner</ButtonLink>
        </section>
      )}
    </div>
  )
}
