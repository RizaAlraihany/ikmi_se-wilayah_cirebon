import Link from 'next/link'
import { Megaphone, Plus, Send } from 'lucide-react'
import { announcementQueries } from '@/features/announcements/queries'
import { publishAnnouncementAction, deleteAnnouncementAction } from '@/features/announcements/actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default async function AnnouncementsPage() {
  const announcements = await announcementQueries.getAnnouncements(0, 30)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Pengumuman</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Buat dan kirim pengumuman ke seluruh anggota aktif via WhatsApp.
          </p>
        </div>
        <Link href="/admin/announcements/new">
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Buat Pengumuman
          </Button>
        </Link>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="Belum ada pengumuman"
            description="Buat pengumuman baru untuk dikirim ke seluruh anggota aktif."
            actionHref="/admin/announcements/new"
            actionLabel="Buat Pengumuman"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading font-bold text-primary">{item.title}</h2>
                    {item.publishedAt ? (
                      <Badge tone="success">Published</Badge>
                    ) : (
                      <Badge tone="surface">Draft</Badge>
                    )}
                    {item.isWaBlasted ? (
                      <Badge tone="accent">WA Terkirim</Badge>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-sm text-text-secondary">{item.content}</p>
                  <p className="text-xs text-text-muted">
                    {item.createdAt.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {item.blastSentAt ? (
                      <span className="ml-2 text-accent">
                        · WA dikirim {item.blastSentAt.toLocaleString('id-ID')}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  {!item.publishedAt ? (
                    <form
                      action={async () => {
                        'use server'
                        await publishAnnouncementAction(item.id)
                      }}
                    >
                      <Button type="submit" size="sm">
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Publish & Blast WA
                      </Button>
                    </form>
                  ) : null}
                  <form
                    action={async () => {
                      'use server'
                      await deleteAnnouncementAction(item.id)
                    }}
                  >
                    <Button type="submit" variant="danger" size="sm">
                      Hapus
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
