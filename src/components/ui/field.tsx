import { cn } from '@/lib/utils'
import { Label } from './label'

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  htmlFor?: string
  error?: string
  description?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({
  label,
  htmlFor,
  error,
  description,
  required,
  children,
  className,
  ...props
}: FieldProps) {
  return (
    <div className={cn('w-full space-y-2', className)} {...props}>
      {label && (
        <Label htmlFor={htmlFor} className={cn('text-sm font-semibold text-primary', error && 'text-destructive')}>
          {label} {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
        </Label>
      )}

      {children}

      {description && !error && (
        <p id={htmlFor ? `${htmlFor}-description` : undefined} className="text-sm text-muted-foreground">{description}</p>
      )}

      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-sm font-medium text-destructive" role="alert">{error}</p>
      )}
    </div>
  )
}
