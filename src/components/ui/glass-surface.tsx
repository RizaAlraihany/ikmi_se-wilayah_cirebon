import { cn } from '@/lib/utils'

export type GlassLevel = 'subtle' | 'interactive' | 'floating'
export type GlassTint = 'neutral' | 'brand' | 'danger'

type GlassSurfaceProps<T extends React.ElementType = 'div'> = {
  as?: T
  level?: GlassLevel
  tint?: GlassTint
  interactive?: boolean
  className?: string
  children?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

/**
 * The single material primitive for translucent IKMI surfaces.
 * Domain components choose hierarchy; this primitive owns blur, edge and depth.
 */
export function GlassSurface<T extends React.ElementType = 'div'>({
  as,
  level = 'subtle',
  tint = 'neutral',
  interactive = false,
  className,
  children,
  ...props
}: GlassSurfaceProps<T>) {
  const Component = as ?? 'div'

  return (
    <Component
      data-glass={level}
      data-glass-tint={tint}
      data-glass-interactive={interactive || undefined}
      className={cn('ikmi-glass-surface', className)}
      {...props}
    >
      {children}
    </Component>
  )
}
