import { PublicNavbar } from './_components/public-navbar'
import { PublicFooter } from './_components/public-footer'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden w-full">
      <PublicNavbar />
      {children}
      <PublicFooter />
    </div>
  )
}
