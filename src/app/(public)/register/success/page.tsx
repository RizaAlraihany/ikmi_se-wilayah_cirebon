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
    <main className="bg-background px-4 py-24 md:px-6 md:py-32 lg:px-8 min-h-screen flex items-center justify-center">
      <div className="mx-auto max-w-lg text-center space-y-6">
        <CheckCircle2 className="mx-auto h-20 w-20 text-accent" aria-hidden="true" />
        
        <h1 className="font-heading text-3xl font-extrabold text-primary md:text-4xl">
          Pendaftaran Berhasil!
        </h1>
        
        <p className="text-base leading-relaxed text-primary/70">
          Data Anda sudah kami terima dan akan direview oleh Departemen Kaderisasi. 
          Sambil menunggu proses verifikasi, silakan bergabung dengan Grup WhatsApp Calon Anggota IKMI Cirebon untuk mendapatkan informasi terbaru.
        </p>

        <div className="pt-6">
          <ButtonLink 
            href={waGroupLink} 
            className="w-full sm:w-auto"
            aria-label="Gabung Grup WhatsApp Calon Anggota"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gabung Grup WhatsApp IKMI
          </ButtonLink>
        </div>

        <div className="pt-4">
          <ButtonLink 
            href="/" 
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Kembali ke Beranda
          </ButtonLink>
        </div>
      </div>
    </main>
  )
}
