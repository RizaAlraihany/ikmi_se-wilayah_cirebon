import { z } from 'zod'
import { defaultWebConfig } from './default-config'
import { isSafeCampaignImageUrl } from '@/features/homepage-banner/domain'

const requiredText = (label: string, max: number) => z.string().trim().min(1, `${label} wajib diisi.`).max(max, `${label} terlalu panjang.`)
const publicPath = z.string().trim().min(1, 'Tautan wajib diisi.').max(240).refine(
  (value) => value.startsWith('/') && !value.startsWith('//'),
  'Tautan harus berupa path internal yang diawali garis miring.',
)
const safeImageUrl = z.string().trim().max(2048).refine(isSafeCampaignImageUrl, 'Gambar harus berupa path lokal atau URL HTTPS Cloudinary.')

export const homepageContentSchema = z.object({
  hero: z.object({
    eyebrow: requiredText('Eyebrow hero', 80),
    title: requiredText('Judul hero', 160),
    subtitle: requiredText('Deskripsi hero', 500),
    images: z.array(safeImageUrl).min(1, 'Minimal satu foto hero wajib dipilih.').max(12, 'Maksimal 12 foto hero dapat disimpan.'),
    floatingMenu1Text: requiredText('Label menu floating pertama', 80),
    floatingMenu1Link: publicPath,
    floatingMenu2Text: requiredText('Label menu floating kedua', 80),
    floatingMenu2Link: publicPath,
    primaryCtaLabel: requiredText('Label CTA utama', 80),
    primaryCtaHref: publicPath,
    secondaryCtaLabel: requiredText('Label CTA kedua', 80),
    secondaryCtaHref: publicPath,
  }).strict(),
  profile: z.object({
    title: requiredText('Judul profil', 160),
    description: requiredText('Deskripsi profil', 900),
    imageUrl: safeImageUrl,
    imageAlt: requiredText('Teks alternatif gambar profil', 180),
    ctaLabel: requiredText('Label CTA profil', 80),
    ctaHref: publicPath,
  }).strict(),
  cta: z.object({
    title: requiredText('Judul CTA', 160),
    description: requiredText('Deskripsi CTA', 900),
    label: requiredText('Label CTA Gabung', 80),
    href: publicPath,
  }).strict(),
}).strict()

export type HomepageContentInput = z.infer<typeof homepageContentSchema>

export const aboutContentSchema = z.object({
  hero: z.object({
    title: requiredText('Judul hero', 160),
    accent: requiredText('Aksen judul hero', 160),
    lead: requiredText('Deskripsi hero', 900),
    motto: requiredText('Motto', 120),
    imageUrl: safeImageUrl,
  }).strict(),
  profile: z.object({
    title: requiredText('Judul profil', 160),
    description: requiredText('Deskripsi profil', 1_200),
    quote: requiredText('Kutipan profil', 300),
    imageUrl: safeImageUrl,
  }).strict(),
  history: z.object({
    title: requiredText('Judul sejarah', 160),
    description: requiredText('Isi sejarah', 2_000),
    quote: requiredText('Kutipan sejarah', 300),
  }).strict(),
  structureCta: z.object({
    title: requiredText('Judul CTA Struktur', 160),
    description: requiredText('Deskripsi CTA Struktur', 900),
    label: requiredText('Label CTA Struktur', 80),
    href: publicPath,
  }).strict(),
}).strict()

export type AboutContentInput = z.infer<typeof aboutContentSchema>

const pageHeroSchema = z.object({
  title: requiredText('Judul', 160),
  lead: requiredText('Deskripsi', 900),
  imageUrl: safeImageUrl,
}).strict()

export const pageHeroesContentSchema = z.object({
  kegiatan: pageHeroSchema,
  publikasi: pageHeroSchema,
  'kirim-tulisan': pageHeroSchema,
  gabung: pageHeroSchema,
  kontak: pageHeroSchema,
}).strict()

export type PageHeroesContentInput = z.infer<typeof pageHeroesContentSchema>
export type PageHeroKey = keyof PageHeroesContentInput

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function textValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function internalPathValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback
}

