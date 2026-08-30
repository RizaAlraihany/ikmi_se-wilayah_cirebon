import { organizationQueries } from '@/features/organization/queries'
import { OrganizationManager } from './organization-manager'

export default async function OrganizationPage() {
  const overview = await organizationQueries.getOverview()
  return <OrganizationManager {...overview} />
}
