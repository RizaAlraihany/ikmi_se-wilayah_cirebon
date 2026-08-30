import { siteUrl } from './site'

export type BreadcrumbItem = { name: string; path: string }

export function breadcrumbStructuredData(items: readonly BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  }
}

export function organizationStructuredData() {
  return {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'IKMI Cirebon',
    alternateName: [
      'IKMI Se-Wilayah Cirebon',
      'Ikatan Keluarga Mahasiswa Indramayu',
      'Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon',
    ],
    url: siteUrl,
    email: 'ikmikominfo@gmail.com',
    sameAs: ['https://instagram.com/ikmicirebon'],
  }
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
