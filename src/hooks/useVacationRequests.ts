import { useState, useCallback } from 'react'
import { apiClient, ApiResponse, VacationRequest, CreateVacationRequestData, UpdateVacationRequestData } from '@/lib/api-client'

interface UseVacationRequestsReturn {
  // State
  vacationRequests: VacationRequest[]
  loading: boolean
  error: string | null
  
  // Actions
  createVacationRequest: (data: CreateVacationRequestData) => Promise<ApiResponse<VacationRequest>>
  updateVacationRequest: (id: string, data: UpdateVacationRequestData) => Promise<ApiResponse<VacationRequest>>
  deleteVacationRequest: (id: string) => Promise<ApiResponse<void>>
  approveVacationRequest: (id: string, action: 'APPROVE' | 'REJECT', comments?: string) => Promise<ApiResponse<VacationRequest>>
  getVacationRequests: (params?: {
    page?: number
    limit?: number
    status?: string
  }) => Promise<void>
  getVacationRequest: (id: string) => Promise<ApiResponse<VacationRequest>>
  clearError: () => void
}

export function useVacationRequests(): UseVacationRequestsReturn {
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getVacationRequests = useCallback(async (params?: {
    page?: number
    limit?: number
    status?: string
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.getVacationRequests(params)
      
      if (response.success && response.data) {
        setVacationRequests(response.data)
      } else {
        setError(response.error || 'Failed to fetch vacation requests')
      }
    } catch (err) {
      setError('Network error while fetching vacation requests')
      console.error('Error fetching vacation requests:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const getVacationRequest = useCallback(async (id: string): Promise<ApiResponse<VacationRequest>> => {
    try {
      const response = await apiClient.getVacationRequest(id)
      return response
    } catch (err) {
      const errorResponse: ApiResponse<VacationRequest> = {
        success: false,
        error: 'Network error while fetching vacation request'
      }
      console.error('Error fetching vacation request:', err)
      return errorResponse
    }
  }, [])

  const createVacationRequest = useCallback(async (data: CreateVacationRequestData): Promise<ApiResponse<VacationRequest>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.createVacationRequest(data)
      
      if (response.success && response.data) {
        // Add the new vacation request to the list
        setVacationRequests(prev => [response.data!, ...prev])
      } else {
        setError(response.error || 'Failed to create vacation request')
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<VacationRequest> = {
        success: false,
        error: 'Network error while creating vacation request'
      }
      setError(errorResponse.error!)
      console.error('Error creating vacation request:', err)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  const updateVacationRequest = useCallback(async (id: string, data: UpdateVacationRequestData): Promise<ApiResponse<VacationRequest>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.updateVacationRequest(id, data)
      
      if (response.success && response.data) {
        // Update the vacation request in the list
        setVacationRequests(prev => 
          prev.map(vr => vr.id === id ? response.data! : vr)
        )
      } else {
        setError(response.error || 'Failed to update vacation request')
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<VacationRequest> = {
        success: false,
        error: 'Network error while updating vacation request'
      }
      setError(errorResponse.error!)
      console.error('Error updating vacation request:', err)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteVacationRequest = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.deleteVacationRequest(id)
      
      if (response.success) {
        // Remove the vacation request from the list
        setVacationRequests(prev => prev.filter(vr => vr.id !== id))
      } else {
        setError(response.error || 'Failed to delete vacation request')
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<void> = {
        success: false,
        error: 'Network error while deleting vacation request'
      }
      setError(errorResponse.error!)
      console.error('Error deleting vacation request:', err)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  const approveVacationRequest = useCallback(async (id: string, action: 'APPROVE' | 'REJECT', comments?: string): Promise<ApiResponse<VacationRequest>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.approveVacationRequest(id, action, comments)
      
      if (response.success && response.data) {
        // Update the vacation request in the list
        setVacationRequests(prev => 
          prev.map(vr => vr.id === id ? response.data! : vr)
        )
      } else {
        setError(response.error || `Failed to ${action.toLowerCase()} vacation request`)
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<VacationRequest> = {
        success: false,
        error: `Network error while ${action.toLowerCase()}ing vacation request`
      }
      setError(errorResponse.error!)
      console.error(`Error ${action.toLowerCase()}ing vacation request:`, err)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    vacationRequests,
    loading,
    error,
    createVacationRequest,
    updateVacationRequest,
    deleteVacationRequest,
    approveVacationRequest,
    getVacationRequests,
    getVacationRequest,
    clearError
  }
} 