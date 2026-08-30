import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RegisterForm } from '@/app/(public)/gabung/register-form'
import { submitRegistrationAction } from '@/features/registration/actions'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/features/registration/actions', () => ({
  submitRegistrationAction: jest.fn(),
}))

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses joining language and exposes every required field with visible labels', () => {
    render(<RegisterForm />)

    expect(screen.getByRole('button', { name: /Kirim Data Bergabung/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Daftar/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Nama lengkap/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Nomor WhatsApp/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Kampus \/ institusi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Alasan ingin bergabung/i)).toBeInTheDocument()
  })

  it('submits valid data and routes to the reference page', async () => {
    jest.mocked(submitRegistrationAction).mockResolvedValueOnce({
      success: true,
      registrationNumber: 'REG-2026-0007',
    })
    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/Nama lengkap/i), { target: { value: 'Nadia Indriyani' } })
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'nadia@example.test' } })
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/i), { target: { value: '081234567890' } })
    fireEvent.change(screen.getByLabelText(/Kampus \/ institusi/i), { target: { value: 'Universitas Cirebon' } })
    fireEvent.change(screen.getByLabelText(/Program studi/i), { target: { value: 'Teknik Informatika' } })
    fireEvent.change(screen.getByLabelText(/^Semester/i), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText(/Tahun masuk/i), { target: { value: '2025' } })
    fireEvent.change(screen.getByLabelText(/Kecamatan asal/i), { target: { value: 'Jatibarang' } })
    fireEvent.change(screen.getByLabelText(/Desa \/ kelurahan/i), { target: { value: 'Jatibarang Baru' } })
    fireEvent.change(screen.getByLabelText(/Alamat domisili/i), { target: { value: 'Jalan Perjuangan nomor 10, Cirebon' } })
    fireEvent.change(screen.getByLabelText(/Alasan ingin bergabung/i), { target: { value: 'Saya ingin belajar dan berkontribusi bersama IKMI Cirebon.' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Kirim Data Bergabung/i }))

    await waitFor(() => expect(submitRegistrationAction).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Nadia Indriyani',
      email: 'nadia@example.test',
      semester: '3',
      entryYear: 2025,
      consent: true,
    })))
    expect(mockPush).toHaveBeenCalledWith('/gabung/success?req=REG-2026-0007')
  })
})
