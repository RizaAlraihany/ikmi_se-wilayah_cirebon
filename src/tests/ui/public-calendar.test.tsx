import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildCalendarGrid } from '@/features/public/calendar-domain'
import { CalendarFilters, DesktopCalendarGrid, MobileCalendar } from '@/app/(public)/_components/calendar-ui'
import type { CalendarEvent } from '@/features/public/calendar-domain'

const push = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams('year=2026&month=7&date=2026-08-10'),
}))

const events: CalendarEvent[] = [
  {
    id: 'program-1',
    type: 'program',
    name: 'Program Bersama',
    date: new Date('2026-08-09T17:00:00.000Z'),
    endDate: null,
    location: 'Indramayu',
    unitName: 'PSDA',
    status: 'POSTPONED',
    slug: 'program-bersama',
  },
  {
    id: 'agenda-1',
    type: 'agenda',
    name: 'Agenda Bersama',
    date: new Date('2026-08-10T02:00:00.000Z'),
    endDate: null,
    location: null,
    unitName: 'Sekretariat',
    status: 'CANCELLED',
    slug: 'agenda-bersama',
  },
]

describe('public calendar mobile interaction', () => {
  beforeEach(() => push.mockReset())

  it('shows multiple activities on the selected date and exposes override labels', () => {
    render(
      <MobileCalendar
        year={2026}
        month={7}
        days={buildCalendarGrid(2026, 7)}
        eventsByDate={new Map([['2026-08-10', events]])}
        today="2026-08-11"
        selectedDate="2026-08-10"
        selectedType="all"
      />,
    )

    expect(screen.getByText('Program Bersama')).toBeInTheDocument()
    expect(screen.getByText('Agenda Bersama')).toBeInTheDocument()
    expect(screen.getByText('Ditunda')).toBeInTheDocument()
    expect(screen.getByText('Dibatalkan')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '10 Agustus 2026, 2 kegiatan' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('supports keyboard date selection and preserves calendar filters', async () => {
    const user = userEvent.setup()
    render(
      <>
        <CalendarFilters selectedType="all" />
        <MobileCalendar
          year={2026}
          month={7}
          days={buildCalendarGrid(2026, 7)}
          eventsByDate={new Map()}
          today="2026-08-11"
          selectedDate="2026-08-10"
          selectedType="agenda"
        />
      </>,
    )

    const dateButton = screen.getByRole('button', { name: '12 Agustus 2026, tidak ada kegiatan' })
    dateButton.focus()
    await user.keyboard('{Enter}')
    expect(push).toHaveBeenCalledWith('?date=2026-08-12', { scroll: false })

    await user.click(screen.getByRole('button', { name: 'Agenda', pressed: false }))
    expect(push).toHaveBeenCalledWith('?year=2026&month=7&date=2026-08-10&type=agenda', { scroll: false })
  })

  it('sends desktop Agenda calendar items to the canonical listing', () => {
    render(
      <DesktopCalendarGrid
        year={2026}
        month={7}
        days={[new Date('2026-08-10T00:00:00.000Z')]}
        eventsByDate={new Map([['2026-08-10', [events[1]!]]])}
        today="2026-08-11"
        selectedType="agenda"
      />,
    )

    expect(screen.getByTitle('Agenda Bersama').closest('a')).toHaveAttribute('href', '/kegiatan')
  })
})
