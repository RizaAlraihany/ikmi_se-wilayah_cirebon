import { fireEvent, render, screen } from '@testing-library/react'
import { ListboxSelect } from '@/components/ui/listbox-select'

const options = [
  { value: 'berita', label: 'Berita' },
  { value: 'opini', label: 'Opini' },
  { value: 'kajian', label: 'Kajian' },
]

describe('ListboxSelect', () => {
  it('supports arrow navigation and restores focus after Escape', () => {
    render(<ListboxSelect aria-label="Kategori" defaultValue="berita" options={options} />)

    const trigger = screen.getByRole('button', { name: 'Kategori' })
    fireEvent.click(trigger)

    const berita = screen.getByRole('option', { name: 'Berita' })
    const opini = screen.getByRole('option', { name: 'Opini' })
    expect(berita).toHaveFocus()

    fireEvent.keyDown(berita, { key: 'ArrowDown' })
    expect(opini).toHaveFocus()

    fireEvent.keyDown(opini, { key: 'Escape' })
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('selects an option and returns focus to the trigger', () => {
    const onValueChange = jest.fn()
    render(
      <ListboxSelect
        aria-label="Kategori"
        defaultValue="berita"
        options={options}
        onValueChange={onValueChange}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Kategori' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('option', { name: 'Kajian' }))

    expect(onValueChange).toHaveBeenCalledWith('kajian')
    expect(trigger).toHaveTextContent('Kajian')
    expect(trigger).toHaveFocus()
  })
})
