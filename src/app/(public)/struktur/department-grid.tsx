'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Gamepad2,
  MessageSquareHeart,
  Megaphone,
  UserPlus,
  ShoppingBag,
  HandHeart,
  LucideIcon,
  X
} from 'lucide-react'
import { StrukturCard, type StrukturCardMember } from './struktur-card'

export type DepartmentData = {
  id: string
  code: string
  name: string
  description: string
  iconType: 'KAD' | 'KAJ' | 'PSDA' | 'EKRAF' | 'KOMDIGI' | 'HPM'
  memberCount: number
  kadivName: string
  users: StrukturCardMember[]
}

const iconMap: Record<DepartmentData['iconType'], LucideIcon> = {
  KAD: UserPlus,
  KAJ: MessageSquareHeart,
  PSDA: Gamepad2,
  EKRAF: ShoppingBag,
  KOMDIGI: Megaphone,
  HPM: HandHeart,
}

export function DepartmentGrid({ departments }: { departments: DepartmentData[] }) {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  const selectedDept = departments.find((d) => d.id === selectedDeptId)

  // Scroll to detail when selected
  useEffect(() => {
    if (selectedDeptId && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }, [selectedDeptId])

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="grid gap-3 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {departments.map((dept) => {
          const Icon = iconMap[dept.iconType]
          const isSelected = selectedDeptId === dept.id

          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(isSelected ? null : dept.id)}
              className={`group flex flex-col rounded-2xl border bg-white p-4 text-left shadow-card ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-6
                ${
                  isSelected
                    ? 'border-accent ring-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]'
                    : ''
                }
              `}
            >
              <div className="mb-4 flex w-full items-start justify-between sm:mb-6">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-alt text-primary transition-colors group-hover:border-primary/20 group-hover:bg-primary/5 sm:h-12 sm:w-12 sm:rounded-[14px] ${
                    isSelected ? 'border-accent/40 bg-accent/10 text-accent' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
                </div>
                <div className="flex h-6 items-center rounded-full border border-border bg-surface-alt px-2.5 text-[10px] font-bold uppercase tracking-[0.06em] text-text-secondary sm:h-7 sm:px-3 sm:text-[11px]">
                  {dept.memberCount} Anggota
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-heading text-base font-extrabold tracking-tight text-primary sm:text-lg">
                  {dept.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-text-secondary sm:mt-2 sm:line-clamp-3 sm:text-sm sm:leading-relaxed">
                  {dept.description}
                </p>
              </div>

              <div className="mt-4 sm:mt-6">
                <div className="mb-3 h-px w-full bg-border sm:mb-4" />
                <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-secondary sm:text-xs">Kadiv:</span>
                  <span className="truncate font-semibold text-primary">{dept.kadivName}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Department Modal */}
      {selectedDept && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-primary/60 px-4 py-6 backdrop-blur-sm sm:px-6 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedDeptId(null)}
        >
          <div
            className="relative my-auto w-full max-w-5xl rounded-2xl bg-surface p-4 shadow-2xl ring-1 ring-border sm:p-8 md:rounded-3xl lg:p-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4 md:mb-8">
              <div>
                <p className="mb-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-accent">
                  Struktur Anggota
                </p>
                <h2 className="font-heading text-lg font-extrabold tracking-tight text-primary sm:text-2xl">
                  Departemen {selectedDept.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDeptId(null)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-text-secondary transition-colors hover:bg-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:h-10 md:w-10"
                aria-label="Tutup detail departemen"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-1 pb-3 md:pb-4">
              <div className="grid grid-cols-2 justify-center justify-items-center gap-3 sm:gap-6 sm:[grid-template-columns:repeat(auto-fit,minmax(220px,240px))]">
                {selectedDept.users.map((user) => (
                  <StrukturCard key={user.id} member={user} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
