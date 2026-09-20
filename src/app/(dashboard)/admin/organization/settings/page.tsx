import { organizationQueries } from '@/features/organization/queries'
import { PeriodSettings } from './period-settings'

export const metadata = { title: 'Pengaturan Organisasi' }

export default async function OrganizationSettingsPage() {
  const settings = await organizationQueries.getPeriodSettings()
  return <PeriodSettings {...settings} />
}
