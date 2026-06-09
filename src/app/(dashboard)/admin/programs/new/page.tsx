import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createProgramAction } from '@/features/programs/actions'
import { prisma } from '@/core/database/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/core/auth/auth'

export default async function NewProgramPage() {
  const session = await auth()
  const user = session?.user as { role: string; departmentId: string; } | undefined
  let departments: { id: string, name: string }[] = []

  if (user?.role === 'admin' || user?.role === 'bph') {
    departments = await prisma.department.findMany()
  } else if (user?.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: user.departmentId } })
    if (dept) departments = [dept]
  }

  async function createProgram(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const departmentId = formData.get('departmentId') as string
    const budgetPlan = Number(formData.get('budgetPlan'))
    const description = formData.get('description') as string

    const res = await createProgramAction({ name, departmentId, budgetPlan, description })
    if (res.success && res.data) {
      redirect(`/admin/programs/${res.data.id}`)
    } else {
      // In a real app we'd handle error gracefully. 
      // For simplicity here, we throw to error boundary.
      throw new Error(res.error || 'Failed to create program')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/programs" className="text-muted-foreground hover:text-primary">
          &larr; Kembali
        </Link>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Buat Program Baru</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={createProgram} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Program</label>
              <Input name="name" required placeholder="Contoh: Latihan Dasar Kepemimpinan" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Departemen</label>
              <select name="departmentId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rencana Anggaran (Rp)</label>
              <Input name="budgetPlan" type="number" required placeholder="Contoh: 5000000" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi / Latar Belakang</label>
              <Textarea name="description" required placeholder="Tuliskan latar belakang dan tujuan program..." rows={4} />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Simpan Program</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
