'use client'

import { Filter, RotateCcw } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import {
  CONTENT_PLATFORMS,
  CONTENT_PLAN_STATUSES,
  CONTENT_TYPES,
  contentPlanStatusLabel,
} from '@/features/content-plan/domain'

interface Props {
  month: string
  authors: { id: string; name: string }[]
  programs: { id: string; name: string }[]
  agendas: { id: string; name: string }[]
}

const filterKeys = ['platform', 'contentType', 'authorId', 'status', 'programId', 'agendaId'] as const

export function ContentPlanFilters({ month, authors, programs, agendas }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const activeCount = filterKeys.filter((key) => searchParams.get(key)).length

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const params = new URLSearchParams()
    params.set('month', String(formData.get('month') || month))
    for (const key of filterKeys) {
      const value = formData.get(key)
      if (typeof value === 'string' && value) params.set(key, value)
    }
    setOpen(false)
    router.push(`/admin/cms/content-plan?${params.toString()}`)
  }

  function resetFilters() {
    setOpen(false)
    router.push(`/admin/cms/content-plan?month=${month}`)
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} aria-expanded={open}>
        <Filter className="h-4 w-4" aria-hidden="true" />
        Filter{activeCount ? ` (${activeCount})` : ''}
      </Button>
      <Sheet open={open} onOpenChange={setOpen} title="Filter Content Plan" description="Saring kalender tanpa mengubah data rencana konten.">
        <form onSubmit={applyFilters} className="grid gap-5 sm:grid-cols-2">
          <Field label="Bulan" htmlFor="filter-month">
            <Input id="filter-month" type="month" name="month" defaultValue={month} min="2000-01" max="2100-12" />
          </Field>
          <Field label="Platform" htmlFor="filter-platform">
            <Select id="filter-platform" name="platform" defaultValue={searchParams.get('platform') || ''}>
              <option value="">Semua platform</option>
              {CONTENT_PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
            </Select>
          </Field>
          <Field label="Jenis konten" htmlFor="filter-type">
            <Select id="filter-type" name="contentType" defaultValue={searchParams.get('contentType') || ''}>
              <option value="">Semua jenis</option>
              {CONTENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </Field>
          <Field label="PIC" htmlFor="filter-author">
            <Select id="filter-author" name="authorId" defaultValue={searchParams.get('authorId') || ''}>
              <option value="">Semua PIC</option>
              {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
            </Select>
          </Field>
          <Field label="Status" htmlFor="filter-status">
            <Select id="filter-status" name="status" defaultValue={searchParams.get('status') || ''}>
              <option value="">Semua status</option>
              {CONTENT_PLAN_STATUSES.map((status) => <option key={status} value={status}>{contentPlanStatusLabel(status)}</option>)}
            </Select>
          </Field>
          <Field label="Program" htmlFor="filter-program">
            <Select id="filter-program" name="programId" defaultValue={searchParams.get('programId') || ''}>
              <option value="">Semua Program</option>
              {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
            </Select>
          </Field>
          <Field label="Agenda" htmlFor="filter-agenda" className="sm:col-span-2">
            <Select id="filter-agenda" name="agendaId" defaultValue={searchParams.get('agendaId') || ''}>
              <option value="">Semua Agenda</option>
              {agendas.map((agenda) => <option key={agenda.id} value={agenda.id}>{agenda.name}</option>)}
            </Select>
          </Field>
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
            {activeCount ? <Button type="button" variant="secondary" onClick={resetFilters}><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset</Button> : null}
            <Button type="submit">Terapkan Filter</Button>
          </div>
        </form>
      </Sheet>
    </>
  )
}
