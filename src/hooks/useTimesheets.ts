import { useState, useCallback } from 'react'
import { apiClient, CreateTimesheetData, Timesheet, ApiResponse } from '@/lib/api-client'

interface UseTimesheetsReturn {
  // State
  timesheets: Timesheet[]
  loading: boolean
  error: string | null
  
  // Actions
  createTimesheet: (data: CreateTimesheetData) => Promise<ApiResponse<Timesheet>>
  submitTimesheet: (id: string) => Promise<ApiResponse<Timesheet>>
  approveTimesheet: (id: string, action: 'APPROVE' | 'REJECT', comments?: string) => Promise<ApiResponse<Timesheet>>
  getTimesheets: (params?: {
    page?: number
    limit?: number
    status?: string
  }) => Promise<void>
  clearError: () => void
}

export function useTimesheets(): UseTimesheetsReturn {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getTimesheets = useCallback(async (params?: {
    page?: number
    limit?: number
    status?: string
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.getTimesheets(params)
      
      if (response.success && response.data) {
        setTimesheets(response.data)
      } else {
        setError(response.error || 'Failed to fetch timesheets')
      }
    } catch (err) {
      setError('Network error while fetching timesheets')
      console.error('Error fetching timesheets:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createTimesheet = useCallback(async (data: CreateTimesheetData): Promise<ApiResponse<Timesheet>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.createTimesheet(data)
      
      if (response.success && response.data) {
        // Add the new timesheet to the list
        setTimesheets(prev => [response.data!, ...prev])
      } else {
        setError(response.error || 'Failed to create timesheet')
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<Timesheet> = {
        success: false,
        error: 'Network error while creating timesheet'
      }
      setError(errorResponse.error!)
      console.error('Error creating timesheet:', err)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  const submitTimesheet = useCallback(async (id: string): Promise<ApiResponse<Timesheet>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.submitTimesheet(id)
      
      if (response.success && response.data) {
        // Update the timesheet in the list
        setTimesheets(prev => 
          prev.map(ts => ts.id === id ? response.data! : ts)
        )
      } else {
        setError(response.error || 'Failed to submit timesheet')
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<Timesheet> = {
        success: false,
        error: 'Network error while submitting timesheet'
      }
      setError(errorResponse.error!)
      console.error('Error submitting timesheet:', err)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  const approveTimesheet = useCallback(async (id: string, action: 'APPROVE' | 'REJECT', comments?: string): Promise<ApiResponse<Timesheet>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.approveTimesheet(id, action, comments)
      
      if (response.success && response.data) {
        // Update the timesheet in the list
        setTimesheets(prev => 
          prev.map(ts => ts.id === id ? response.data! : ts)
        )
      } else {
        setError(response.error || 'Failed to approve timesheet')
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<Timesheet> = {
        success: false,
        error: 'Network error while approving timesheet'
      }
      setError(errorResponse.error!)
      console.error('Error approving timesheet:', err)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    timesheets,
    loading,
    error,
    createTimesheet,
    submitTimesheet,
    approveTimesheet,
    getTimesheets,
    clearError
  }
} 