import { PublicNavbar } from './_components/public-navbar'
import { PublicFooter } from './_components/public-footer'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="public-shell flex min-h-screen w-full flex-col overflow-x-clip bg-background">
      <PublicNavbar />
      {children}
      <PublicFooter />
    </div>
  )
}
