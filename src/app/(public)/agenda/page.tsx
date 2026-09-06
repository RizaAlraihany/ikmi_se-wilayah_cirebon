import { permanentRedirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** Retain the former public URL while making /kegiatan the v5 entry point. */
export default function LegacyAgendaPage() {
  permanentRedirect('/kegiatan')
}
