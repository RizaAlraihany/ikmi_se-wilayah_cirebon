import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { markNotificationReadAction } from '@/features/notifications/actions'

jest.mock('@/features/notifications/actions', () => ({
  markNotificationReadAction: jest.fn().mockResolvedValue({ success: true }),
  markAllNotificationsReadAction: jest.fn().mockResolvedValue({ success: true }),
}))

const notification = {
  id: 'notification-1',
  title: 'Request Pamflet baru',
  message: 'Satu permintaan baru perlu ditinjau.',
  readAt: null,
  createdAt: new Date('2026-08-11T08:00:00+07:00'),
}

describe('dashboard header menus', () => {
  beforeEach(() => {
    jest.mocked(markNotificationReadAction).mockResolvedValue({ success: true })
  })

  it('closes the notification panel on outside click and Escape', () => {
    render(<NotificationDropdown initialNotifications={[notification]} unreadCount={1} />)
    const trigger = screen.getByRole('button', { name: 'Buka notifikasi' })

    fireEvent.click(trigger)
    expect(screen.getByRole('region', { name: 'Notifikasi' })).toBeInTheDocument()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('region', { name: 'Notifikasi' })).not.toBeInTheDocument()

    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('region', { name: 'Notifikasi' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('gives notification actions a mobile touch target and accessible name', () => {
    render(<NotificationDropdown initialNotifications={[notification]} unreadCount={1} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buka notifikasi' }))

    expect(screen.getByRole('button', { name: 'Tandai Semua' })).toHaveClass('min-h-11')
    expect(screen.getByRole('button', { name: /Tandai Request Pamflet baru sebagai dibaca/ })).toHaveClass('h-11', 'w-11')
  })

  it('restores optimistic state and shows safe feedback when an update fails', async () => {
    jest.mocked(markNotificationReadAction).mockResolvedValue({ error: 'internal detail' })
    render(<NotificationDropdown initialNotifications={[notification]} unreadCount={1} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buka notifikasi' }))

    fireEvent.click(screen.getByRole('button', { name: /Tandai Request Pamflet baru sebagai dibaca/ }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Notifikasi belum dapat diperbarui'))
    expect(screen.queryByText('internal detail')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tandai Request Pamflet baru sebagai dibaca/ })).toBeInTheDocument()
  })
})
