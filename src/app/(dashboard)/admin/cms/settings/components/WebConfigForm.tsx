'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { upsertWebConfigAction, uploadWebConfigImageAction } from '@/features/web-config/actions'
import { defaultWebConfig } from '@/features/web-config/default-config'
import { cn } from '@/lib/utils'

type HeroConfig = typeof defaultWebConfig.landing_hero
type AboutConfig = typeof defaultWebConfig.landing_about
type CtaConfig = typeof defaultWebConfig.landing_cta
type LandingSectionsConfig = typeof defaultWebConfig.landing_sections
type AboutPageConfig = typeof defaultWebConfig.about_page
type ContactConfig = typeof defaultWebConfig.contact_info
type SeoConfig = typeof defaultWebConfig.seo_config

type ConfigValues = {
  landing_hero?: unknown
  landing_about?: unknown
  landing_sections?: unknown
  landing_cta?: unknown
  about_page?: unknown
  contact_info?: unknown
  seo_config?: unknown
}

type WebConfigTab = 'HERO' | 'LANDING' | 'ABOUT' | 'CONTACT' | 'SEO'

const tabs: { value: WebConfigTab; label: string }[] = [
  { value: 'HERO', label: 'Hero' },
  { value: 'LANDING', label: 'Landing' },
  { value: 'ABOUT', label: 'About' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'SEO', label: 'SEO' },
]

function withFallback<T>(value: unknown, fallback: T): T {
  return typeof value === 'object' && value !== null ? { ...fallback, ...value } : fallback
}

function lines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
}

function slidesToText(slides: { url: string; label: string }[]) {
  return slides.map((slide) => `${slide.url}|${slide.label}`).join('\n')
}

function textToSlides(value: string) {
  return lines(value).map((line, index) => {
    const [url, label] = line.split('|')
    return {
      url: url?.trim() || '',
      label: label?.trim() || `Slide ${index + 1}`,
    }
  })
}

function imageItemsToText(items: { url: string; label: string }[]) {
  return items.map((item) => `${item.url}|${item.label}`).join('\n')
}

function textToImageItems(value: string) {
  return lines(value).map((line, index) => {
    const [url, label] = line.split('|')
    return {
      url: url?.trim() || '',
      label: label?.trim() || `Gambar ${index + 1}`,
    }
  })
}

function pillarsToText(items: { title: string; description: string }[]) {
  return items.map((item) => `${item.title}|${item.description}`).join('\n')
}

function textToPillars(value: string) {
  return lines(value).map((line) => {
    const [title, description] = line.split('|')
    return {
      title: title?.trim() || '',
      description: description?.trim() || '',
    }
  }).filter((item) => item.title)
}

