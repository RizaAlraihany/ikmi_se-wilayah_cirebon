import { Users, UserCheck, UserMinus, ShieldAlert, BadgeCheck, Activity } from 'lucide-react'
import { membershipQueries } from '@/features/membership/queries'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { MembershipAnalytics } from './components/MembershipAnalytics'

export default async function AdminMembershipPage() {
  const stats = await membershipQueries.getDashboardStats()
  const analytics = await membershipQueries.getMembershipAnalytics()

  const statCards = [
    { label: 'Pendaftar Baru', value: stats.pendaftar, icon: Users, color: 'text-blue-500', href: '/admin/kaderisasi?tab=pending' },
    { label: 'Calon Anggota', value: stats.calonAnggota, icon: UserCheck, color: 'text-yellow-500', href: '/admin/kaderisasi?tab=approved' },
    { label: 'Anggota Aktif', value: stats.anggotaAktif, icon: Activity, color: 'text-green-500', href: '/admin/membership/active' },
    { label: 'Pengurus', value: stats.pengurus, icon: ShieldAlert, color: 'text-purple-500', href: '/admin/membership/management' },
    { label: 'Demisioner', value: stats.demisioner, icon: UserMinus, color: 'text-orange-500', href: '/admin/membership/demisioner' },
    { label: 'Alumni', value: stats.alumni, icon: BadgeCheck, color: 'text-gray-500', href: '/admin/membership/alumni' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Membership Lifecycle" description="Pantau status dan mutasi seluruh anggota IKMI Cirebon." />
        <Link 
          href="/admin/membership/integrity" 
          className="px-4 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium text-sm rounded-md transition-colors"
        >
          Cek Data Integrity
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Link key={i} href={stat.href}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center p-6">
                  <div className={`p-4 bg-muted rounded-full ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="mt-8">
        <MembershipAnalytics analytics={analytics} />
      </div>
    </div>
  )
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold text-primary">{title}</h1>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  )
}
