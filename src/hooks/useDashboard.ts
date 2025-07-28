import { useState, useCallback } from 'react'
import { apiClient, ApiResponse } from '@/lib/api-client'

interface DashboardData {
  user: {
    id: string
    email: string
    role: string
    profile: {
      id: string
      fullName: string
      province: string
      vacationBalance: number
      accruedDays: number
      usedDays: number
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

interface UseDashboardReturn {
  // State
  dashboardData: DashboardData | null
  loading: boolean
  error: string | null
  
  // Actions
  getDashboard: () => Promise<void>
  clearError: () => void
}

export function useDashboard(): UseDashboardReturn {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.getDashboard()
      
      if (response.success && response.data) {
        setDashboardData(response.data)
      } else {
        setError(response.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      setError('Network error while fetching dashboard data')
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    dashboardData,
    loading,
    error,
    getDashboard,
    clearError
  }
} 