export function WebConfigForm({ configs }: { configs: ConfigValues }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<WebConfigTab>('HERO')
  const [message, setMessage] = useState('')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const [hero, setHero] = useState<HeroConfig>(withFallback(configs.landing_hero, defaultWebConfig.landing_hero))
  const [landingAbout, setLandingAbout] = useState<AboutConfig>(withFallback(configs.landing_about, defaultWebConfig.landing_about))
  const [landingSections, setLandingSections] = useState<LandingSectionsConfig>(withFallback(configs.landing_sections, defaultWebConfig.landing_sections))
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

  async function uploadImage(file: File | undefined, onUploaded: (url: string) => void) {
    if (!file) return
    setLoadingKey(`upload:${file.name}`)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadWebConfigImageAction(formData)

    if (result.error || !result.url) {
      setMessage(result.error || 'Upload gambar gagal.')
    } else {
      onUploaded(result.url)
      setMessage('Gambar berhasil diupload ke Cloudinary.')
    }

    setLoadingKey(null)
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
              <Field label="Eyebrow" htmlFor="hero-eyebrow">
                <Input id="hero-eyebrow" value={hero.eyebrow} onChange={(event) => setHero({ ...hero, eyebrow: event.target.value })} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="CTA Utama" htmlFor="hero-primary-cta">
                  <Input id="hero-primary-cta" value={hero.primaryCtaLabel} onChange={(event) => setHero({ ...hero, primaryCtaLabel: event.target.value })} />
                </Field>
                <Field label="URL CTA Utama" htmlFor="hero-primary-href">
                  <Input id="hero-primary-href" value={hero.primaryCtaHref} onChange={(event) => setHero({ ...hero, primaryCtaHref: event.target.value })} />
                </Field>
                <Field label="CTA Kedua" htmlFor="hero-secondary-cta">
                  <Input id="hero-secondary-cta" value={hero.secondaryCtaLabel} onChange={(event) => setHero({ ...hero, secondaryCtaLabel: event.target.value })} />
                </Field>
                <Field label="URL CTA Kedua" htmlFor="hero-secondary-href">
                  <Input id="hero-secondary-href" value={hero.secondaryCtaHref} onChange={(event) => setHero({ ...hero, secondaryCtaHref: event.target.value })} />
                </Field>
              </div>
              <Field label="Label Pilar" htmlFor="hero-pillars-label">
                <Input id="hero-pillars-label" value={hero.pillarsLabel} onChange={(event) => setHero({ ...hero, pillarsLabel: event.target.value })} />
              </Field>
              <Field label="Pilar Hero" htmlFor="hero-pillars">
                <Textarea
                  id="hero-pillars"
                  value={pillarsToText(hero.pillars)}
                  rows={6}
                  onChange={(event) => setHero({ ...hero, pillars: textToPillars(event.target.value) })}
                />
                <p className="text-xs text-muted">Format: Judul|Deskripsi, satu pilar per baris.</p>
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

            <ConfigPanel title="Hero Images" onSave={() => saveConfig('landing_hero', hero)} loading={loadingKey === 'landing_hero'}>
              <ImageListField
                label="Foto Slideshow Hero"
                htmlFor="hero-slides"
                value={slidesToText(hero.slides)}
                help="Format: URL|Alt text, satu slide per baris."
                onChange={(value) => setHero({ ...hero, slides: textToSlides(value) })}
                onUpload={(url) => setHero({ ...hero, slides: [...hero.slides, { url, label: `Kegiatan IKMI ${hero.slides.length + 1}` }] })}
                uploadImage={uploadImage}
              />
              <ImageListField
                label="Logo Marquee Departemen"
                htmlFor="hero-logos"
                value={hero.departmentLogos.join('\n')}
                help="Satu URL logo per baris."
                onChange={(value) => setHero({ ...hero, departmentLogos: lines(value) })}
                onUpload={(url) => setHero({ ...hero, departmentLogos: [...hero.departmentLogos, url] })}
                uploadImage={uploadImage}
              />
            </ConfigPanel>
          </div>
        ) : null}

        {activeTab === 'LANDING' ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <ConfigPanel title="Section Tentang di Landing" onSave={() => saveConfig('landing_sections', landingSections)} loading={loadingKey === 'landing_sections'}>
              <Field label="Eyebrow" htmlFor="landing-about-eyebrow">
                <Input id="landing-about-eyebrow" value={landingSections.aboutEyebrow} onChange={(event) => setLandingSections({ ...landingSections, aboutEyebrow: event.target.value })} />
              </Field>
              <Field label="URL Gambar" htmlFor="landing-about-image">
                <Input id="landing-about-image" value={landingSections.aboutImageUrl} onChange={(event) => setLandingSections({ ...landingSections, aboutImageUrl: event.target.value })} />
              </Field>
              <UploadField
                label="Upload Gambar Tentang"
                onUpload={(url) => setLandingSections({ ...landingSections, aboutImageUrl: url })}
                uploadImage={uploadImage}
              />
              <Field label="Alt Gambar" htmlFor="landing-about-alt">
                <Input id="landing-about-alt" value={landingSections.aboutImageAlt} onChange={(event) => setLandingSections({ ...landingSections, aboutImageAlt: event.target.value })} />
              </Field>
              <Field label="Badge Gambar" htmlFor="landing-about-badge">
                <Input id="landing-about-badge" value={landingSections.aboutBadgeLabel} onChange={(event) => setLandingSections({ ...landingSections, aboutBadgeLabel: event.target.value })} />
              </Field>
              <Field label="Label Link" htmlFor="landing-about-link">
                <Input id="landing-about-link" value={landingSections.aboutLinkLabel} onChange={(event) => setLandingSections({ ...landingSections, aboutLinkLabel: event.target.value })} />
              </Field>
            </ConfigPanel>

            <ConfigPanel title="Section Pengurus" onSave={() => saveConfig('landing_sections', landingSections)} loading={loadingKey === 'landing_sections'}>
              <Field label="Eyebrow" htmlFor="structure-eyebrow">
                <Input id="structure-eyebrow" value={landingSections.structureEyebrow} onChange={(event) => setLandingSections({ ...landingSections, structureEyebrow: event.target.value })} />
              </Field>
              <Field label="Judul" htmlFor="structure-title">
                <Input id="structure-title" value={landingSections.structureTitle} onChange={(event) => setLandingSections({ ...landingSections, structureTitle: event.target.value })} />
              </Field>
              <Field label="Teks Aksen" htmlFor="structure-accent">
                <Input id="structure-accent" value={landingSections.structureAccent} onChange={(event) => setLandingSections({ ...landingSections, structureAccent: event.target.value })} />
              </Field>
              <Field label="Label Tombol" htmlFor="structure-button">
                <Input id="structure-button" value={landingSections.structureButtonLabel} onChange={(event) => setLandingSections({ ...landingSections, structureButtonLabel: event.target.value })} />
              </Field>
            </ConfigPanel>

            <ConfigPanel title="Section Agenda & Dokumentasi" onSave={() => saveConfig('landing_sections', landingSections)} loading={loadingKey === 'landing_sections'}>
              <Field label="Eyebrow" htmlFor="agenda-eyebrow">
                <Input id="agenda-eyebrow" value={landingSections.agendaEyebrow} onChange={(event) => setLandingSections({ ...landingSections, agendaEyebrow: event.target.value })} />
              </Field>
              <Field label="Judul" htmlFor="agenda-title">
                <Input id="agenda-title" value={landingSections.agendaTitle} onChange={(event) => setLandingSections({ ...landingSections, agendaTitle: event.target.value })} />
              </Field>
              <Field label="Deskripsi" htmlFor="agenda-description">
                <Textarea id="agenda-description" value={landingSections.agendaDescription} rows={3} onChange={(event) => setLandingSections({ ...landingSections, agendaDescription: event.target.value })} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Status Agenda" htmlFor="agenda-status">
                  <Input id="agenda-status" value={landingSections.agendaStatusLabel} onChange={(event) => setLandingSections({ ...landingSections, agendaStatusLabel: event.target.value })} />
                </Field>
                <Field label="Label Tombol" htmlFor="agenda-button">
                  <Input id="agenda-button" value={landingSections.agendaButtonLabel} onChange={(event) => setLandingSections({ ...landingSections, agendaButtonLabel: event.target.value })} />
                </Field>
              </div>
              <Field label="Empty Text" htmlFor="agenda-empty">
                <Input id="agenda-empty" value={landingSections.agendaEmptyText} onChange={(event) => setLandingSections({ ...landingSections, agendaEmptyText: event.target.value })} />
              </Field>
              <ImageListField
                label="Gambar Dokumentasi"
                htmlFor="gallery-images"
                value={imageItemsToText(landingSections.galleryImages)}
                help="Format: URL|Alt text, satu gambar per baris."
                onChange={(value) => setLandingSections({ ...landingSections, galleryImages: textToImageItems(value) })}
                onUpload={(url) => setLandingSections({ ...landingSections, galleryImages: [...landingSections.galleryImages, { url, label: `Dokumentasi kegiatan ${landingSections.galleryImages.length + 1}` }] })}
                uploadImage={uploadImage}
              />
              <Field label="Label Placeholder Galeri" htmlFor="gallery-fallback">
                <Input id="gallery-fallback" value={landingSections.galleryFallbackLabel} onChange={(event) => setLandingSections({ ...landingSections, galleryFallbackLabel: event.target.value })} />
              </Field>
            </ConfigPanel>

            <ConfigPanel title="Section Blog & CTA" onSave={() => saveConfig('landing_sections', landingSections)} loading={loadingKey === 'landing_sections'}>
              <Field label="Eyebrow Blog" htmlFor="blog-eyebrow">
                <Input id="blog-eyebrow" value={landingSections.blogEyebrow} onChange={(event) => setLandingSections({ ...landingSections, blogEyebrow: event.target.value })} />
              </Field>
              <Field label="Judul Blog" htmlFor="blog-title">
                <Input id="blog-title" value={landingSections.blogTitle} onChange={(event) => setLandingSections({ ...landingSections, blogTitle: event.target.value })} />
              </Field>
              <Field label="Label Tombol Blog" htmlFor="blog-button">
                <Input id="blog-button" value={landingSections.blogButtonLabel} onChange={(event) => setLandingSections({ ...landingSections, blogButtonLabel: event.target.value })} />
              </Field>
              <Field label="Empty Text Blog" htmlFor="blog-empty">
                <Input id="blog-empty" value={landingSections.blogEmptyText} onChange={(event) => setLandingSections({ ...landingSections, blogEmptyText: event.target.value })} />
              </Field>
              <Field label="Eyebrow CTA" htmlFor="cta-eyebrow">
                <Input id="cta-eyebrow" value={landingSections.ctaEyebrow} onChange={(event) => setLandingSections({ ...landingSections, ctaEyebrow: event.target.value })} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Label Tombol CTA" htmlFor="cta-button-label">
                  <Input id="cta-button-label" value={landingSections.ctaButtonLabel} onChange={(event) => setLandingSections({ ...landingSections, ctaButtonLabel: event.target.value })} />
                </Field>
                <Field label="URL Tombol CTA" htmlFor="cta-button-href">
                  <Input id="cta-button-href" value={landingSections.ctaButtonHref} onChange={(event) => setLandingSections({ ...landingSections, ctaButtonHref: event.target.value })} />
                </Field>
              </div>
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
              <Field label="Badges" htmlFor="landing-about-badges">
                <Textarea
                  id="landing-about-badges"
                  value={landingAbout.badges.join('\n')}
                  rows={4}
                  onChange={(event) => setLandingAbout({ ...landingAbout, badges: lines(event.target.value) })}
                />
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

function UploadField({
  label,
  onUpload,
  uploadImage,
}: {
  label: string
  onUpload: (url: string) => void
  uploadImage: (file: File | undefined, onUploaded: (url: string) => void) => Promise<void>
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-primary">{label}</span>
      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-surface px-4 text-sm font-semibold text-primary ring-1 ring-line transition hover:bg-surface-alt">
        <Upload className="h-4 w-4" aria-hidden="true" />
        Upload ke Cloudinary
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            void uploadImage(event.target.files?.[0], onUpload)
            event.target.value = ''
          }}
        />
      </label>
    </div>
  )
}

function ImageListField({
  label,
  htmlFor,
  value,
  help,
  onChange,
  onUpload,
  uploadImage,
}: {
  label: string
  htmlFor: string
  value: string
  help: string
  onChange: (value: string) => void
  onUpload: (url: string) => void
  uploadImage: (file: File | undefined, onUploaded: (url: string) => void) => Promise<void>
}) {
  return (
    <div className="space-y-3">
      <Field label={label} htmlFor={htmlFor}>
        <Textarea id={htmlFor} value={value} rows={6} onChange={(event) => onChange(event.target.value)} />
        <p className="text-xs text-muted">{help}</p>
      </Field>
      <UploadField label={`Tambah ${label}`} onUpload={onUpload} uploadImage={uploadImage} />
    </div>
  )
}
