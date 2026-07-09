import { CheckCircle2 } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'

export const metadata = {
  title: 'Pendaftaran Berhasil - IKMI Cirebon',
  description: 'Terima kasih telah mendaftar sebagai anggota IKMI Cirebon.',
}

export default function RegisterSuccessPage() {
  // Use a generic WhatsApp Group link for now, could be managed via web-config later
  const waGroupLink = 'https://chat.whatsapp.com/ikmicirebon'

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 md:px-6 md:py-32 lg:px-8">
      <div className="mx-auto max-w-lg space-y-4 text-center md:space-y-6">
        <CheckCircle2 className="mx-auto h-14 w-14 text-accent md:h-20 md:w-20" aria-hidden="true" />
        
        <h1 className="font-heading text-2xl font-extrabold text-primary md:text-4xl">
          Pendaftaran Berhasil!
        </h1>
        
        <p className="text-sm leading-6 text-primary/70 md:text-base md:leading-relaxed">
          Data Anda sudah kami terima. Silakan bergabung dengan Grup WhatsApp Calon Anggota IKMI Cirebon untuk mendapatkan informasi terbaru.
        </p>

        <div className="pt-3 md:pt-6">
          <ButtonLink 
            href={waGroupLink} 
            className="min-h-10 w-full text-sm sm:w-auto md:min-h-11"
            aria-label="Gabung Grup WhatsApp Calon Anggota"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gabung Grup WhatsApp IKMI
          </ButtonLink>
        </div>

        <div className="pt-2 md:pt-4">
          <ButtonLink 
            href="/" 
            variant="secondary"
            className="min-h-10 w-full text-sm sm:w-auto md:min-h-11"
          >
            Kembali ke Beranda
          </ButtonLink>
        </div>
      </div>
    </main>
  )
}
