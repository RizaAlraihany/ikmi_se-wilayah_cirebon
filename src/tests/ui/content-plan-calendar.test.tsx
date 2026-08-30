import { ContentPlanStatus } from '@prisma/client'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ContentPlanCalendar } from '@/app/(dashboard)/admin/cms/content-plan/components/ContentPlanCalendar'

const push = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams('month=2026-08&platform=Instagram'),
}))

jest.mock('@/features/content-plan/actions', () => ({
  createContentPlanAction: jest.fn(),
  updateContentPlanAction: jest.fn(),
  updateContentPlanStatusAction: jest.fn(),
}))

const base = {
  platform: 'Instagram',
  status: ContentPlanStatus.PLANNED,
  authorId: 'admin-komdigi',
  contentType: 'Carousel',
  programId: null,
  agendaId: null,
  pamfletRequestId: null,
  notes: null,
  assetUrl: null,
  publishedUrl: null,
  pamfletRequest: null,
  author: { id: 'admin-komdigi', name: 'Nama PIC Panjang Komdigi' },
  program: null,
  agenda: null,
}

describe('ContentPlanCalendar mobile and desktop behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-15T03:00:00.000Z'))
    push.mockClear()
  })

  afterEach(() => jest.useRealTimers())

  it('shows multiple content items only for the selected mobile date with overdue indicators', () => {
    render(<ContentPlanCalendar
      month="2026-08"
      plans={[
        { ...base, id: 'plan-1', title: 'Carousel Sapa Rasa dengan judul sangat panjang', publishDate: new Date('2026-08-12T03:00:00.000Z') },
        { ...base, id: 'plan-2', title: 'Poster Agenda', publishDate: new Date('2026-08-12T04:00:00.000Z') },
      ]}
      authors={[{ id: 'admin-komdigi', name: 'Nama PIC Panjang Komdigi' }]}
      programs={[]}
      agendas={[]}
    />)

    const mobile = screen.getByRole('region', { name: 'Kalender ringkas Agustus 2026' })
    fireEvent.click(within(mobile).getByRole('button', { name: /Rabu, 12 Agustus 2026, 2 konten/ }))
    expect(within(mobile).getByText('Carousel Sapa Rasa dengan judul sangat panjang')).toBeInTheDocument()
    expect(within(mobile).getByText('Poster Agenda')).toBeInTheDocument()
    expect(within(mobile).getAllByText('Terlambat')).toHaveLength(2)
  })

  it('preserves active filters when moving months and opens quick add for the selected date', () => {
    render(<ContentPlanCalendar month="2026-08" plans={[]} authors={[{ id: 'admin-komdigi', name: 'Admin' }]} programs={[]} agendas={[]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Bulan sebelumnya' }))
    expect(push).toHaveBeenCalledWith('/admin/cms/content-plan?month=2026-07&platform=Instagram')

    const mobile = screen.getByRole('region', { name: 'Kalender ringkas Agustus 2026' })
    fireEvent.click(within(mobile).getByRole('button', { name: /Rabu, 12 Agustus 2026, 0 konten/ }))
    fireEvent.click(within(mobile).getByRole('button', { name: /Tambah konten pada Rabu, 12 Agustus 2026/ }))
    expect(screen.getByRole('dialog', { name: 'Tambah Content Plan' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Jadwal publikasi/)).toHaveValue('2026-08-12T09:00')
  })

  it('keeps the original Request accessible from an opened desktop calendar item', () => {
    render(<ContentPlanCalendar
      month="2026-08"
      plans={[{
        ...base,
        id: 'plan-request',
        title: 'Konten dari Request',
        publishDate: new Date('2026-08-15T03:00:00.000Z'),
        pamfletRequestId: 'request-13',
        pamfletRequest: {
          requestNumber: 'REQ-PAMFLET-2026-0013',
          deadline: new Date('2026-08-21T17:00:00.000Z'),
        },
      }]}
      authors={[{ id: 'admin-komdigi', name: 'Admin' }]}
      programs={[]}
      agendas={[]}
    />)

    const desktop = screen.getByRole('region', { name: 'Kalender Content Plan Agustus 2026' })
    fireEvent.click(within(desktop).getByRole('button', { name: /Konten dari Request/ }))
    expect(screen.getByRole('link', { name: 'Buka Request Asli' })).toHaveAttribute('href', '/admin/request-pamflet/request-13')
    expect(screen.getByText('Berasal dari REQ-PAMFLET-2026-0013')).toBeInTheDocument()
  })
})
