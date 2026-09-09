'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserAction } from '@/features/users/actions'
import { DASHBOARD_ROLE_IDS, DASHBOARD_ROLE_LABELS, type DashboardRoleId } from '@/core/auth/roles'
import { Button, ButtonLink } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/field'

export function UserEditForm({ user, departments }: { user: { id: string; name: string; email: string; roleId: string | null; departmentId: string | null; isActive: boolean }; departments: { id: string; name: string }[] }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function save(form: FormData) {
    setSaving(true)
    try {
      const result = await updateUserAction({ id: user.id, name: String(form.get('name')), email: String(form.get('email')), roleId: String(form.get('roleId')) as DashboardRoleId, departmentId: String(form.get('departmentId')), isActive: form.get('isActive') === 'on' })
      if (result.error) setError(result.error)
      else { router.push('/admin/users'); router.refresh() }
    } catch { setError('Perubahan belum dapat disimpan. Silakan coba lagi.') }
    finally { setSaving(false) }
  }
  return <form action={save} className="max-w-xl space-y-5">
    <h1 className="font-heading text-2xl font-bold">Edit pengguna</h1>
    {error ? <p role="alert">{error}</p> : null}
    <Field label="Nama" htmlFor="name"><Input id="name" name="name" defaultValue={user.name} required minLength={3} maxLength={160} /></Field>
    <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" defaultValue={user.email} required /></Field>
    <Field label="Role" htmlFor="roleId"><Select id="roleId" name="roleId" defaultValue={user.roleId || ''} required><option value="" disabled>Pilih role</option>{DASHBOARD_ROLE_IDS.map((role) => <option key={role} value={role}>{DASHBOARD_ROLE_LABELS[role]}</option>)}</Select></Field>
    <Field label="Departemen" htmlFor="departmentId"><Select id="departmentId" name="departmentId" defaultValue={user.departmentId || ''} required><option value="" disabled>Pilih departemen</option>{departments.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</Select></Field>
    <label className="flex gap-2"><input type="checkbox" name="isActive" defaultChecked={user.isActive} />Akun aktif</label>
    <div className="flex gap-3"><Button type="submit" disabled={saving}>Simpan perubahan</Button><ButtonLink href="/admin/users" variant="secondary">Kembali</ButtonLink></div>
  </form>
}
