'use client'

import { useState } from 'react'
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

export function NotificationDropdown({
  initialNotifications,
  unreadCount,
}: {
  initialNotifications: Notification[]
  unreadCount: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [count, setCount] = useState(unreadCount)

  async function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, readAt: new Date() } : item)))
    setCount((prev) => Math.max(0, prev - 1))
    await markNotificationReadAction(id)
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, readAt: new Date() })))
    setCount(0)
    await markAllNotificationsReadAction()
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen((value) => !value)}
        variant="ghost"
        size="icon"
        aria-label="Buka notifikasi"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {count > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-primary">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-surface shadow-elevated ring-1 ring-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="font-heading text-sm font-bold text-primary">Notifikasi</h3>
            {count > 0 ? (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-secondary"
                type="button"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Tandai Semua
              </button>
            ) : null}
          </div>

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
                          {new Date(notification.createdAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                      {!notification.readAt ? (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="rounded-full p-1 text-accent hover:bg-accent/10"
                          title="Tandai dibaca"
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
