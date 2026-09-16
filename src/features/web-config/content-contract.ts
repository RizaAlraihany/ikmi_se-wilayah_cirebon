import { z } from 'zod'
import { defaultWebConfig } from './default-config'

const requiredText = (label: string, max: number) => z.string().trim().min(1, `${label} wajib diisi.`).max(max, `${label} terlalu panjang.`)
const publicPath = z.string().trim().min(1, 'Tautan wajib diisi.').max(240).refine(
  (value) => value.startsWith('/') && !value.startsWith('//'),
  'Tautan harus berupa path internal yang diawali garis miring.',
)

export const homepageContentSchema = z.object({
  hero: z.object({
    eyebrow: requiredText('Eyebrow hero', 80),
    title: requiredText('Judul hero', 160),
    subtitle: requiredText('Deskripsi hero', 500),
    primaryCtaLabel: requiredText('Label CTA utama', 80),
    primaryCtaHref: publicPath,
    secondaryCtaLabel: requiredText('Label CTA kedua', 80),
    secondaryCtaHref: publicPath,
  }).strict(),
  profile: z.object({
    title: requiredText('Judul profil', 160),
    description: requiredText('Deskripsi profil', 900),
  }).strict(),
  cta: z.object({
    title: requiredText('Judul CTA', 160),
    description: requiredText('Deskripsi CTA', 900),
  }).strict(),
}).strict()

export type HomepageContentInput = z.infer<typeof homepageContentSchema>

export const aboutContentSchema = z.object({
  historyTitle: requiredText('Judul sejarah', 160),
  history: requiredText('Isi sejarah', 2_000),
}).strict()

export type AboutContentInput = z.infer<typeof aboutContentSchema>

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

  return {
    hero: {
      eyebrow: textValue(hero.eyebrow, fallbackHero.eyebrow),
      title: textValue(hero.title, fallbackHero.title),
      subtitle: textValue(hero.subtitle, fallbackHero.subtitle),
      primaryCtaLabel: textValue(hero.primaryCtaLabel, fallbackHero.primaryCtaLabel),
      primaryCtaHref: internalPathValue(hero.primaryCtaHref, fallbackHero.primaryCtaHref),
      secondaryCtaLabel: textValue(hero.secondaryCtaLabel, fallbackHero.secondaryCtaLabel),
      secondaryCtaHref: internalPathValue(hero.secondaryCtaHref, fallbackHero.secondaryCtaHref),
    },
    profile: {
      title: textValue(profile.title, fallbackProfile.title),
      description: textValue(profile.description, fallbackProfile.description),
    },
    cta: {
      title: textValue(cta.title, fallbackCta.title),
      description: textValue(cta.description, fallbackCta.description),
    },
  }
}

export function normalizeAboutContent(value: unknown): AboutContentInput {
  const source = objectValue(value)
  const fallback = defaultWebConfig.about_page
  return {
    historyTitle: textValue(source.historyTitle, fallback.historyTitle),
    history: textValue(source.history, fallback.history),
  }
}
