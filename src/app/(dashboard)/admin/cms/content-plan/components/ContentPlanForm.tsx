'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListboxSelect } from '@/components/ui/listbox-select'
import { ContentPlanStatus } from '@prisma/client'
import { createContentPlanAction } from '@/features/content-plan/actions'

export function ContentPlanForm({ authors }: { authors: { id: string; name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false)

  const formContent = (
    <form
      action={async (formData) => {
        await createContentPlanAction(formData)
        setIsOpen(false)
      }}
      className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
    >
      <Input name="title" placeholder="Judul konten" aria-label="Judul konten" required />
      <Input name="platform" placeholder="Website / Instagram" aria-label="Platform" required />
      <Input name="publishDate" type="datetime-local" aria-label="Jadwal publish" required />
      <ListboxSelect
        name="authorId"
        aria-label="Assigned writer"
        defaultValue={authors[0]?.id ?? ''}
        options={authors.map((author) => ({ value: author.id, label: author.name }))}
      />
      <input type="hidden" name="status" value={ContentPlanStatus.PLANNED} />
      <Button type="submit" className="w-full">Tambah</Button>
    </form>
  )

  return (
    <>
      {/* Desktop view: always visible */}
      <div className="hidden md:block">
        {formContent}
      </div>

      {/* Mobile view: Button and Modal */}
      <div className="md:hidden">
        <Button 
          type="button" 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-40"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/60 sm:items-center">
            <div className="w-full rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-2xl pb-10">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-heading text-xl font-bold text-primary">Tambah Plan</h3>
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-full bg-surface-alt p-2 text-muted transition-colors hover:text-primary">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="[&>form]:flex [&>form]:flex-col [&>form]:gap-4">
                {formContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
