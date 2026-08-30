import type { Metadata } from 'next'
import { DesignSystemPreview } from '../_design-system/preview'

export const metadata: Metadata = {
  title: 'Preview Design System',
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * A deliberately noindex review route. It contains no private data and lets
 * the design foundation be reviewed before later phases adopt it page by page.
 */
export default function DesignSystemPage() {
  return <DesignSystemPreview />
}
