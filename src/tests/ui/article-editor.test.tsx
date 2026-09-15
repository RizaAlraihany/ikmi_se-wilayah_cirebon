import { render, screen } from '@testing-library/react'
import { ArticleEditor } from '@/components/ui/editor'
import userEvent from '@testing-library/user-event'

const mockChain = {
  focus: () => mockChain,
  toggleBold: () => mockChain,
  toggleItalic: () => mockChain,
  toggleHeading: () => mockChain,
  toggleBulletList: () => mockChain,
  toggleOrderedList: () => mockChain,
  toggleBlockquote: () => mockChain,
  setLink: () => mockChain,
  unsetLink: () => mockChain,
  extendMarkRange: () => mockChain,
  insertContent: () => mockChain,
  undo: () => mockChain,
  redo: () => mockChain,
  run: () => true,
}

const mockEditor = {
  isActive: () => false,
  can: () => ({ chain: () => mockChain }),
  chain: () => mockChain,
  getAttributes: () => ({}),
  commands: { setContent: jest.fn() },
  setEditable: jest.fn(),
}

jest.mock('@tiptap/react', () => ({
  EditorContent: () => <div data-testid="article-editor-content" />,
  useEditor: () => mockEditor,
}))

describe('ArticleEditor', () => {
  it('recovers from a rejected image upload and permits retry without losing alt text', async () => {
    const user = userEvent.setup()
    const upload = jest.fn().mockRejectedValueOnce(new Error('Network failed')).mockResolvedValueOnce({ url: 'https://res.cloudinary.com/test/image/upload/image.jpg' })
    render(<ArticleEditor value="<p>Isi awal.</p>" onChange={jest.fn()} onImageUpload={upload} />)
    await user.click(screen.getByRole('button', { name: 'Tambah gambar' }))
    await user.upload(screen.getByLabelText('File gambar artikel'), new File(['image'], 'image.jpg', { type: 'image/jpeg' }))
    await user.type(screen.getByLabelText('Teks alternatif gambar'), 'Kegiatan IKMI')
    await user.click(screen.getByRole('button', { name: 'Sisipkan gambar' }))
    expect(await screen.findByText(/Periksa koneksi lalu coba kembali/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sisipkan gambar' })).toBeEnabled()
    expect(screen.getByLabelText('Teks alternatif gambar')).toHaveValue('Kegiatan IKMI')
    await user.click(screen.getByRole('button', { name: 'Sisipkan gambar' }))
    expect(upload).toHaveBeenCalledTimes(2)
    expect(screen.queryByLabelText('Teks alternatif gambar')).not.toBeInTheDocument()
  })

  it('exposes the shared v5 article controls without an H1 control', () => {
    render(<ArticleEditor value="<p>Isi awal.</p>" onChange={jest.fn()} />)

    for (const label of [
      'Tebal',
      'Miring',
      'Heading 2',
      'Heading 3',
      'Daftar tanpa nomor',
      'Daftar bernomor',
      'Kutipan',
      'Tambah tautan',
      'Tambah gambar',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }

    expect(screen.queryByRole('button', { name: /heading 1/i })).not.toBeInTheDocument()
  })
})
