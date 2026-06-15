'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Check, Send, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { approvePostAction, archivePostAction, deletePostAction, publishPostAction, submitPostForReviewAction } from '@/features/blog/actions'

type WorkflowAction = 'submit' | 'approve' | 'publish' | 'archive' | 'delete'

export function PostWorkflowActions({ postId, status }: { postId: string; status: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState<WorkflowAction | null>(null)

  async function run(action: WorkflowAction) {
    if (action === 'delete' && !window.confirm('Hapus artikel ini? Artikel akan disembunyikan dari CMS dan website publik.')) {
      return
    }

    setPending(action)
    setMessage('')
    const result =
      action === 'submit'
        ? await submitPostForReviewAction(postId)
        : action === 'approve'
          ? await approvePostAction(postId)
          : action === 'publish'
            ? await publishPostAction(postId)
            : action === 'archive'
              ? await archivePostAction(postId)
              : await deletePostAction(postId)

    setPending(null)
    if (result.error) {
      setMessage(result.error)
      return
    }

    if (action === 'delete') {
      router.push('/admin/cms/posts')
      router.refresh()
      return
    }

    setMessage('Workflow berhasil diperbarui.')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {message ? <p className="rounded-2xl bg-accent/15 px-4 py-3 text-sm font-semibold text-primary ring-1 ring-accent/30">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        {status === 'DRAFT' ? (
          <Button type="button" size="sm" onClick={() => run('submit')} disabled={pending === 'submit'}>
            <Send className="h-4 w-4" aria-hidden="true" />
            Submit Review
          </Button>
        ) : null}
        {status === 'PENDING_REVIEW' ? (
          <Button type="button" size="sm" onClick={() => run('approve')} disabled={pending === 'approve'}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Approve
          </Button>
        ) : null}
        {status === 'APPROVED' ? (
          <Button type="button" size="sm" onClick={() => run('publish')} disabled={pending === 'publish'}>
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            Publish
          </Button>
        ) : null}
        {status !== 'ARCHIVED' ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => run('archive')} disabled={pending === 'archive'}>
            <Archive className="h-4 w-4" aria-hidden="true" />
            Archive
          </Button>
        ) : null}
        <Button type="button" variant="danger" size="sm" onClick={() => run('delete')} disabled={pending === 'delete'}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </div>
  )
}
