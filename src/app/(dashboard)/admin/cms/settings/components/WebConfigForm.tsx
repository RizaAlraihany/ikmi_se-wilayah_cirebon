'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { upsertWebConfigAction } from '@/features/web-config/actions'
import { defaultWebConfig } from '@/features/web-config/default-config'
import { cn } from '@/lib/utils'

type HeroConfig = typeof defaultWebConfig.landing_hero
type AboutConfig = typeof defaultWebConfig.landing_about
type CtaConfig = typeof defaultWebConfig.landing_cta
type AboutPageConfig = typeof defaultWebConfig.about_page
type ContactConfig = typeof defaultWebConfig.contact_info
type SeoConfig = typeof defaultWebConfig.seo_config

type ConfigValues = {
  landing_hero?: unknown
  landing_about?: unknown
  landing_cta?: unknown
  about_page?: unknown
  contact_info?: unknown
  seo_config?: unknown
}

type WebConfigTab = 'HERO' | 'ABOUT' | 'CONTACT' | 'SEO'

const tabs: { value: WebConfigTab; label: string }[] = [
  { value: 'HERO', label: 'Hero' },
  { value: 'ABOUT', label: 'About' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'SEO', label: 'SEO' },
]

function withFallback<T>(value: unknown, fallback: T): T {
  return typeof value === 'object' && value !== null ? { ...fallback, ...value } : fallback
}

