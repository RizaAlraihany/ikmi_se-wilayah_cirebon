import React from 'react'
import { render, screen } from '@testing-library/react'
import type { Prisma, WebConfig } from '@prisma/client'
import { ForbiddenError, UnauthorizedError } from '@/core/errors/custom-errors'
import { updateAboutContentAction, updateContactInfoAction, updateHomepageContentAction, updatePageHeroesContentAction, upsertWebConfigAction } from '@/features/web-config/actions'
import { normalizePublicContactInfo } from '@/features/web-config/contact-contract'
import { defaultWebConfig } from '@/features/web-config/default-config'
import { aboutContentSchema, homepageContentSchema, normalizeAboutContent, normalizeHomepageContent, normalizePageHeroesContent, pageHeroesContentSchema } from '@/features/web-config/content-contract'
import { webConfigQueries } from '@/features/web-config/queries'
import { webConfigService } from '@/features/web-config/services'
import { classifyWebConfigKey, isWritableWebConfigKey, webConfigKeyPolicy } from '@/features/web-config/policy'
import { requireAuth, requireRoleForUser } from '@/core/authorization/guards'
import { revalidatePath } from 'next/cache'
import { prismaMock } from '../prisma-mock'
import { PublicFooter } from '@/app/(public)/_components/public-footer'
import ContactPage from '@/app/(public)/kontak/page'

jest.mock('@/core/authorization/guards', () => ({
  requireAuth: jest.fn(),
  requirePermission: jest.fn(),
  requireRoleForUser: jest.fn(),
}))
jest.mock('@/core/security/rate-limiter', () => ({
  rateLimit: jest.fn().mockResolvedValue(1),
  RateLimitError: class RateLimitError extends Error {},
}))
jest.mock('@/features/cms/access', () => ({ requireCmsUpdate: jest.fn().mockResolvedValue(undefined) }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement('img', Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== 'fill' && key !== 'priority'),
  )),
}))

const contact = {
  email: 'contact@ikmi.test',
  whatsapp: '+62 812 3456 7890',
  address: 'Cirebon, Jawa Barat',
  instagram: 'https://instagram.com/ikmicirebon',
  tiktok: '',
  youtube: '',
}

const normalizedContact = { ...contact, tiktok: null, youtube: null }

const organizationActor = {
  id: 'organization-admin', roleId: 'admin_organization', sessionVersion: 1,
  departmentId: 'organization', positionId: null, name: 'Organization', email: 'organization@ikmi.test',
}

const komdigiActor = { ...organizationActor, id: 'komdigi-admin', roleId: 'admin_komdigi' }

const homepageContent = {
  hero: {
    eyebrow: 'Beranda IKMI',
    title: 'Judul Beranda X',
    subtitle: 'Deskripsi Beranda X',
    images: ['https://res.cloudinary.com/demo/image/upload/hero.webp'],
    floatingMenu1Text: 'Gabung IKMI',
    floatingMenu1Link: '/#gabung',
    floatingMenu2Text: 'Publikasi',
    floatingMenu2Link: '/publikasi',
    primaryCtaLabel: 'Agenda X',
    primaryCtaHref: '/kegiatan',
    secondaryCtaLabel: 'Tentang X',
    secondaryCtaHref: '/tentang',
  },
  profile: { title: 'Profil X', description: 'Deskripsi profil X', imageUrl: defaultWebConfig.landing_about.imageUrl, imageAlt: 'Profil X', ctaLabel: 'Tentang X', ctaHref: '/tentang' },
  cta: { title: 'Gabung X', description: 'Deskripsi CTA X', label: 'Gabung X', href: '/gabung' },
}

const aboutContent = {
  hero: defaultWebConfig.about_page.hero,
  profile: defaultWebConfig.about_page.profile,
  history: { ...defaultWebConfig.about_page.history, title: 'Sejarah X', description: 'Narasi sejarah X' },
  structureCta: defaultWebConfig.about_page.structureCta,
  pengurus: {
    sectionTitle: '05 — PROFIL PENGURUS',
    subtitle: 'Struktur pengurus periode aktif diambil dari data master Struktur Pengurus.',
    showPengurus: true,
    closingTitle: 'Satu Tim, Satu Tujuan',
    closingDescription: 'Setiap pengurus berkontribusi sesuai perannya. Bersama membangun organisasi yang kuat dan bermakna.',
    ctaLabel: 'Lihat Seluruh Struktur',
    ctaHref: '/struktur',
  },
  slider: {
    sectionTitle: '06 — SLIDER KEPENGURUSAN',
    items: [],
  },
}

