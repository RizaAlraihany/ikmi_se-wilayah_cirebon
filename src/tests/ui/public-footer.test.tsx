import React from 'react'
import { render, screen } from '@testing-library/react'
import { PublicFooter } from '@/app/(public)/_components/public-footer'

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement('img', props),
}))

jest.mock('@/features/web-config/queries', () => ({
  webConfigQueries: {
    getPublicContactInfo: jest.fn().mockResolvedValue({
      email: null,
      whatsapp: null,
      address: null,
      instagram: null,
      tiktok: null,
      youtube: null,
    }),
  },
}))

describe('public footer Agenda navigation', () => {
  it('renders the canonical Kegiatan href', async () => {
    render(await PublicFooter())

    expect(screen.getByRole('link', { name: /Agenda & Kegiatan/i })).toHaveAttribute('href', '/kegiatan')
  })
})
