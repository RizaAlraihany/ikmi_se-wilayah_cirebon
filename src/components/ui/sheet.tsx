'use client'

import { Dialog, type DialogProps } from './dialog'

type SheetProps = Omit<DialogProps, 'containerClassName' | 'contentClassName'>

export function Sheet(props: SheetProps) {
  return (
    <Dialog
      {...props}
      containerClassName="items-end p-0"
      contentClassName="sheet-safe-padding max-h-[90svh] max-w-none overflow-y-auto rounded-b-none border-x-0 border-b-0 p-5 sm:max-w-2xl sm:rounded-t-lg sm:border-x sm:p-6"
    />
  )
}
