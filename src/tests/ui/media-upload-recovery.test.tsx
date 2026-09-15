import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MediaLibraryClient } from '@/app/(dashboard)/admin/cms/media/MediaLibraryClient'
import { uploadMediaAction } from '@/features/media/actions'

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }))
jest.mock('@/features/media/actions', () => ({ uploadMediaAction: jest.fn(), deleteMediaAction: jest.fn() }))

describe('CMS media upload recovery', () => {
  it('returns from the loading state after a network error and permits a retry', async () => {
    const user = userEvent.setup()
    jest.mocked(uploadMediaAction).mockRejectedValueOnce(new Error('Network'))
    render(<MediaLibraryClient assets={[]} />)
    await user.upload(screen.getByLabelText('Upload media CMS'), new File(['image'], 'image.jpg', { type: 'image/jpeg' }))
    fireEvent.submit(screen.getByRole('button', { name: 'Upload' }).closest('form')!)
    expect(await screen.findByText(/Media belum dapat diunggah/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeEnabled()
  })
})
