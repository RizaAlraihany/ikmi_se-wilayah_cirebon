'use client'

import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { inputControlClassName } from '@/components/ui/input'

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false)
    const Icon = isVisible ? EyeOff : Eye

    return (
      <div className="relative">
        <input
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          disabled={disabled}
          className={cn(inputControlClassName, 'h-12 px-4 pr-12 lg:h-11', className)}
          {...props}
        />
        <button
          type="button"
          className="absolute right-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-transparent bg-transparent text-text-secondary transition-colors hover:bg-surface-alt hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50"
          onClick={() => setIsVisible((current) => !current)}
          disabled={disabled}
          aria-label={isVisible ? 'Sembunyikan password' : 'Tampilkan password'}
          aria-pressed={isVisible}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
