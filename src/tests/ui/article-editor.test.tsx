import { render, screen } from '@testing-library/react'
import { ArticleEditor } from '@/components/ui/editor'

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
