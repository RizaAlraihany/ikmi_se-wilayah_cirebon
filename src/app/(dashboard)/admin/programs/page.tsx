import { programQueries } from '@/features/programs/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { FolderKanban, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminProgramsPage() {
  const programs = await programQueries.getPrograms()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Program Kerja</h1>
          <p className="mt-1 text-sm text-muted">Kelola seluruh program kerja departemen.</p>
        </div>
        <Link href="/admin/programs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Program Baru
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-5">
          {programs.length === 0 ? (
            <EmptyState icon={FolderKanban} title="Belum ada program kerja" description="Silakan buat program kerja pertama untuk departemen Anda." />
          ) : (
            <div className="grid gap-4">
              {programs.map((program) => (
                <Link key={program.id} href={`/admin/programs/${program.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-heading text-lg font-bold text-primary">{program.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge tone="surface">{program.department.name}</Badge>
                          <span className="text-xs text-muted-foreground">Budget: Rp {Number(program.budgetPlan).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-right">
                        <div className="flex flex-col gap-1 items-end">
                          <span className="font-medium">{program._count.activities} Activities</span>
                          <span className="text-muted-foreground">{program._count.events} Events</span>
                        </div>
                        <Badge tone={program.status === 'COMPLETED' ? 'success' : program.status === 'ONGOING' ? 'primary' : 'warning'}>
                          {program.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
