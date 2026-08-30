import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { FileUpload } from '@/components/ui/file-upload'
import { PasswordInput } from '@/components/ui/password-input'
import { StatusBadge } from '@/components/ui/status-badge'

describe('IKMI Design System primitives', () => {
  it('renders concrete action and semantic status labels', () => {
    render(
      <>
        <Button>Simpan Program</Button>
        <StatusBadge status="PUBLISHED" label="Dipublikasikan" />
        <Alert tone="danger" title="Tidak dapat menyimpan">Coba lagi setelah memeriksa koneksi.</Alert>
      </>,
    )

    expect(screen.getByRole('button', { name: 'Simpan Program' })).toHaveClass(
      'ikmi-button',
      'ikmi-button--primary',
      'min-h-12',
      'rounded-full',
    )
    expect(screen.getByText('Dipublikasikan')).toHaveClass('bg-success-surface')
    expect(screen.getByRole('alert')).toHaveTextContent('Tidak dapat menyimpan')
  })

  it('opens and closes dialog from an explicit user action', () => {
    function DialogExample() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Button onClick={() => setOpen(true)}>Buka konfirmasi</Button>
          <Dialog open={open} onOpenChange={setOpen} title="Konfirmasi perubahan">
            <Button onClick={() => setOpen(false)}>Simpan</Button>
          </Dialog>
        </>
      )
    }

    render(<DialogExample />)
    fireEvent.click(screen.getByRole('button', { name: 'Buka konfirmasi' }))
    expect(screen.getByRole('dialog', { name: 'Konfirmasi perubahan' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tutup dialog' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows selected files and reports a client-side size error', () => {
    const onFilesChange = jest.fn()
    const { rerender } = render(
      <FileUpload label="Dokumen" maxSizeBytes={1024} onFilesChange={onFilesChange} />,
    )
    const input = screen.getByLabelText('Dokumen')
    const smallFile = new File(['isi'], 'catatan.pdf', { type: 'application/pdf' })

    fireEvent.change(input, { target: { files: [smallFile] } })
    expect(screen.getByText('catatan.pdf')).toBeInTheDocument()
    expect(onFilesChange).toHaveBeenLastCalledWith([smallFile])

    rerender(<FileUpload label="Dokumen" maxSizeBytes={1} onFilesChange={onFilesChange} />)
    const tooLargeFile = new File(['terlalu besar'], 'lampiran.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText('Dokumen'), { target: { files: [tooLargeFile] } })
    expect(screen.getByText(/melebihi batas/i)).toBeInTheDocument()
  })

  it('opens a keyboard-addressable dropdown menu and restores focus after selection', () => {
    const onSelect = jest.fn()
    render(
      <Dropdown label="Aksi agenda" trigger="Aksi">
        <DropdownItem onSelect={onSelect}>Arsipkan agenda</DropdownItem>
      </Dropdown>,
    )

    const trigger = screen.getByRole('button', { name: 'Aksi agenda' })
    expect(trigger).toHaveClass('min-w-11')

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const menuItem = screen.getByRole('menuitem', { name: 'Arsipkan agenda' })
    expect(menuItem).toHaveFocus()

    fireEvent.click(menuItem)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes an open dropdown when another dropdown is opened', () => {
    render(
      <>
        <Dropdown label="Menu pertama" trigger="Pertama">
          <DropdownItem>Aksi pertama</DropdownItem>
        </Dropdown>
        <Dropdown label="Menu kedua" trigger="Kedua">
          <DropdownItem>Aksi kedua</DropdownItem>
        </Dropdown>
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Menu pertama' }))
    expect(screen.getByRole('menuitem', { name: 'Aksi pertama' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Menu kedua' }))
    expect(screen.queryByRole('menuitem', { name: 'Aksi pertama' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Aksi kedua' })).toBeInTheDocument()
  })

  it('keeps a submit form mounted until its dropdown action is dispatched', () => {
    const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <Dropdown label="Menu profil" trigger="Profil">
        <form onSubmit={onSubmit}>
          <DropdownItem type="submit">Keluar</DropdownItem>
        </form>
      </Dropdown>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Menu profil' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Keluar' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('keeps the password visibility control at the mobile touch-target minimum', () => {
    render(<PasswordInput aria-label="Password" />)

    const toggle = screen.getByRole('button', { name: 'Tampilkan password' })
    expect(toggle).toHaveClass('h-11', 'w-11')
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')

    fireEvent.click(toggle)
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  })
})
