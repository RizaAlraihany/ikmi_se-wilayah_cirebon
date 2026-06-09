'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Users, UserCheck, Shield, GraduationCap, TrendingUp } from 'lucide-react'

type MembershipAnalyticsData = {
  kpi: {
    totalUsers: number
    activeMembers: number
    managementMembers: number
    alumniMembers: number
    conversionRate: number
  }
  statusDistribution: Array<{ name: string; value: number }>
}

export function MembershipAnalytics({ analytics }: { analytics: MembershipAnalyticsData }) {
  const { kpi, statusDistribution } = analytics
  const totalStatus = statusDistribution.reduce((acc, curr) => acc + curr.value, 0) || 1

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <h3 className="text-2xl font-bold">{kpi.totalUsers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktif</p>
              <h3 className="text-2xl font-bold">{kpi.activeMembers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pengurus</p>
              <h3 className="text-2xl font-bold">{kpi.managementMembers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-full">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alumni</p>
              <h3 className="text-2xl font-bold">{kpi.alumniMembers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-full">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Konversi Pendaftar</p>
              <h3 className="text-2xl font-bold">{kpi.conversionRate.toFixed(1)}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Status Kaderisasi (Registration)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusDistribution.map((status) => {
                const percent = (status.value / totalStatus) * 100
                return (
                  <div key={status.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{status.name}</span>
                      <span className="text-muted-foreground">{status.value} ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${status.name === 'Approved' ? 'bg-green-500' : status.name === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
