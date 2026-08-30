import { notFound } from 'next/navigation'
import { getCampaignProgramOptions, getHomepageBannerById } from '@/features/homepage-banner/queries'
import { BannerForm } from '../_components/banner-form'

export const metadata = {
  title: 'Edit Campaign Banner | Admin Komdigi',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditCampaignPage({ params }: Props) {
  const resolvedParams = await params
  const [banner, programs] = await Promise.all([
    getHomepageBannerById(resolvedParams.id),
    getCampaignProgramOptions(),
  ])

  if (!banner) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">CMS Beranda</p>
        <h1 className="mt-2 font-heading text-2xl font-extrabold text-primary">Edit Banner</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Ubah informasi banner kampanye {banner.internalTitle}.
        </p>
      </div>

      <BannerForm banner={banner} programs={programs} />
    </div>
  )
}
