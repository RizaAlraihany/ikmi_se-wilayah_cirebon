import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createProgramAction } from '@/features/programs/actions'
import { prisma } from '@/core/database/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/core/auth/auth'
import { can } from '@/core/authorization/rbac'
import type { SessionUser } from '@/core/authorization/rbac'

export default async function NewProgramPage() {
  const session = await auth()
  const user = session?.user as { role: string; departmentId: string; } | undefined
  let departments: { id: string, name: string }[] = []

  const canManageSystem = await can('system.manage', session?.user as SessionUser)
  // Super Admin can manage system, Ketua Umum can approve tier 2 finance or similar. We use system.manage as a proxy for global access, but to be safe we can also allow if they have no department or are global roles, but let's stick to system.manage or if we want BPH access we check a global BPH permission like lpj.verify_bph.
  const isGlobal = canManageSystem || await can('lpj.verify_bph', session?.user as SessionUser)

  if (isGlobal) {
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
    <div className="mx-auto max-w-2xl space-y-6">
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
              <label htmlFor="name" className="text-sm font-semibold text-primary">Nama Program</label>
              <Input id="name" name="name" required placeholder="Contoh: Latihan Dasar Kepemimpinan" />
            </div>

            <div className="space-y-2">
              <label htmlFor="departmentId" className="text-sm font-semibold text-primary">Departemen</label>
              <Select id="departmentId" name="departmentId" required>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="budgetPlan" className="text-sm font-semibold text-primary">Rencana Anggaran (Rp)</label>
              <Input id="budgetPlan" name="budgetPlan" type="number" required placeholder="Contoh: 5000000" />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-primary">Deskripsi / Latar Belakang</label>
              <Textarea id="description" name="description" required placeholder="Tuliskan latar belakang dan tujuan program..." rows={4} />
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
