import { webConfigQueries } from '@/features/web-config/queries'
import { WebConfigForm } from './components/WebConfigForm'
import { defaultWebConfig } from '@/features/web-config/default-config'
import { requireAuth, requireRoleForUser } from '@/core/authorization/guards'
import { ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'

export const metadata = {
  title: 'Konfigurasi Web | IKMI Cirebon',
}

type ConfigMap = Record<string, unknown>

function safeJson(valueJson: string): unknown {
  try {
    return JSON.parse(valueJson)
  } catch {
    return undefined
  }
}

export default async function WebConfigPage() {
  const actor = await requireAuth()
  await requireRoleForUser(actor, ORGANIZATION_DASHBOARD_ROLE_IDS)
  const config = await webConfigQueries.getWebConfigByKey('contact_info')
  const configsMap: ConfigMap = {
    contact_info: config ? safeJson(config.valueJson) : defaultWebConfig.contact_info,
  }

  return (
    <div className="space-y-6">
      <div className="border-y-2 border-primary bg-surface px-1 py-6 sm:px-5">
        <p className="text-xs font-bold uppercase text-accent">Website Publik</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-balance text-primary">Kontak Publik</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-pretty text-text-secondary">Kelola kanal resmi yang dipakai halaman Kontak dan footer website publik.</p>
      </div>

      <WebConfigForm configs={configsMap} />
    </div>
  )
}
