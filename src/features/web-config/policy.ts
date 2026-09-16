import { KOMDIGI_DASHBOARD_ROLE_IDS, ORGANIZATION_DASHBOARD_ROLE_IDS, type DashboardRoleId } from '@/core/auth/roles'
import { CONTACT_CONFIG_KEY } from './contact-contract'

export type WebConfigClassification = 'GLOBAL_PUBLIC' | 'HOME_CMS' | 'ABOUT_CMS' | 'CONTACT_CMS' | 'SYSTEM_INTERNAL' | 'LEGACY' | 'UNKNOWN'

/** Read compatibility is broader than write authorization. */
export const webConfigKeyPolicy = {
  landing_hero: { classification: 'HOME_CMS', writable: true, roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  landing_about: { classification: 'HOME_CMS', writable: true, roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  landing_sections: { classification: 'HOME_CMS', writable: false },
  landing_cta: { classification: 'HOME_CMS', writable: true, roles: KOMDIGI_DASHBOARD_ROLE_IDS },
  about_page: { classification: 'ABOUT_CMS', writable: true, roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  about_page_extended: { classification: 'ABOUT_CMS', writable: false },
  [CONTACT_CONFIG_KEY]: { classification: 'CONTACT_CMS', writable: true, roles: ORGANIZATION_DASHBOARD_ROLE_IDS },
  seo_config: { classification: 'SYSTEM_INTERNAL', writable: false },
  structure_page_extended: { classification: 'LEGACY', writable: false },
} as const satisfies Record<string, { classification: WebConfigClassification; writable: boolean; roles?: readonly DashboardRoleId[] }>

export function classifyWebConfigKey(key: string): WebConfigClassification {
  if (key.startsWith('cabinet:')) return 'LEGACY'
  return webConfigKeyPolicy[key as keyof typeof webConfigKeyPolicy]?.classification ?? 'UNKNOWN'
}

export function isWritableWebConfigKey(key: string) {
  return key === CONTACT_CONFIG_KEY && webConfigKeyPolicy[key].writable
}
