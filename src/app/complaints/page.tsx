import { MessageSquareWarning } from 'lucide-react'
import { ComplaintForm } from './components/ComplaintForm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ComplaintPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <Badge tone="surface" className="mx-auto w-fit">
            <MessageSquareWarning className="mr-2 h-4 w-4 text-accent" aria-hidden="true" />
            Kanal Advokasi
          </Badge>
          <h1 className="font-heading text-4xl font-extrabold leading-tight text-primary">Sampaikan Aspirasi Anda</h1>
          <p className="text-muted">
            Laporkan kendala, aspirasi, atau masukan secara aman agar tim Advokasi dapat menindaklanjuti dengan rapi.
          </p>
        </div>
        <Card>
          <CardContent className="p-6 sm:p-8">
            <ComplaintForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
