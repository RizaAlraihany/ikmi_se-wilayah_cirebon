import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StatusUpdater } from '@/app/(dashboard)/admin/request-pamflet/[id]/components/StatusUpdater'
import { updatePamfletRequestStatus } from '@/features/request-pamflet/admin-actions'

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
jest.mock('@/features/request-pamflet/admin-actions', () => ({ updatePamfletRequestStatus: jest.fn() }))

const updateStatusMock = jest.mocked(updatePamfletRequestStatus)

describe('Request Pamflet dashboard status control', () => {
  it('only offers valid next states and submits the required rejection note', async () => {
    updateStatusMock.mockResolvedValueOnce({ id: 'request-1' } as never)
    render(<StatusUpdater request={{ id: 'request-1', status: 'BARU' }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Ubah status' }))
    expect(screen.getByRole('dialog', { name: 'Ubah status Request' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Diterima' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dikerjakan' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ditolak' }))
    const notes = screen.getByRole('textbox', { name: /Catatan internal/ })
    expect(notes).toBeRequired()
    fireEvent.change(notes, { target: { value: 'Informasi kegiatan belum lengkap.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan status' }))

    await waitFor(() => expect(updateStatusMock).toHaveBeenCalledWith(
      'request-1',
      'DITOLAK',
      'Informasi kegiatan belum lengkap.',
    ))
    expect(refresh).toHaveBeenCalled()
  })

  it('shows terminal states as non-editable', () => {
    render(<StatusUpdater request={{ id: 'request-2', status: 'SELESAI' }} />)
    expect(screen.getByRole('button', { name: 'Status final' })).toBeDisabled()
  })
})
