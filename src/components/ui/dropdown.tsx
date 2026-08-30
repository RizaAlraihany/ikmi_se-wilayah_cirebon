'use client'

import Link from 'next/link'
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const DropdownCloseContext = createContext<(() => void) | null>(null)
const OVERLAY_MENU_OPEN_EVENT = 'ikmi:overlay-menu-open'

type DropdownProps = {
  trigger: React.ReactNode
  children: React.ReactNode
  label: string
  align?: 'start' | 'end'
  active?: boolean
  className?: string
  triggerClassName?: string
  menuClassName?: string
}

export function Dropdown({
  trigger,
  children,
  label,
  align = 'end',
  active = false,
  className,
  triggerClassName,
  menuClassName,
}: DropdownProps) {
  const menuId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const closeAndRestoreFocus = useCallback(() => {
    triggerRef.current?.focus()
    setOpen(false)
  }, [])

  useEffect(() => {
    function closeWhenPeerOpens(event: Event) {
      if ((event as CustomEvent<string>).detail !== menuId) setOpen(false)
    }

    window.addEventListener(OVERLAY_MENU_OPEN_EVENT, closeWhenPeerOpens)
    return () => window.removeEventListener(OVERLAY_MENU_OPEN_EVENT, closeWhenPeerOpens)
  }, [menuId])

  useEffect(() => {
    if (!open) return

    function closeWhenOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeAndRestoreFocus()
    }

    document.addEventListener('mousedown', closeWhenOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeWhenOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [closeAndRestoreFocus, open])

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus()
  }, [open])

  function moveMenuFocus(direction: 1 | -1) {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
    )
    if (!items.length) return

    const activeIndex = items.indexOf(document.activeElement as HTMLElement)
    const nextIndex = activeIndex < 0 ? 0 : (activeIndex + direction + items.length) % items.length
    items[nextIndex]?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        data-active={active ? 'true' : undefined}
        onClick={() => {
          setOpen((current) => {
            const next = !current
            if (next) window.dispatchEvent(new CustomEvent(OVERLAY_MENU_OPEN_EVENT, { detail: menuId }))
            return next
          })
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            window.dispatchEvent(new CustomEvent(OVERLAY_MENU_OPEN_EVENT, { detail: menuId }))
            setOpen(true)
          }
        }}
        className={cn(
          'flex min-h-11 min-w-11 items-center justify-center rounded-xl px-2 text-primary transition hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          triggerClassName,
        )}
      >
        {trigger}
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              moveMenuFocus(1)
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              moveMenuFocus(-1)
            } else if (event.key === 'Home') {
              event.preventDefault()
              menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus()
            } else if (event.key === 'End') {
              event.preventDefault()
              const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')
              const lastItem = items?.item(items.length - 1)
              lastItem?.focus()
            } else if (event.key === 'Tab') {
              setOpen(false)
            }
          }}
          className={cn(
            'absolute top-[calc(100%+0.5rem)] z-50 min-w-48 rounded-xl border border-border bg-surface p-1 shadow-float',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName,
          )}
        >
          <DropdownCloseContext.Provider value={closeAndRestoreFocus}>
            {children}
          </DropdownCloseContext.Provider>
        </div>
      ) : null}
    </div>
  )
}

export function DropdownItem({
  children,
  onSelect,
  disabled,
  className,
  type = 'button',
}: {
  children: React.ReactNode
  onSelect?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  const closeMenu = useContext(DropdownCloseContext)

  return (
    <button
      type={type}
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onSelect?.()
        // A submit item must stay mounted until the browser dispatches the
        // form submission. Closing here unmounts the form and cancels actions
        // such as dashboard logout before they reach the server.
        if (type !== 'submit') closeMenu?.()
      }}
      className={cn(
        'flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-primary transition hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function DropdownLink({
  href,
  children,
  className,
  ariaCurrent,
}: {
  href: string
  children: React.ReactNode
  className?: string
  ariaCurrent?: React.AriaAttributes['aria-current']
}) {
  const closeMenu = useContext(DropdownCloseContext)

  return (
    <Link
      href={href}
      role="menuitem"
      aria-current={ariaCurrent}
      onClick={() => closeMenu?.()}
      className={cn(
        'flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-primary transition hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      )}
    >
      {children}
    </Link>
  )
}
