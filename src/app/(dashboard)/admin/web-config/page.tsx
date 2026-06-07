import { auth } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import { webConfigQueries } from '@/features/web-config/queries'
import { WebConfigForm } from './components/WebConfigForm'

export const metadata = {
  title: 'Konfigurasi Web | IKMI Cirebon',
}

type ConfigValues = { title?: string; description?: string; content?: string }

function getStringField(value: unknown, key: string) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined
  }

  const entry = Object.entries(value).find(([field]) => field === key)
  return typeof entry?.[1] === 'string' ? entry[1] : undefined
}

function toConfigValues(value: unknown): ConfigValues {
  return {
    title: getStringField(value, 'title'),
    description: getStringField(value, 'description'),
    content: getStringField(value, 'content'),
  }
}

export default async function WebConfigPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  if (session.user.roleId !== 'super_admin') {
    redirect('/admin/dashboard')
  }

  const keys = ['HERO_BANNER', 'VISION', 'MISSION']
  const dbConfigs = await Promise.all(keys.map((key) => webConfigQueries.getWebConfigByKey(key)))

  const configsMap: Record<string, ConfigValues> = {}
  keys.forEach((key, index) => {
    const config = dbConfigs[index]
    if (config) {
      configsMap[key] = toConfigValues(config.valueJson)
    }
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-primary">CMS & Web Config</h1>
        <p className="mt-1 text-sm text-muted">Kelola konten halaman utama seperti hero banner, visi, dan misi.</p>
      </div>

      <WebConfigForm configs={configsMap} />
    </div>
  )
}
