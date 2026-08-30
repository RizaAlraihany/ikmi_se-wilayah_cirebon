'use client'

import { ChevronDown, LogOut, UserCircle } from 'lucide-react'
import { Dropdown, DropdownItem, DropdownLink } from '@/components/ui/dropdown'
import { logoutAction } from '@/features/auth/actions'

export function DashboardProfileDropdown({
  userName,
  userInitials,
  roleLabel,
}: {
  userName: string
  userInitials: string
  roleLabel: string
}) {
  return (
    <Dropdown
      label="Buka menu profil"
      trigger={(
        <>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-heading text-xs font-extrabold text-surface">
            {userInitials}
          </span>
          <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
        </>
      )}
      triggerClassName="gap-2 border border-border bg-surface px-2 pr-3 shadow-sm hover:border-primary/20"
      menuClassName="w-72 p-3"
    >
      <div className="mb-3 flex items-center gap-3 rounded-md bg-surface-alt p-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary font-heading text-sm font-extrabold text-surface">
          {userInitials}
        </span>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-extrabold text-primary">{userName}</p>
          <p className="truncate text-xs font-medium text-text-secondary">{roleLabel}</p>
        </div>
      </div>
      <DropdownLink href="/dashboard/profile" className="gap-3">
        <UserCircle className="h-4 w-4 text-accent" aria-hidden="true" />
        Profil saya
      </DropdownLink>
      <form action={logoutAction}>
        <DropdownItem type="submit" className="gap-3 text-danger hover:bg-danger/10">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Keluar
        </DropdownItem>
      </form>
    </Dropdown>
  )
}
