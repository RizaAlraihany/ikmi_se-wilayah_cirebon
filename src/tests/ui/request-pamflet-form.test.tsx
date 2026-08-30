import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RequestPamfletForm } from '@/app/request-pamflet/components/RequestPamfletForm'
import { submitRequestPamfletAction } from '@/features/request-pamflet/actions'

const push = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
jest.mock('@/features/request-pamflet/actions', () => ({ submitRequestPamfletAction: jest.fn() }))

const submitMock = jest.mocked(submitRequestPamfletAction)

describe('RequestPamfletForm', () => {
  it('exposes accessible mobile-first fields and submits the approved taxonomy', async () => {
    submitMock.mockResolvedValueOnce({ success: true, requestNumber: 'REQ-PAMFLET-2026-0008' })
    render(<RequestPamfletForm programs={[{ id: 'program-1', name: 'PRABUMI' }]} agendas={[{ id: 'agenda-1', name: 'Sapa Rasa' }]} />)

    fireEvent.change(screen.getByLabelText(/^Nama pengaju/), { target: { value: 'Siti Nurhaliza' } })
    fireEvent.change(screen.getByLabelText(/^Unit \/ Departemen/), { target: { value: 'Kaderisasi' } })
    fireEvent.change(screen.getByLabelText(/^Nomor WhatsApp/), { target: { value: '081234567890' } })
    fireEvent.change(screen.getByLabelText('Program / Agenda terkait'), { target: { value: 'program:program-1' } })
    fireEvent.change(screen.getByLabelText(/^Nama kegiatan/), { target: { value: 'Malam Keakraban IKMI' } })
    fireEvent.change(screen.getByLabelText(/^Tanggal kegiatan/), { target: { value: '2026-09-20' } })
    fireEvent.change(screen.getByLabelText(/^Jenis kebutuhan/), { target: { value: 'Poster' } })
    fireEvent.change(screen.getByLabelText(/^Deadline pamflet/), { target: { value: '2026-09-17' } })
    fireEvent.change(screen.getByLabelText(/^Informasi yang harus dicantumkan/), { target: { value: 'Cantumkan seluruh informasi penting kegiatan.' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Catatan tambahan' }), { target: { value: 'Gunakan logo resmi IKMI.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Request' }))

    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1))
    const submitted = submitMock.mock.calls[0][0]
    expect(submitted.get('relatedEntity')).toBe('program:program-1')
    expect(submitted.get('requestType')).toBe('Poster')
    expect(submitted.get('requesterNotes')).toBe('Gunakan logo resmi IKMI.')
    expect(push).toHaveBeenCalledWith('/request-pamflet/success?req=REQ-PAMFLET-2026-0008')
  })

  it('shows inline validation and does not call the server when required fields are empty', async () => {
    render(<RequestPamfletForm programs={[]} agendas={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Request' }))
    expect(await screen.findByText('Tanggal kegiatan wajib diisi')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Tanggal kegiatan/)).toHaveAttribute('aria-invalid', 'true')
    expect(submitMock).not.toHaveBeenCalled()
  })
})
