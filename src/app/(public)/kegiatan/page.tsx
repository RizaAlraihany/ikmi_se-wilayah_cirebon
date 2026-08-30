import { permanentRedirect } from 'next/navigation'

/**
 * Program and Agenda now have their own public destinations. Keep this
 * legacy route so external links continue to resolve without indexing a
 * duplicate aggregate page.
 */
export default function LegacyKegiatanPage() {
  permanentRedirect('/')
}
