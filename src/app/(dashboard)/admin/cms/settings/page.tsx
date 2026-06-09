import { auth } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import { webConfigQueries } from '@/features/web-config/queries'
import { WebConfigForm } from './components/WebConfigForm'
import { requireCmsUpdate } from '@/features/cms/access'
import { defaultWebConfig } from '@/features/web-config/default-config'

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
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  await requireCmsUpdate(session.user.id)

  const keys = ['landing_hero', 'landing_about', 'landing_cta', 'about_page', 'contact_info', 'seo_config']
  const dbConfigs = await Promise.all(keys.map((key) => webConfigQueries.getWebConfigByKey(key)))

  const configsMap: ConfigMap = {}
  keys.forEach((key, index) => {
    const config = dbConfigs[index]
    configsMap[key] = config ? safeJson(config.valueJson) : defaultWebConfig[key as keyof typeof defaultWebConfig]
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-primary">CMS & Web Config</h1>
        <p className="mt-1 text-sm text-muted">Kelola landing page, tentang IKMI, kontak, dan SEO website publik.</p>
      </div>

      <WebConfigForm configs={configsMap} />
    </div>
  )
}
