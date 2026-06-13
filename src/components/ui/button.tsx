import Link from 'next/link'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'default' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'icon'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-surface shadow-card hover:bg-secondary',
  secondary: 'bg-surface text-primary shadow-soft ring-1 ring-border hover:bg-surface-alt',
  ghost: 'bg-transparent text-primary hover:bg-primary/5',
  danger: 'bg-danger text-danger-foreground hover:bg-danger/80',
  outline: 'bg-surface text-primary shadow-soft ring-1 ring-border hover:bg-surface-alt',
  default: 'bg-accent text-surface shadow-card hover:bg-secondary',
  destructive: 'bg-danger text-danger-foreground hover:bg-danger/80',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 text-sm',
  md: 'min-h-11 px-5 text-sm',
  icon: 'h-11 w-11 p-0',
}

type SharedProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

type ButtonProps = SharedProps & React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

type ButtonLinkProps = SharedProps & React.ComponentProps<typeof Link>

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
