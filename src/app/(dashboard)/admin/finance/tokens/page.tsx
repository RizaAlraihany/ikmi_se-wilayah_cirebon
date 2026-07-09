import Link from 'next/link'
import { Key, Plus } from 'lucide-react'
import { lpjTokenRepository } from '@/features/lpj-token/repository'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

export default async function LpjTokensPage() {
  const tokens = await lpjTokenRepository.findMany(0, 50)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">LPJ Token</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Generate dan kelola token sekali pakai untuk pengurus submit LPJ tanpa akses admin.
          </p>
        </div>
        <Link href="/admin/finance/tokens/new">
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-card px-5 py-2.5 text-sm font-bold text-surface shadow-card transition hover:opacity-90">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Generate Token Baru
          </button>
        </Link>
      </div>

      {tokens.length === 0 ? (
        <Card>
          <EmptyState
            icon={Key}
            title="Belum ada LPJ Token"
            description="Generate token untuk pengurus yang perlu submit LPJ."
            actionHref="/admin/finance/tokens/new"
            actionLabel="Generate Token"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const isExpired = token.expiredAt < new Date()
            const statusTone =
              token.status === 'ACTIVE' && !isExpired
                ? 'success'
                : token.status === 'USED'
                  ? 'surface'
                  : 'warning'

            return (
              <Card key={token.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading font-bold text-primary">{token.activityName}</h2>
                        <Badge tone={statusTone}>
                          {token.status === 'USED'
                            ? 'Sudah Digunakan'
                            : token.status === 'EXPIRED' || isExpired
                              ? 'Kedaluwarsa'
                              : 'Aktif'}
                        </Badge>
                      </div>
                      {token.description ? (
                        <p className="text-sm text-text-secondary">{token.description}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                        <span>
                          Dibuat oleh: <strong>{token.generator.name}</strong>
                        </span>
                        <span>
                          Expired:{' '}
                          <strong>
                            {token.expiredAt.toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </strong>
                        </span>
                        {token.usedAt ? (
                          <span>
                            Digunakan: <strong>{token.usedAt.toLocaleString('id-ID')}</strong>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {token.status === 'ACTIVE' && !isExpired ? (
                      <div className="rounded-xl bg-surface-alt p-3 font-mono text-xs text-primary break-all lg:max-w-xs">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                          Token
                        </p>
                        {token.token}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
