import { Editor } from '@tiptap/core'
import { articleEditorExtensions, normalizePastedArticleHtml } from '@/components/ui/editor'

describe('ArticleEditor TipTap configuration', () => {
  it('round-trips historical headings without converting them to paragraphs', () => {
    const editor = new Editor({
      extensions: articleEditorExtensions,
      content: '<h1>Legacy heading</h1><h2>Section</h2><h4>Legacy subsection</h4><p>Body</p>',
    })

    expect(editor.getHTML()).toContain('<h1>Legacy heading</h1>')
    expect(editor.getHTML()).toContain('<h2>Section</h2>')
    expect(editor.getHTML()).toContain('<h4>Legacy subsection</h4>')
    expect(editor.getHTML()).toContain('<p>Body</p>')
    editor.destroy()
  })

  it('keeps pasted H1 out of new article bodies while retaining semantic authored HTML', () => {
    const editor = new Editor({
      extensions: articleEditorExtensions,
      content: normalizePastedArticleHtml('<h1>Judul yang ditempel</h1><p><strong>Tebal</strong> dan <em>miring</em></p><ol><li>Satu</li></ol>'),
    })

    expect(editor.getHTML()).toContain('<h2>Judul yang ditempel</h2>')
    expect(editor.getHTML()).not.toContain('<h1>')
    expect(editor.getHTML()).toContain('<strong>Tebal</strong>')
    expect(editor.getHTML()).toContain('<em>miring</em>')
    expect(editor.getHTML()).toContain('<ol><li><p>Satu</p></li></ol>')
    editor.destroy()
  })
})
