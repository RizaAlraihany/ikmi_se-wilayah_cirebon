import { BannerForm } from '../_components/banner-form'
import { getCampaignProgramOptions } from '@/features/homepage-banner/queries'

export const metadata = {
  title: 'Buat Campaign Banner | Admin Komdigi',
}

export default async function CreateCampaignPage() {
  const programs = await getCampaignProgramOptions()
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">CMS Beranda</p>
        <h1 className="mt-2 font-heading text-2xl font-extrabold text-primary">Buat Banner Baru</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Tambahkan materi campaign yang responsif dan memiliki jadwal tayang jelas.
        </p>
      </div>

      <BannerForm programs={programs} />
    </div>
  )
}
