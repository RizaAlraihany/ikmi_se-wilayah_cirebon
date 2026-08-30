import { permanentRedirect } from 'next/navigation'

export default async function LegacyBlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const category = (await searchParams).category
  permanentRedirect(category && /^[a-z0-9-]+$/.test(category) ? `/publikasi?category=${category}` : '/publikasi')
}
