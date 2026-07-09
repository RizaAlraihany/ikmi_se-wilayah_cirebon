'use client'

import { useState } from 'react'
import { Bookmark, Check, Share2 } from 'lucide-react'

export function ArticleActionButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const [bookmarked, setBookmarked] = useState(() => {
    if (typeof window === 'undefined') return false

    return window.localStorage.getItem(`ikmi-bookmarked-article:${window.location.pathname}`) === 'true'
  })

  function handleBookmark() {
    const bookmarkKey = `ikmi-bookmarked-article:${window.location.pathname}`

    const nextBookmarked = !bookmarked
    setBookmarked(nextBookmarked)

    if (nextBookmarked) {
      window.localStorage.setItem(bookmarkKey, 'true')
    } else {
      window.localStorage.removeItem(bookmarkKey)
    }
  }

  async function handleShare() {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleBookmark}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-alt hover:text-primary"
        aria-label={bookmarked ? 'Hapus bookmark artikel' : 'Bookmark artikel'}
        aria-pressed={bookmarked}
        title={bookmarked ? 'Bookmark disimpan' : 'Bookmark artikel'}
      >
        <Bookmark
          className="h-4 w-4"
          fill={bookmarked ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        onClick={handleShare}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-alt hover:text-primary"
        aria-label={copied ? 'Link artikel disalin' : 'Bagikan artikel'}
        title={copied ? 'Link disalin' : 'Bagikan artikel'}
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary" aria-hidden="true" />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
