import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AgendaListingInteraction, type AgendaListingItem } from '@/app/(public)/agenda/agenda-listing-interaction'

const agendas: AgendaListingItem[] = [
  {
    id: 'agenda-1:2026-09-10',
    name: 'Rapat Evaluasi',
    description: 'Pembahasan capaian program kerja dan tindak lanjut.',
    location: 'Sekretariat IKMI',
    organizationalUnitName: 'Sekretariat',
    statusLabel: 'Akan datang',
    statusTone: 'warning',
    scheduleType: 'FIXED_DATE',
    dayLabel: '10 Sep',
    yearLabel: '2026',
    dateLabel: 'Kamis, 10 September 2026',
    timeLabel: '09.00 WIB',
    endTimeLabel: '11.00 WIB',
    startDateTime: '2026-09-10T02:00:00.000Z',
    endDateTime: '2026-09-10T04:00:00.000Z',
  },
  {
    id: 'agenda-2:2026-09-12',
    name: 'Pelatihan Media',
    description: 'Pelatihan pengelolaan kanal informasi organisasi.',
    location: 'Ruang Kreatif',
    organizationalUnitName: 'Komunikasi',
    statusLabel: 'Akan datang',
    statusTone: 'warning',
    scheduleType: 'RECURRING',
    dayLabel: '12 Sep',
    yearLabel: '2026',
    dateLabel: 'Sabtu, 12 September 2026',
    timeLabel: '13.00 WIB',
    endTimeLabel: null,
    startDateTime: '2026-09-12T06:00:00.000Z',
    endDateTime: null,
  },
]

describe('public Agenda listing interaction', () => {
  it('opens the selected Agenda in an accessible dialog without changing the route', async () => {
    const user = userEvent.setup()
    render(<AgendaListingInteraction items={agendas} />)

    const trigger = screen.getByRole('button', { name: 'Lihat detail agenda Rapat Evaluasi' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')

    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Rapat Evaluasi' })
    expect(dialog).toHaveTextContent('Pembahasan capaian program kerja dan tindak lanjut.')
    expect(dialog).toHaveTextContent('Sekretariat IKMI')
    expect(window.location.pathname).toBe('/')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the correct content for a second Agenda and closes with its accessible control', async () => {
    const user = userEvent.setup()
    render(<AgendaListingInteraction items={agendas} />)

    await user.click(screen.getByRole('button', { name: 'Lihat detail agenda Pelatihan Media' }))

    const dialog = screen.getByRole('dialog', { name: 'Pelatihan Media' })
    expect(dialog).toHaveTextContent('Pelatihan pengelolaan kanal informasi organisasi.')
    expect(dialog).toHaveTextContent('Ruang Kreatif')
    expect(dialog).not.toHaveTextContent('Rapat Evaluasi')

    await user.click(screen.getByRole('button', { name: 'Tutup dialog' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a neutral empty state when there are no public Agenda items', () => {
    render(<AgendaListingInteraction items={[]} />)

    expect(screen.getByRole('heading', { name: 'Belum ada Agenda publik' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Lihat detail agenda/i })).not.toBeInTheDocument()
  })
})
