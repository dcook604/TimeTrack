'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, User, LogOut, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { Loader2 } from 'lucide-react'

interface DashboardData {
  user: {
    id: string
    email: string
    role: string
    profile: {
      fullName: string
      province: string
      vacationBalance: number
    }
  }
  stats: {
    timesheets: {
      total: number
      totalHours: number
      pending: number
    }
    vacations: {
      total: number
      totalDays: number
      pending: number
    }
  }
  recent: {
    timesheets: any[]
    vacationRequests: any[]
  }
  manager?: {
    pendingTimesheetsForApproval: number
    pendingVacationsForApproval: number
    recentTimesheetsForApproval: any[]
    recentVacationsForApproval: any[]
  }
  admin?: {
    totalUsers: number
    totalTimesheets: number
    totalVacationRequests: number
    usersByRole: any[]
  }
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const { isAuthenticated, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated (only after loading is complete)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        } else {
          setError('Failed to load dashboard data')
        }
      } catch (err) {
        setError('An error occurred while loading dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload()
              }
            }}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Data</CardTitle>
            <CardDescription>Unable to load dashboard data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Timetracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {dashboardData.user.profile.fullName}
                </span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Timesheets</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.timesheets.total}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.stats.timesheets.totalHours} total hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Timesheets</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.timesheets.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacation Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.vacations.total}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.stats.vacations.totalDays} total days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacation Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.user.profile.vacationBalance}</div>
              <p className="text-xs text-muted-foreground">
                Days remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Manager/Admin Stats */}
        {dashboardData.manager && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Items requiring your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Timesheets</span>
                    <Badge variant="secondary">{dashboardData.manager.pendingTimesheetsForApproval}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Vacation Requests</span>
                    <Badge variant="secondary">{dashboardData.manager.pendingVacationsForApproval}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.manager.recentTimesheetsForApproval.slice(0, 3).map((timesheet: any) => (
                    <div key={timesheet.id} className="flex justify-between items-center text-sm">
                      <span>{timesheet.user.profile.fullName}</span>
                      <span className="text-muted-foreground">Timesheet</span>
                    </div>
                  ))}
                  {dashboardData.manager.recentVacationsForApproval.slice(0, 3).map((vacation: any) => (
                    <div key={vacation.id} className="flex justify-between items-center text-sm">
                      <span>{vacation.user.profile.fullName}</span>
                      <span className="text-muted-foreground">Vacation</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Stats */}
        {dashboardData.admin && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Administrative statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{dashboardData.admin.totalUsers}</div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{dashboardData.admin.totalTimesheets}</div>
                  <p className="text-sm text-muted-foreground">Total Timesheets</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{dashboardData.admin.totalVacationRequests}</div>
                  <p className="text-sm text-muted-foreground">Vacation Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Timesheets</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recent.timesheets.length > 0 ? (
                <div className="space-y-2">
                  {dashboardData.recent.timesheets.map((timesheet: any) => (
                    <div key={timesheet.id} className="flex justify-between items-center text-sm">
                      <span>Week of {new Date(timesheet.weekStarting).toLocaleDateString()}</span>
                      <Badge variant={timesheet.status === 'APPROVED' ? 'default' : 'secondary'}>
                        {timesheet.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent timesheets</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Vacation Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recent.vacationRequests.length > 0 ? (
                <div className="space-y-2">
                  {dashboardData.recent.vacationRequests.map((vacation: any) => (
                    <div key={vacation.id} className="flex justify-between items-center text-sm">
                      <span>{vacation.requestType}</span>
                      <Badge variant={vacation.status === 'APPROVED' ? 'default' : 'secondary'}>
                        {vacation.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent vacation requests</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 