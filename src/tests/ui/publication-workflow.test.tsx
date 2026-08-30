import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PostWorkflowActions } from '@/app/(dashboard)/admin/cms/posts/[id]/PostWorkflowActions'
import { requestPostRevisionAction, schedulePostAction } from '@/features/blog/actions'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))
jest.mock('@/features/blog/actions', () => ({
  approvePostAction: jest.fn(), archivePostAction: jest.fn(), deletePostAction: jest.fn(), publishPostAction: jest.fn(), submitPostForReviewAction: jest.fn(),
  requestPostRevisionAction: jest.fn(), schedulePostAction: jest.fn(),
}))

describe('Publication workflow controls', () => {
  it('collects revision notes in a mobile sheet during review', async () => {
    jest.mocked(requestPostRevisionAction).mockResolvedValueOnce({ success: true })
    render(<PostWorkflowActions postId="post-14" status="PENDING_REVIEW" />)
    expect(screen.getByRole('button', { name: 'Setujui' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Minta Revisi' }))
    fireEvent.change(screen.getByLabelText(/^Catatan revisi/), { target: { value: 'Tambahkan sumber primer.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Revisi' }))
    await waitFor(() => expect(requestPostRevisionAction).toHaveBeenCalledWith('post-14', 'Tambahkan sumber primer.'))
  })

  it('collects an Asia/Jakarta schedule only from the Approved state', async () => {
    jest.mocked(schedulePostAction).mockResolvedValueOnce({ success: true })
    render(<PostWorkflowActions postId="post-14" status="APPROVED" />)
    fireEvent.click(screen.getByRole('button', { name: 'Jadwalkan' }))
    fireEvent.change(screen.getByLabelText(/^Tanggal dan waktu publikasi/), { target: { value: '2026-08-20T09:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Jadwal' }))
    await waitFor(() => expect(schedulePostAction).toHaveBeenCalledWith('post-14', '2026-08-20T09:00'))
  })
})
