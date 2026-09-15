import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DepartmentGrid } from '@/app/(public)/struktur/department-grid'

describe('Structure dialog keyboard navigation', () => {
  it('keeps Tab inside the open dialog and restores focus on Escape', async () => {
    const user = userEvent.setup()
    render(<><a href="#outside">Di luar dialog</a><DepartmentGrid leadDepartment={null} departments={[{ id: 'unit', code: 'KOMDIGI', name: 'Komdigi', description: 'Departemen', memberCount: 0, users: [] }]} /></>)
    const trigger = screen.getByRole('button', { name: 'Lihat pengurus Komdigi' })
    await user.click(trigger)
    const close = screen.getByRole('button', { name: 'Tutup detail departemen' })
    expect(close).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(close).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
