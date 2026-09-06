import { permanentRedirect } from 'next/navigation'

/** Compatibility for historical Agenda URLs; detail is now modal-only on /kegiatan. */
export default function LegacyAgendaDetailPage() {
  permanentRedirect('/kegiatan')
}
