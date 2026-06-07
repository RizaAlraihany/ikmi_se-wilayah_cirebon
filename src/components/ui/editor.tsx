'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Redo, Undo } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
}

export function Editor({ id, value, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-primary',
      },
    },
  })

  if (!editor) {
    return null
  }

  const controls = [
    {
      label: 'Bold',
      icon: Bold,
      active: editor.isActive('bold'),
      disabled: !editor.can().chain().focus().toggleBold().run(),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      icon: Italic,
      active: editor.isActive('italic'),
      disabled: !editor.can().chain().focus().toggleItalic().run(),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Heading',
      icon: Heading2,
      active: editor.isActive('heading', { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Bullet list',
      icon: List,
      active: editor.isActive('bulletList'),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Ordered list',
      icon: ListOrdered,
      active: editor.isActive('orderedList'),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Blockquote',
      icon: Quote,
      active: editor.isActive('blockquote'),
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: 'Undo',
      icon: Undo,
      disabled: !editor.can().chain().focus().undo().run(),
      onClick: () => editor.chain().focus().undo().run(),
    },
    {
      label: 'Redo',
      icon: Redo,
      disabled: !editor.can().chain().focus().redo().run(),
      onClick: () => editor.chain().focus().redo().run(),
    },
  ]

  return (
    <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-background p-2">
        {controls.map((control, index) => (
          <button
            key={control.label}
            type="button"
            onClick={control.onClick}
            disabled={control.disabled}
            aria-label={control.label}
            className={cn(
              'rounded-xl p-2 text-primary transition hover:bg-primary/5 disabled:opacity-50',
              control.active && 'bg-accent text-surface hover:bg-accent',
              (index === 2 || index === 6) && 'ml-2',
            )}
          >
            <control.icon className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
