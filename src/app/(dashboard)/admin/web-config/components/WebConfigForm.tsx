'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Editor } from '@/components/ui/editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { upsertWebConfigAction } from '@/features/web-config/actions'
import { cn } from '@/lib/utils'

type ConfigValues = { title?: string; description?: string; content?: string }
type WebConfigTab = 'HERO' | 'VISION_MISSION'

const tabs: { value: WebConfigTab; label: string }[] = [
  { value: 'HERO', label: 'Hero Banner' },
  { value: 'VISION_MISSION', label: 'Visi & Misi' },
]

export function WebConfigForm({ configs }: { configs: Record<string, ConfigValues> }) {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<WebConfigTab>('HERO')
  const [heroTitle, setHeroTitle] = useState(configs.HERO_BANNER?.title || '')
  const [heroDescription, setHeroDescription] = useState(configs.HERO_BANNER?.description || '')
  const [vision, setVision] = useState(configs.VISION?.content || '')
  const [mission, setMission] = useState(configs.MISSION?.content || '')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSaveHero(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const result = await upsertWebConfigAction({
      key: 'HERO_BANNER',
      valueJson: JSON.stringify({ title: heroTitle, description: heroDescription }),
    })
    setMessage(result?.error || 'Berhasil menyimpan konfigurasi Hero.')
    setLoading(false)
    router.refresh()
  }

  async function handleSaveVisionMission(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const visionResult = await upsertWebConfigAction({
      key: 'VISION',
      valueJson: JSON.stringify({ content: vision }),
    })
    const missionResult = await upsertWebConfigAction({
      key: 'MISSION',
      valueJson: JSON.stringify({ content: mission }),
    })

    setMessage(visionResult?.error || missionResult?.error || 'Berhasil menyimpan konfigurasi Visi & Misi.')
    setLoading(false)
    router.refresh()
  }

  return (
    <Card>
      <div className="flex flex-wrap border-b border-line px-4 pt-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              activeTab === tab.value
                ? 'border-accent text-primary'
                : 'border-transparent text-muted hover:text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <CardContent className="p-6">
        {message && (
          <div className="mb-6 rounded-2xl bg-accent/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-accent/30">
            {message}
          </div>
        )}

        {activeTab === 'HERO' && (
          <form onSubmit={handleSaveHero} className="max-w-2xl space-y-4">
            <div className="space-y-2">
              <label htmlFor="heroTitle" className="text-sm font-semibold text-primary">Judul Hero Banner</label>
              <Input
                id="heroTitle"
                type="text"
                value={heroTitle}
                onChange={(event) => setHeroTitle(event.target.value)}
                placeholder="Sistem Informasi Terpadu IKMI Cirebon"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="heroDescription" className="text-sm font-semibold text-primary">Deskripsi Singkat</label>
              <Textarea
                id="heroDescription"
                value={heroDescription}
                onChange={(event) => setHeroDescription(event.target.value)}
                rows={4}
                placeholder="Platform digital untuk mengelola seluruh kegiatan kemahasiswaan."
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </form>
        )}

        {activeTab === 'VISION_MISSION' && (
          <form onSubmit={handleSaveVisionMission} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="visionEditor" className="text-sm font-semibold text-primary">Visi Organisasi</label>
              <Editor id="visionEditor" value={vision} onChange={setVision} />
            </div>
            <div className="space-y-2">
              <label htmlFor="missionEditor" className="text-sm font-semibold text-primary">Misi Organisasi</label>
              <Editor id="missionEditor" value={mission} onChange={setMission} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Visi & Misi'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
