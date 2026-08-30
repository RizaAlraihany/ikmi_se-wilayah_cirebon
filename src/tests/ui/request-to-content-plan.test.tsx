import { PamfletRequestStatus } from '@prisma/client'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CreateContentPlanDialog } from '@/app/(dashboard)/admin/request-pamflet/[id]/components/CreateContentPlanDialog'
import { convertPamfletRequestToContentPlanAction } from '@/features/content-plan/actions'

const push = jest.fn()
const refresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}))

jest.mock('@/features/content-plan/actions', () => ({
  convertPamfletRequestToContentPlanAction: jest.fn(),
}))

const convertMock = jest.mocked(convertPamfletRequestToContentPlanAction)
const request = {
  id: 'request-13',
  requestNumber: 'REQ-PAMFLET-2026-0013',
  activityName: 'Pamflet PRABUMI',
  deadline: new Date('2026-08-21T17:00:00.000Z'),
  status: PamfletRequestStatus.DITERIMA,
  assigneeId: 'admin-komdigi',
  hasAttachment: true,
  contentPlan: null,
}
const assignees = [{ id: 'admin-komdigi', name: 'Admin Komdigi' }]

describe('Request to Content Plan conversion sheet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('collects only scheduling choices and navigates to the selected calendar month', async () => {
    convertMock.mockResolvedValueOnce({ success: true, contentPlanId: 'plan-13', month: '2026-08' })
    render(<CreateContentPlanDialog request={request} assignees={assignees} />)

    fireEvent.click(screen.getByRole('button', { name: 'Buat Content Plan' }))
    expect(screen.getByText('REQ-PAMFLET-2026-0013')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^Jadwal publikasi/), { target: { value: '2026-08-20T09:00' } })
    fireEvent.change(screen.getByLabelText(/^Jenis konten/), { target: { value: 'Carousel' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buat di Kalender' }))

    await waitFor(() => expect(convertMock).toHaveBeenCalledWith('request-13', expect.any(FormData)))
    const submitted = convertMock.mock.calls[0][1]
    expect(submitted.get('publishDate')).toBe('2026-08-20T09:00')
    expect(submitted.get('platform')).toBe('Instagram')
    expect(submitted.get('contentType')).toBe('Carousel')
    expect(submitted.get('authorId')).toBe('admin-komdigi')
    expect(submitted.get('title')).toBeNull()
    expect(submitted.get('programId')).toBeNull()
    expect(push).toHaveBeenCalledWith('/admin/cms/content-plan?month=2026-08')
  })

  it('shows a duplicate warning inline and disables conversion for an invalid request', async () => {
    convertMock.mockResolvedValueOnce({ success: false, error: 'Request Pamflet ini sudah memiliki Content Plan.' })
    const { rerender } = render(<CreateContentPlanDialog request={request} assignees={assignees} />)

    fireEvent.click(screen.getByRole('button', { name: 'Buat Content Plan' }))
    fireEvent.change(screen.getByLabelText(/^Jadwal publikasi/), { target: { value: '2026-08-20T09:00' } })
    fireEvent.change(screen.getByLabelText(/^Jenis konten/), { target: { value: 'Poster' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buat di Kalender' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Request Pamflet ini sudah memiliki Content Plan.')
    expect(screen.getByRole('dialog', { name: 'Buat Content Plan' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    rerender(<CreateContentPlanDialog request={{ ...request, status: PamfletRequestStatus.BARU }} assignees={assignees} />)
    expect(screen.getByRole('button', { name: 'Buat Content Plan' })).toBeDisabled()
  })
})
