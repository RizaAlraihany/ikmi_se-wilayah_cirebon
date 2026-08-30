import { cn } from '@/lib/utils'

type CardVariant = 'solid' | 'subtle' | 'glass'

export function Card({
  variant = 'solid',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        variant === 'solid' && 'border-border bg-surface shadow-sm',
        variant === 'subtle' && 'border-border bg-surface-alt',
        variant === 'glass' && 'ikmi-glass-surface border-transparent',
        className,
      )}
      data-glass={variant === 'glass' ? 'subtle' : undefined}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1 p-4 sm:p-5', className)} {...props} />
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-heading text-lg font-bold text-primary', className)} {...props} />
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-text-secondary', className)} {...props} />
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-0 sm:p-5 sm:pt-0', className)} {...props} />
}
