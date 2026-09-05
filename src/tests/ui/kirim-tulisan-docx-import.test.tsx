import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KirimTulisanForm } from '@/app/(public)/kirim-tulisan/kirim-tulisan-form'

jest.mock('@/features/kirim-tulisan/actions', () => ({
  discardWritingDocxImportAction: jest.fn(),
  importWritingDocxAction: jest.fn(),
  submitKaryaTulisAction: jest.fn(),
  uploadWritingInlineImageAction: jest.fn(),
}))

jest.mock('@/components/ui/editor', () => ({
  ArticleEditor: ({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) => (
    <textarea data-testid="shared-article-editor" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} />
  ),
}))

const { importWritingDocxAction, discardWritingDocxImportAction } = jest.requireMock('@/features/kirim-tulisan/actions') as {
  importWritingDocxAction: jest.Mock
  discardWritingDocxImportAction: jest.Mock
}

describe('KirimTulisanForm DOCX import', () => {
  beforeEach(() => {
    importWritingDocxAction.mockReset()
    discardWritingDocxImportAction.mockReset().mockResolvedValue({ success: true })
    ;(jest.requireMock('@/features/kirim-tulisan/actions').submitKaryaTulisAction as jest.Mock).mockReset()
    jest.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('populates the existing editor and separate metadata while retaining the attachment', async () => {
    importWritingDocxAction.mockResolvedValue({
      success: true,
      importSessionId: '00000000-0000-4000-8000-000000000001',
      importAssetManifest: 'manifest-1',
      title: 'Judul hasil impor',
      excerpt: 'Ringkasan hasil impor.',
      html: '<h2>Pembahasan</h2><p>Isi hasil impor.</p>',
      warnings: ['Satu gambar perlu diperiksa.'],
    })
    render(<KirimTulisanForm />)

    const file = new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [file] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))

    await waitFor(() => expect(importWritingDocxAction).toHaveBeenCalledTimes(1))
    expect(screen.getByPlaceholderText('Judul tulisan Anda')).toHaveValue('Judul hasil impor')
    expect(screen.getByPlaceholderText('Ringkasan singkat tentang isi tulisan Anda...')).toHaveValue('Ringkasan hasil impor.')
    expect(screen.getByTestId('shared-article-editor')).toHaveValue('<h2>Pembahasan</h2><p>Isi hasil impor.</p>')
    expect(screen.getByText('artikel.docx')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Satu gambar perlu diperiksa.')
  })

  it('does not offer import for PDF', () => {
    render(<KirimTulisanForm />)
    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['pdf'], 'artikel.pdf', { type: 'application/pdf' })] } })
    expect(screen.queryByRole('button', { name: 'Impor ke editor' })).not.toBeInTheDocument()
  })

  it('does not replace edited content when re-import is cancelled', async () => {
    render(<KirimTulisanForm />)
    const editor = screen.getByTestId('shared-article-editor')
    fireEvent.change(editor, { target: { value: '<p>Tulisan manual.</p>' } })
    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } })
    jest.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))

    expect(importWritingDocxAction).not.toHaveBeenCalled()
    expect(screen.getByTestId('shared-article-editor')).toHaveValue('<p>Tulisan manual.</p>')
  })

  it.each([
    ['text-only', '<p>Tulisan manual.</p>'],
    ['image-only', '<p><img src="https://res.cloudinary.com/ikmi/image/upload/v1/foto.jpg" alt="Foto" /></p>'],
  ])('requires confirmation before replacing %s editor content', async (_label, content) => {
    importWritingDocxAction.mockResolvedValue({ success: true, importSessionId: '00000000-0000-4000-8000-000000000001', title: 'Judul impor', excerpt: '', html: '<p>Hasil impor.</p>', warnings: [] })
    render(<KirimTulisanForm />)
    fireEvent.change(screen.getByTestId('shared-article-editor'), { target: { value: content } })
    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))

    expect(window.confirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByTestId('shared-article-editor')).toHaveValue('<p>Hasil impor.</p>'))
  })

  it.each([
    ['empty', ''],
    ['whitespace-only', '<p>   </p><h2></h2><p><br /></p>'],
  ])('does not require confirmation for %s editor content', async (_label, content) => {
    importWritingDocxAction.mockResolvedValue({ success: true, importSessionId: '00000000-0000-4000-8000-000000000001', title: 'Judul impor', excerpt: '', html: '<p>Hasil impor.</p>', warnings: [] })
    render(<KirimTulisanForm />)
    fireEvent.change(screen.getByTestId('shared-article-editor'), { target: { value: content } })
    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))

    expect(window.confirm).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByTestId('shared-article-editor')).toHaveValue('<p>Hasil impor.</p>'))
  })

  it('replaces import warnings on a later successful import', async () => {
    importWritingDocxAction
      .mockResolvedValueOnce({ success: true, importSessionId: '00000000-0000-4000-8000-000000000001', importAssetManifest: 'manifest-1', title: 'Pertama', excerpt: '', html: '<p>Impor pertama.</p>', warnings: ['Peringatan lama.'] })
      .mockResolvedValueOnce({ success: true, importSessionId: '00000000-0000-4000-8000-000000000002', importAssetManifest: 'manifest-2', title: 'Kedua', excerpt: '', html: '<p>Impor kedua.</p>', warnings: ['Peringatan baru.'] })
    render(<KirimTulisanForm />)
    const choose = () => fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } })
    choose()
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))
    await waitFor(() => expect(screen.getByText('Peringatan lama.')).toBeInTheDocument())
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))
    await waitFor(() => expect(screen.getByText('Peringatan baru.')).toBeInTheDocument())
    expect(screen.queryByText('Peringatan lama.')).not.toBeInTheDocument()
    expect(discardWritingDocxImportAction).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001', 'manifest-1')
  })

  it('clears import warnings after successful submission and starting a new one', async () => {
    importWritingDocxAction.mockResolvedValue({ success: true, importSessionId: '00000000-0000-4000-8000-000000000001', importAssetManifest: 'manifest-1', title: 'Judul impor', excerpt: '', html: '<p>Isi impor yang cukup.</p>', warnings: ['Periksa gambar.'] })
    const submitKaryaTulisAction = jest.requireMock('@/features/kirim-tulisan/actions').submitKaryaTulisAction as jest.Mock
    submitKaryaTulisAction.mockResolvedValue({ success: true, submissionNumber: 'IKMI-KT-2026-0002' })
    const user = userEvent.setup()
    render(<KirimTulisanForm />)
    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))
    await waitFor(() => expect(screen.getByText('Periksa gambar.')).toBeInTheDocument())
    await user.clear(screen.getByPlaceholderText('Judul tulisan Anda'))
    await user.type(screen.getByPlaceholderText('Judul tulisan Anda'), 'Judul artikel yang valid')
    await user.clear(screen.getByTestId('shared-article-editor'))
    await user.type(screen.getByTestId('shared-article-editor'), '<p>Isi impor yang cukup untuk dikirim.</p>')
    await user.type(screen.getByPlaceholderText('Masukkan nama lengkap Anda'), 'Penulis IKMI')
    await user.type(screen.getByPlaceholderText('contoh@email.com'), 'penulis@example.test')
    await user.type(screen.getByPlaceholderText('Contoh: 081234567890'), '081234567890')
    await user.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Kirim Tulisan' })).not.toBeDisabled())
    await user.click(screen.getByRole('button', { name: 'Kirim Tulisan' }))
    await waitFor(() => expect(submitKaryaTulisAction).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByText('Karya Tulis Berhasil Dikirim')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Tulisan Baru' }))

    expect(screen.queryByText('Periksa gambar.')).not.toBeInTheDocument()
  })

  it.each([
    ['structured failure', () => importWritingDocxAction.mockResolvedValue({ success: false, error: 'DOCX tidak valid.' })],
    ['thrown action', () => importWritingDocxAction.mockRejectedValue(new Error('network failure'))],
  ])('re-enables the form and preserves content after %s', async (_label, configureAction) => {
    configureAction()
    render(<KirimTulisanForm />)
    const editor = screen.getByTestId('shared-article-editor')
    fireEvent.change(editor, { target: { value: '<p>Konten lama.</p>' } })
    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))

    await waitFor(() => expect(screen.getByTestId('shared-article-editor')).not.toBeDisabled())
    expect(screen.getByTestId('shared-article-editor')).toHaveValue('<p>Konten lama.</p>')
    expect(screen.getByRole('button', { name: 'Impor ke editor' })).not.toBeDisabled()
  })

  it('re-enables the form after a successful import', async () => {
    let resolveImport!: (value: unknown) => void
    importWritingDocxAction.mockReturnValue(new Promise((resolve) => { resolveImport = resolve }))
    render(<KirimTulisanForm />)
    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))
    expect(screen.getByRole('button', { name: 'Mengimpor...' })).toBeDisabled()
    resolveImport({ success: true, importSessionId: '00000000-0000-4000-8000-000000000001', importAssetManifest: 'manifest-1', title: 'Judul impor', excerpt: '', html: '<p>Hasil impor.</p>', warnings: [] })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Impor ke editor' })).not.toBeDisabled())
  })

  it('discards the active DOCX session when its attachment is removed', async () => {
    importWritingDocxAction.mockResolvedValue({ success: true, importSessionId: '00000000-0000-4000-8000-000000000001', importAssetManifest: 'manifest-1', title: 'Judul impor', excerpt: '', html: '<p>Konten impor yang cukup.</p>', warnings: ['Peringatan impor.'] })
    render(<KirimTulisanForm />)

    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))
    await waitFor(() => expect(screen.getByText('Peringatan impor.')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Hapus lampiran' }))

    await waitFor(() => expect(discardWritingDocxImportAction).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001', 'manifest-1'))
    expect(screen.queryByText('artikel.docx')).not.toBeInTheDocument()
    expect(screen.queryByText('Peringatan impor.')).not.toBeInTheDocument()
  })

  it('keeps the form usable when DOCX cleanup fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    discardWritingDocxImportAction.mockResolvedValue({ success: false, error: 'Gambar sementara belum dapat dibersihkan.' })
    importWritingDocxAction.mockResolvedValue({ success: true, importSessionId: '00000000-0000-4000-8000-000000000001', importAssetManifest: 'manifest-1', title: 'Judul impor', excerpt: '', html: '<p>Konten impor yang cukup.</p>', warnings: [] })
    render(<KirimTulisanForm />)

    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hapus lampiran' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Hapus lampiran' }))

    await waitFor(() => expect(discardWritingDocxImportAction).toHaveBeenCalledTimes(1))
    expect(screen.getByLabelText('Pilih file')).toBeInTheDocument()
    expect(screen.getByTestId('shared-article-editor')).not.toBeDisabled()
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('preserves editor content and its import session while a temporary image remains referenced', async () => {
    const imageUrl = 'https://res.cloudinary.com/ikmi/image/upload/v1/ikmi/writing-submissions/docx-imports/00000000-0000-4000-8000-000000000001/image-1.png'
    importWritingDocxAction.mockResolvedValue({
      success: true,
      importSessionId: '00000000-0000-4000-8000-000000000001',
      importAssetManifest: 'manifest-1',
      title: 'Judul impor',
      excerpt: '',
      html: `<figure><img src="${imageUrl}" alt="Foto impor" /></figure>`,
      warnings: [],
      importedImages: [{ url: imageUrl, publicId: 'temporary-image-1' }],
    })
    render(<KirimTulisanForm />)

    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['docx'], 'artikel.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Impor ke editor' }))
    await waitFor(() => expect(screen.getByTestId('shared-article-editor')).toHaveValue(`<figure><img src="${imageUrl}" alt="Foto impor" /></figure>`))
    fireEvent.click(screen.getByRole('button', { name: 'Hapus lampiran' }))

    expect(discardWritingDocxImportAction).not.toHaveBeenCalled()
    expect(screen.getByTestId('shared-article-editor')).toHaveValue(`<figure><img src="${imageUrl}" alt="Foto impor" /></figure>`)
  })

  it('does not invoke DOCX cleanup for a plain PDF attachment', async () => {
    render(<KirimTulisanForm />)
    fireEvent.change(screen.getByLabelText('Pilih file'), { target: { files: [new File(['pdf'], 'artikel.pdf', { type: 'application/pdf' })] } })
    fireEvent.click(screen.getByRole('button', { name: 'Hapus lampiran' }))

    await waitFor(() => expect(screen.getByLabelText('Pilih file')).toBeInTheDocument())
    expect(discardWritingDocxImportAction).not.toHaveBeenCalled()
  })
})
