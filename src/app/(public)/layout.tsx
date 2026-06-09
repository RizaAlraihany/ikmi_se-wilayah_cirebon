import { PublicNavbar } from './_components/public-navbar'
import { PublicFooter } from './_components/public-footer'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PublicNavbar />
      {children}
      <PublicFooter />
    </>
  )
}