export function WebConfigForm({ configs }: { configs: ConfigValues }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<WebConfigTab>('HERO')
  const [message, setMessage] = useState('')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const [hero, setHero] = useState<HeroConfig>(withFallback(configs.landing_hero, defaultWebConfig.landing_hero))
  const [landingAbout, setLandingAbout] = useState<AboutConfig>(withFallback(configs.landing_about, defaultWebConfig.landing_about))
  const [cta, setCta] = useState<CtaConfig>(withFallback(configs.landing_cta, defaultWebConfig.landing_cta))
  const [aboutPage, setAboutPage] = useState<AboutPageConfig>(withFallback(configs.about_page, defaultWebConfig.about_page))
  const [contact, setContact] = useState<ContactConfig>(withFallback(configs.contact_info, defaultWebConfig.contact_info))
  const [seo, setSeo] = useState<SeoConfig>(withFallback(configs.seo_config, defaultWebConfig.seo_config))

  async function saveConfig(key: string, value: unknown) {
    setLoadingKey(key)
    setMessage('')
    const result = await upsertWebConfigAction({
      key,
      valueJson: JSON.stringify(value),
    })
    setMessage(result?.error || 'Konfigurasi berhasil disimpan.')
    setLoadingKey(null)
    router.refresh()
  }

  return (
    <Card>
      <div className="flex flex-wrap border-b border-line px-4 pt-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => { setActiveTab(tab.value); setMessage('') }}
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
        {message ? (
          <div className="mb-6 rounded-2xl bg-accent/15 px-4 py-3 text-sm font-medium text-primary ring-1 ring-accent/30">
            {message}
          </div>
        ) : null}

        {activeTab === 'HERO' ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <ConfigPanel title="Hero Section" onSave={() => saveConfig('landing_hero', hero)} loading={loadingKey === 'landing_hero'}>
              <Field label="Title" htmlFor="hero-title">
                <Input id="hero-title" value={hero.title} onChange={(event) => setHero({ ...hero, title: event.target.value })} />
              </Field>
              <Field label="Subtitle" htmlFor="hero-subtitle">
                <Textarea id="hero-subtitle" value={hero.subtitle} rows={4} onChange={(event) => setHero({ ...hero, subtitle: event.target.value })} />
              </Field>
              <Field label="CTA Utama" htmlFor="hero-cta">
                <Input id="hero-cta" value="Bergabung Bersama Kami" disabled />
              </Field>
            </ConfigPanel>

            <ConfigPanel title="Final CTA" onSave={() => saveConfig('landing_cta', cta)} loading={loadingKey === 'landing_cta'}>
              <Field label="Title" htmlFor="cta-title">
                <Input id="cta-title" value={cta.title} onChange={(event) => setCta({ ...cta, title: event.target.value })} />
              </Field>
              <Field label="Description" htmlFor="cta-description">
                <Textarea id="cta-description" value={cta.description} rows={4} onChange={(event) => setCta({ ...cta, description: event.target.value })} />
              </Field>
            </ConfigPanel>
          </div>
        ) : null}

        {activeTab === 'ABOUT' ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <ConfigPanel title="Landing About" onSave={() => saveConfig('landing_about', landingAbout)} loading={loadingKey === 'landing_about'}>
              <Field label="Title" htmlFor="landing-about-title">
                <Input id="landing-about-title" value={landingAbout.title} onChange={(event) => setLandingAbout({ ...landingAbout, title: event.target.value })} />
              </Field>
              <Field label="Description" htmlFor="landing-about-description">
                <Textarea id="landing-about-description" value={landingAbout.description} rows={6} onChange={(event) => setLandingAbout({ ...landingAbout, description: event.target.value })} />
              </Field>
            </ConfigPanel>

            <ConfigPanel title="Tentang Kami Detail" onSave={() => saveConfig('about_page', aboutPage)} loading={loadingKey === 'about_page'}>
              <Field label="Sejarah" htmlFor="about-history">
                <Textarea id="about-history" value={aboutPage.history} rows={5} onChange={(event) => setAboutPage({ ...aboutPage, history: event.target.value })} />
              </Field>
              <Field label="Visi" htmlFor="about-vision">
                <Textarea id="about-vision" value={aboutPage.vision} rows={3} onChange={(event) => setAboutPage({ ...aboutPage, vision: event.target.value })} />
              </Field>
              <Field label="Misi" htmlFor="about-missions">
                <Textarea
                  id="about-missions"
                  value={aboutPage.missions.join('\n')}
                  rows={5}
                  onChange={(event) => setAboutPage({ ...aboutPage, missions: event.target.value.split('\n').filter(Boolean) })}
                />
              </Field>
            </ConfigPanel>
          </div>
        ) : null}

        {activeTab === 'CONTACT' ? (
          <ConfigPanel title="Contact Information" onSave={() => saveConfig('contact_info', contact)} loading={loadingKey === 'contact_info'}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email" htmlFor="contact-email">
                <Input id="contact-email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} />
              </Field>
              <Field label="WhatsApp" htmlFor="contact-whatsapp">
                <Input id="contact-whatsapp" value={contact.whatsapp} onChange={(event) => setContact({ ...contact, whatsapp: event.target.value })} />
              </Field>
              <Field label="Address" htmlFor="contact-address">
                <Input id="contact-address" value={contact.address} onChange={(event) => setContact({ ...contact, address: event.target.value })} />
              </Field>
              <Field label="Instagram" htmlFor="contact-instagram">
                <Input id="contact-instagram" value={contact.instagram} onChange={(event) => setContact({ ...contact, instagram: event.target.value })} />
              </Field>
              <Field label="TikTok" htmlFor="contact-tiktok">
                <Input id="contact-tiktok" value={contact.tiktok} onChange={(event) => setContact({ ...contact, tiktok: event.target.value })} />
              </Field>
              <Field label="YouTube" htmlFor="contact-youtube">
                <Input id="contact-youtube" value={contact.youtube} onChange={(event) => setContact({ ...contact, youtube: event.target.value })} />
              </Field>
            </div>
          </ConfigPanel>
        ) : null}

        {activeTab === 'SEO' ? (
          <ConfigPanel title="SEO Configuration" onSave={() => saveConfig('seo_config', seo)} loading={loadingKey === 'seo_config'}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Meta Title" htmlFor="seo-title">
                <Input id="seo-title" value={seo.metaTitle} onChange={(event) => setSeo({ ...seo, metaTitle: event.target.value })} />
              </Field>
              <Field label="OG Image" htmlFor="seo-og">
                <Input id="seo-og" value={seo.ogImage} onChange={(event) => setSeo({ ...seo, ogImage: event.target.value })} />
              </Field>
              <Field label="Meta Description" htmlFor="seo-description">
                <Textarea id="seo-description" value={seo.metaDescription} rows={4} onChange={(event) => setSeo({ ...seo, metaDescription: event.target.value })} />
              </Field>
              <Field label="Keywords" htmlFor="seo-keywords">
                <Textarea id="seo-keywords" value={seo.keywords} rows={4} onChange={(event) => setSeo({ ...seo, keywords: event.target.value })} />
              </Field>
            </div>
          </ConfigPanel>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ConfigPanel({ title, loading, onSave, children }: { title: string; loading: boolean; onSave: () => void; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-lg font-bold text-primary">{title}</h2>
        <Button type="button" size="sm" onClick={onSave} disabled={loading}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-primary">{label}</label>
      {children}
    </div>
  )
}
