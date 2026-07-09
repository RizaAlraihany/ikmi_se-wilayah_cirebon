import { programQueries } from '@/features/programs/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ListTodo, Plus, Banknote } from 'lucide-react'
import { ActivityList } from './components/ActivityList'
import { EventList } from './components/EventList'

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const program = await programQueries.getProgramById(p.id)

  if (!program) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/programs" className="text-muted-foreground hover:text-primary">
          &larr; Kembali
        </Link>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Detail Program</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge tone={program.status === 'COMPLETED' ? 'success' : program.status === 'ONGOING' ? 'primary' : 'warning'} className="mb-2">
                    {program.status}
                  </Badge>
                  <CardTitle className="text-2xl">{program.name}</CardTitle>
                </div>
                <Badge tone="surface">{program.department.name}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>{program.description}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20 text-primary font-medium">
                <Banknote className="w-5 h-5" />
                <span>Anggaran Direncanakan: Rp {Number(program.budgetPlan).toLocaleString('id-ID')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Activity Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="w-5 h-5" />
                Aktivitas & Milestone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityList activities={program.activities} programId={program.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Event Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Daftar Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventList events={program.events} />
              
              <Link href={`/admin/events/new?programId=${program.id}`} className="block mt-4">
                <Button variant="secondary" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Event Baru
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