const pageHeroesContent = defaultWebConfig.page_heroes

let storedWebConfigs: Map<string, WebConfig>

function webConfigRecord(key: string, valueJson: string): WebConfig {
  return {
    id: 'contact-config',
    key,
    valueJson,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  }
}

function prismaPromise<T>(value: T): Prisma.PrismaPromise<T> {
  return Promise.resolve(value) as Prisma.PrismaPromise<T>
}

beforeEach(() => {
  jest.mocked(requireAuth).mockResolvedValue(organizationActor as never)
  jest.mocked(requireRoleForUser).mockImplementation(async (actor, roles) => {
    const roleId = typeof actor === 'string' ? null : actor.roleId
    if (!roleId || !roles.includes(roleId as never)) throw new ForbiddenError('Role Anda tidak dapat menjalankan aksi ini.')
    return actor as never
  })
  storedWebConfigs = new Map()
  prismaMock.webConfig.findFirst.mockImplementation((args) => {
    const key = args?.where?.key
    return prismaPromise(typeof key === 'string' ? storedWebConfigs.get(key) ?? null : null) as ReturnType<typeof prismaMock.webConfig.findFirst>
  })
  prismaMock.webConfig.upsert.mockImplementation((args) => {
    const key = args.where.key
    if (typeof key !== 'string') throw new Error('WebConfig key is required for the persistence mock.')
    const valueJson = typeof args.update.valueJson === 'string' ? args.update.valueJson : args.create.valueJson
    const record = webConfigRecord(key, valueJson)
    storedWebConfigs.set(key, record)
    return prismaPromise(record) as ReturnType<typeof prismaMock.webConfig.upsert>
  })
  prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-contact' } as never)
  prismaMock.$transaction.mockImplementation((async (operations: unknown) => Promise.all(operations as Promise<unknown>[])) as never)
})

