import { cn } from '@/lib/utils'

export function KomdigiPageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-3xl">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-primary">{title}</h1>
        <p className="mt-2 text-sm leading-7 text-text-secondary md:text-base">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function KomdigiPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('glass-subtle overflow-hidden rounded-xl', className)}>{children}</div>
}