export function normalizeHomepageContent(value: unknown): HomepageContentInput {
  const source = objectValue(value)
  const hero = objectValue(source.landing_hero)
  const profile = objectValue(source.landing_about)
  const cta = objectValue(source.landing_cta)
  const fallbackHero = defaultWebConfig.landing_hero
  const fallbackProfile = defaultWebConfig.landing_about
  const fallbackCta = defaultWebConfig.landing_cta
  const configuredImages = Array.isArray(hero.images)
    ? hero.images.filter((image): image is string => typeof image === 'string' && isSafeCampaignImageUrl(image))
    : Array.isArray(hero.slides)
      ? hero.slides
        .map((slide) => objectValue(slide).url)
        .filter((image): image is string => typeof image === 'string' && isSafeCampaignImageUrl(image))
      : []
  const fallbackImages = Array.isArray(fallbackHero.slides)
    ? fallbackHero.slides
      .map((slide) => objectValue(slide).url)
      .filter((image): image is string => typeof image === 'string' && isSafeCampaignImageUrl(image))
    : []

  return {
    hero: {
      eyebrow: textValue(hero.eyebrow, fallbackHero.eyebrow),
      title: textValue(hero.title, fallbackHero.title),
      subtitle: textValue(hero.subtitle, fallbackHero.subtitle),
      images: configuredImages.length > 0 ? configuredImages : fallbackImages,
      floatingMenu1Text: textValue(hero.floatingMenu1Text, 'Gabung IKMI'),
      floatingMenu1Link: internalPathValue(hero.floatingMenu1Link, '/#gabung'),
      floatingMenu2Text: textValue(hero.floatingMenu2Text, 'Publikasi'),
      floatingMenu2Link: internalPathValue(hero.floatingMenu2Link, '/publikasi'),
      primaryCtaLabel: textValue(hero.primaryCtaLabel, fallbackHero.primaryCtaLabel),
      primaryCtaHref: internalPathValue(hero.primaryCtaHref, fallbackHero.primaryCtaHref),
      secondaryCtaLabel: textValue(hero.secondaryCtaLabel, fallbackHero.secondaryCtaLabel),
      secondaryCtaHref: internalPathValue(hero.secondaryCtaHref, fallbackHero.secondaryCtaHref),
    },
    profile: {
      title: textValue(profile.title, fallbackProfile.title),
      description: textValue(profile.description, fallbackProfile.description),
      imageUrl: isSafeCampaignImageUrl(profile.imageUrl as string) ? (profile.imageUrl as string) : fallbackProfile.imageUrl,
      imageAlt: textValue(profile.imageAlt, fallbackProfile.imageAlt),
      ctaLabel: textValue(profile.ctaLabel, fallbackProfile.ctaLabel),
      ctaHref: internalPathValue(profile.ctaHref, fallbackProfile.ctaHref),
    },
    cta: {
      title: textValue(cta.title, fallbackCta.title),
      description: textValue(cta.description, fallbackCta.description),
      label: textValue(cta.label, fallbackCta.label),
      href: internalPathValue(cta.href, fallbackCta.href),
    },
  }
}

export function normalizeAboutContent(value: unknown): AboutContentInput {
  const source = objectValue(value)
  const fallback = defaultWebConfig.about_page
  const hero = objectValue(source.hero)
  const profile = objectValue(source.profile)
  const history = objectValue(source.history)
  const structureCta = objectValue(source.structureCta)
  return {
    hero: {
      title: textValue(hero.title, fallback.hero.title),
      accent: textValue(hero.accent, fallback.hero.accent),
      lead: textValue(hero.lead, fallback.hero.lead),
      motto: textValue(hero.motto, fallback.hero.motto),
      imageUrl: isSafeCampaignImageUrl(hero.imageUrl as string) ? (hero.imageUrl as string) : fallback.hero.imageUrl,
    },
    profile: {
      title: textValue(profile.title, fallback.profile.title),
      description: textValue(profile.description, fallback.profile.description),
      quote: textValue(profile.quote, fallback.profile.quote),
      imageUrl: isSafeCampaignImageUrl(profile.imageUrl as string) ? (profile.imageUrl as string) : fallback.profile.imageUrl,
    },
    history: {
      title: textValue(history.title ?? source.historyTitle, fallback.history.title),
      description: textValue(history.description ?? source.history, fallback.history.description),
      quote: textValue(history.quote, fallback.history.quote),
    },
    structureCta: {
      title: textValue(structureCta.title, fallback.structureCta.title),
      description: textValue(structureCta.description, fallback.structureCta.description),
      label: textValue(structureCta.label, fallback.structureCta.label),
      href: internalPathValue(structureCta.href, fallback.structureCta.href),
    },
  }
}

export function normalizePageHeroesContent(value: unknown): PageHeroesContentInput {
  const source = objectValue(value)
  const fallback = defaultWebConfig.page_heroes
  const result: Record<string, { title: string; lead: string; imageUrl: string }> = {}
  for (const key of Object.keys(fallback)) {
    const src = objectValue(source[key as keyof typeof source])
    const fb = fallback[key as keyof typeof fallback]
    result[key] = {
      title: textValue(src.title, fb.title),
      lead: textValue(src.lead, fb.lead),
      imageUrl: isSafeCampaignImageUrl(src.imageUrl as string) ? (src.imageUrl as string) : fb.imageUrl,
    }
  }
  return result as PageHeroesContentInput
}