describe('ALIGN-001 WebConfig Contact contract', () => {
  it('classifies active keys and keeps only contact_info writable', () => {
    expect(classifyWebConfigKey('contact_info')).toBe('CONTACT_CMS')
    expect(classifyWebConfigKey('landing_hero')).toBe('HOME_CMS')
    expect(classifyWebConfigKey('about_page')).toBe('ABOUT_CMS')
    expect(classifyWebConfigKey('cabinet:period-1')).toBe('LEGACY')
    expect(classifyWebConfigKey('unknown')).toBe('UNKNOWN')
    expect(isWritableWebConfigKey('contact_info')).toBe(true)
    expect(isWritableWebConfigKey('landing_hero')).toBe(false)
    expect(isWritableWebConfigKey('page_heroes')).toBe(false)
    expect(webConfigKeyPolicy.page_heroes.writable).toBe(false)
    expect(webConfigKeyPolicy.contact_info.roles).toContain('admin_organization')
    expect(webConfigKeyPolicy.contact_info.roles).not.toContain('admin_komdigi')
  })

  it('normalizes the public projection without metadata or dangerous URLs', () => {
    expect(normalizePublicContactInfo({ ...contact, instagram: 'javascript:alert(1)', id: 'private', updatedAt: 'private' })).toEqual({
      email: contact.email,
      whatsapp: contact.whatsapp,
      address: contact.address,
      instagram: null,
      tiktok: null,
      youtube: null,
    })
  })

  it('uses the approved fallback only when no contact record exists, then lets configured contact win', async () => {
    await expect(webConfigQueries.getPublicContactInfo()).resolves.toEqual(expect.objectContaining({ email: 'ikmikominfo@gmail.com' }))
    storedWebConfigs.set('contact_info', webConfigRecord('contact_info', JSON.stringify(contact)))
    await expect(webConfigQueries.getPublicContactInfo()).resolves.toEqual(normalizedContact)
  })

  it('uses one backing WebConfig record for dashboard writes and public reads', async () => {
    const contactX = { ...contact, email: 'contact-x@ikmi.test', address: 'Alamat X' }
    const contactY = { ...contact, email: 'contact-y@ikmi.test', address: 'Alamat Y', instagram: 'https://instagram.com/ikmi-y' }

    await webConfigService.updateContactInfo(contactX, organizationActor as never)
    await expect(webConfigQueries.getPublicContactInfo()).resolves.toEqual(expect.objectContaining({
      email: 'contact-x@ikmi.test',
      address: 'Alamat X',
    }))

    await webConfigService.updateContactInfo(contactY, organizationActor as never)
    const publicContact = await webConfigQueries.getPublicContactInfo()
    expect(publicContact).toEqual(expect.objectContaining({
      email: 'contact-y@ikmi.test',
      address: 'Alamat Y',
      instagram: 'https://instagram.com/ikmi-y',
    }))
    expect(publicContact.email).not.toBe('contact-x@ikmi.test')
  })

  it('uses the same persistence records for Homepage CMS writes and the real public reader', async () => {
    const contentY = {
      ...homepageContent,
      hero: { ...homepageContent.hero, title: 'Judul Beranda Y' },
      profile: { ...homepageContent.profile, description: 'Deskripsi profil Y' },
    }

    await webConfigService.updateHomepageContent(homepageContent, komdigiActor as never)
    await expect(webConfigQueries.getPublicHomepageContent()).resolves.toEqual(expect.objectContaining({
      hero: expect.objectContaining({ title: 'Judul Beranda X' }),
      profile: expect.objectContaining({ description: 'Deskripsi profil X' }),
    }))

    await webConfigService.updateHomepageContent(contentY, komdigiActor as never)
    await expect(webConfigQueries.getPublicHomepageContent()).resolves.toEqual(expect.objectContaining({
      hero: expect.objectContaining({ title: 'Judul Beranda Y' }),
      profile: expect.objectContaining({ description: 'Deskripsi profil Y' }),
    }))
  })

  it('rejects unsafe editorial paths and images while normalizing legacy records safely', () => {
    expect(homepageContentSchema.safeParse({ ...homepageContent, cta: { ...homepageContent.cta, href: 'https://evil.test' } }).success).toBe(false)
    expect(homepageContentSchema.safeParse({ ...homepageContent, profile: { ...homepageContent.profile, imageUrl: 'https://evil.test/image.jpg' } }).success).toBe(false)
    expect(aboutContentSchema.safeParse({ ...aboutContent, structureCta: { ...aboutContent.structureCta, href: '//evil.test' } }).success).toBe(false)
    expect(normalizeHomepageContent({ landing_about: { imageUrl: 'javascript:alert(1)', ctaHref: '//evil.test' } }).profile).toEqual(expect.objectContaining({ imageUrl: defaultWebConfig.landing_about.imageUrl, ctaHref: '/tentang' }))
    expect(normalizeAboutContent({ historyTitle: 'Legacy title', history: 'Legacy history', hero: { imageUrl: 'data:image/svg+xml,unsafe' } })).toEqual(expect.objectContaining({ history: expect.objectContaining({ title: 'Legacy title', description: 'Legacy history' }), hero: expect.objectContaining({ imageUrl: defaultWebConfig.about_page.hero.imageUrl }) }))
  })

  it('applies the shared public image policy to page heroes and safely normalizes blank or unsafe records', () => {
    const withImage = (imageUrl: string) => ({ ...pageHeroesContent, kegiatan: { ...pageHeroesContent.kegiatan, imageUrl } })
    expect(pageHeroesContentSchema.safeParse(withImage('/uploads/hero.webp')).success).toBe(true)
    expect(pageHeroesContentSchema.safeParse(withImage('https://res.cloudinary.com/example/image/upload/hero.webp')).success).toBe(true)
    expect(pageHeroesContentSchema.safeParse(withImage('javascript:alert(1)')).success).toBe(false)
    expect(pageHeroesContentSchema.safeParse(withImage('https://evil.test/hero.webp')).success).toBe(false)
    expect(pageHeroesContentSchema.safeParse(withImage('')).success).toBe(false)
    expect(normalizePageHeroesContent({ kegiatan: { imageUrl: '' } }).kegiatan.imageUrl).toBe(pageHeroesContent.kegiatan.imageUrl)
    expect(normalizePageHeroesContent({ kegiatan: { imageUrl: 'data:image/svg+xml,unsafe' } }).kegiatan.imageUrl).toBe(pageHeroesContent.kegiatan.imageUrl)
  })

  it('rejects unsafe page-hero image URLs at the action boundary without persistence', async () => {
    jest.mocked(requireAuth).mockResolvedValueOnce(komdigiActor as never)
    const unsafe = { ...pageHeroesContent, kegiatan: { ...pageHeroesContent.kegiatan, imageUrl: 'https://evil.test/hero.webp' } }
    await expect(updatePageHeroesContentAction(unsafe)).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }))
    expect(prismaMock.webConfig.upsert).not.toHaveBeenCalled()
  })

  it('uses the same persistence record for About CMS writes and the real public reader', async () => {
    const aboutX = aboutContent
    const aboutY = { ...aboutContent, history: { ...aboutContent.history, title: 'Sejarah Y', description: 'Narasi sejarah Y' } }

    await expect(updateAboutContentAction(aboutX)).resolves.toEqual({ success: true })
    await expect(webConfigQueries.getPublicAboutContent()).resolves.toEqual(aboutX)
    await expect(updateAboutContentAction(aboutY)).resolves.toEqual({ success: true })
    await expect(webConfigQueries.getPublicAboutContent()).resolves.toEqual(aboutY)
  })

  it('enforces separate Homepage and About ownership at the server action boundary', async () => {
    jest.mocked(requireAuth).mockResolvedValueOnce(organizationActor as never)
    await expect(updateHomepageContentAction(homepageContent)).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }))

    jest.mocked(requireAuth).mockResolvedValueOnce(komdigiActor as never)
    await expect(updateHomepageContentAction(homepageContent)).resolves.toEqual({ success: true })

    jest.mocked(requireAuth).mockResolvedValueOnce(komdigiActor as never)
    await expect(updateAboutContentAction(aboutContent)).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }))
  })

  it('persists only the explicit contact fields and revalidates the contact page and public layout', async () => {
    await expect(updateContactInfoAction(contact)).resolves.toEqual({ success: true })
    expect(prismaMock.webConfig.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { key: 'contact_info' },
      create: { key: 'contact_info', valueJson: JSON.stringify(normalizedContact) },
    }))
    expect(revalidatePath).toHaveBeenCalledWith('/kontak')
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('enforces canonical ownership: Super Admin and Organization allowed, Komdigi denied even with legacy permissions', async () => {
    await expect(webConfigService.updateContactInfo(contact, { ...organizationActor, roleId: 'super_admin' } as never)).resolves.toBeDefined()
    await expect(webConfigService.updateContactInfo(contact, organizationActor as never)).resolves.toBeDefined()
    await expect(webConfigService.updateContactInfo(contact, { ...organizationActor, roleId: 'admin_komdigi' } as never)).rejects.toBeInstanceOf(ForbiddenError)
    expect(requireRoleForUser).toHaveBeenCalledWith(expect.anything(), ['super_admin', 'admin_organization'])
  })

  it('rejects malformed payloads, Contact key escalation, unauthenticated sessions, and stale sessions before mutation', async () => {
    await expect(updateContactInfoAction({ ...contact, instagram: 'data:text/html,unsafe' })).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }))
    await expect(upsertWebConfigAction({ key: 'landing_hero', valueJson: JSON.stringify(contact) })).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }))
    await expect(upsertWebConfigAction({ key: 'about_page', valueJson: JSON.stringify(contact) })).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }))
    await expect(upsertWebConfigAction({ key: 'unknown', valueJson: JSON.stringify(contact) })).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }))
    expect(prismaMock.webConfig.upsert).not.toHaveBeenCalled()

    jest.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError())
    await expect(updateContactInfoAction(contact)).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }))
    expect(prismaMock.webConfig.upsert).not.toHaveBeenCalled()

    jest.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError('Sesi tidak lagi valid.'))
    await expect(updateContactInfoAction(contact)).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }))
    expect(prismaMock.webConfig.upsert).not.toHaveBeenCalled()
  })

  it('rejects a SYSTEM_INTERNAL seo_config mutation through the active config action', async () => {
    await expect(upsertWebConfigAction({ key: 'seo_config', valueJson: JSON.stringify(contact) })).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }))
    expect(prismaMock.webConfig.upsert).not.toHaveBeenCalled()
  })

  it('projects the same normalized configured contact to Contact and Footer without active dangerous links', async () => {
    prismaMock.webConfig.findFirst.mockResolvedValue({ valueJson: JSON.stringify({ ...contact, instagram: 'vbscript:unsafe' }) } as never)
    render(await ContactPage())
    expect(screen.getAllByText(contact.email).length).toBeGreaterThan(0)

    render(await PublicFooter())
    expect(screen.getAllByText(contact.email).length).toBeGreaterThan(1)
    expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument()
  })
})
