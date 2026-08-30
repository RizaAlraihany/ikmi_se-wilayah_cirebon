'use client'

import { Dialog, type DialogProps } from './dialog'

type DrawerProps = Omit<DialogProps, 'containerClassName' | 'contentClassName'> & {
  side?: 'left' | 'right'
}

export function Drawer({ side = 'right', ...props }: DrawerProps) {
  return (
    <Dialog
      {...props}
      containerClassName={side === 'right' ? 'justify-end p-0' : 'justify-start p-0'}
      contentClassName={`h-full max-w-[22rem] rounded-none border-y-0 p-5 sm:p-6 ${side === 'right' ? 'border-r-0' : 'border-l-0'}`}
    />
  )
}
