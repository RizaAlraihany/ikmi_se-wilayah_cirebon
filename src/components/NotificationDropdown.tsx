'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Bell, Check, CheckCircle2, Inbox } from 'lucide-react'
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/features/notifications/actions'
import { Button } from '@/components/ui/button'

type Notification = {
  id: string
  title: string
  message: string
  readAt: Date | null
  createdAt: Date
}

const notificationDateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})
const OVERLAY_MENU_OPEN_EVENT = 'ikmi:overlay-menu-open'

function formatNotificationDate(value: Date | string) {
  return notificationDateFormatter.format(new Date(value))
}

export function NotificationDropdown({
  initialNotifications,
  unreadCount,
}: {
  initialNotifications: Notification[]
  unreadCount: number
}) {
  const panelId = useId()
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [count, setCount] = useState(unreadCount)
  const [updatingId, setUpdatingId] = useState<string | 'all' | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    function closeWhenPeerOpens(event: Event) {
      if ((event as CustomEvent<string>).detail !== panelId) setIsOpen(false)
    }

    window.addEventListener(OVERLAY_MENU_OPEN_EVENT, closeWhenPeerOpens)
    return () => window.removeEventListener(OVERLAY_MENU_OPEN_EVENT, closeWhenPeerOpens)
  }, [panelId])

  useEffect(() => {
    if (!isOpen) return

    function closeWhenOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      containerRef.current?.querySelector<HTMLButtonElement>(':scope > button')?.focus()
    }

    document.addEventListener('pointerdown', closeWhenOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeWhenOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  async function handleMarkRead(id: string) {
    const previousNotifications = notifications
    const previousCount = count
    setFeedback(null)
    setUpdatingId(id)
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, readAt: new Date() } : item)))
    setCount((prev) => Math.max(0, prev - 1))
    try {
      const result = await markNotificationReadAction(id)
      if ('error' in result && result.error) throw new Error(result.error)
    } catch {
      setNotifications(previousNotifications)
      setCount(previousCount)
      setFeedback('Notifikasi belum dapat diperbarui. Silakan coba lagi.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleMarkAllRead() {
    const previousNotifications = notifications
    const previousCount = count
    setFeedback(null)
    setUpdatingId('all')
    setNotifications((prev) => prev.map((item) => ({ ...item, readAt: new Date() })))
    setCount(0)
    try {
      const result = await markAllNotificationsReadAction()
      if ('error' in result && result.error) throw new Error(result.error)
    } catch {
      setNotifications(previousNotifications)
      setCount(previousCount)
      setFeedback('Notifikasi belum dapat diperbarui. Silakan coba lagi.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        onClick={() => {
          setIsOpen((value) => {
            const next = !value
            if (next) window.dispatchEvent(new CustomEvent(OVERLAY_MENU_OPEN_EVENT, { detail: panelId }))
            return next
          })
        }}
        variant="ghost"
        size="icon"
        aria-label="Buka notifikasi"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span
          className="notification-icon relative flex h-5 w-5 items-center justify-center"
          data-count={count > 9 ? '9+' : String(count)}
          data-has-unread={count > 0 ? 'true' : 'false'}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </span>
      </Button>

      {isOpen ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={titleId}
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-surface shadow-elevated ring-1 ring-line"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 id={titleId} className="font-heading text-sm font-bold text-primary">Notifikasi</h2>
            {count > 0 ? (
              <button
                onClick={handleMarkAllRead}
                disabled={updatingId !== null}
                className="flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-semibold text-accent hover:bg-surface-alt hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                type="button"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Tandai Semua
              </button>
            ) : null}
          </div>

          {feedback ? (
            <p role="alert" className="border-b border-danger/20 bg-danger/5 px-4 py-3 text-xs font-semibold text-danger">
              {feedback}
            </p>
          ) : null}

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Inbox className="h-8 w-8 text-accent" aria-hidden="true" />
                <p className="text-sm font-medium text-muted">Tidak ada notifikasi.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={notification.readAt ? 'px-4 py-3' : 'bg-accent/5 px-4 py-3'}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-primary">{notification.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted">{notification.message}</p>
                        <p className="mt-2 text-xs font-medium text-muted">
                          {formatNotificationDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.readAt ? (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={updatingId !== null}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-accent hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          aria-label={`Tandai ${notification.title} sebagai dibaca`}
                          type="button"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
