import { useState, useCallback } from 'react'
import { apiClient, ApiResponse } from '@/lib/api-client'

interface UserProfile {
  id: string
  fullName: string
  province: string
  vacationBalance: number
  accruedDays: number
  usedDays: number
  preferences: {
    emailNotifications: boolean
    timeFormat: '12h' | '24h'
    theme: 'light' | 'dark'
  }
}

interface UserData {
  id: string
  email: string
  role: string
  profile: UserProfile
}

interface UpdateProfileData {
  fullName?: string
  province?: string
  preferences?: {
    emailNotifications?: boolean
    timeFormat?: '12h' | '24h'
    theme?: 'light' | 'dark'
  }
}

interface UseProfileReturn {
  // State
  userData: UserData | null
  loading: boolean
  error: string | null
  
  // Actions
  getProfile: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<ApiResponse<UserData>>
  clearError: () => void
}

export function useProfile(): UseProfileReturn {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.getProfile()
      
      if (response.success && response.data) {
        setUserData(response.data)
      } else {
        setError(response.error || 'Failed to fetch profile')
      }
    } catch (err) {
      setError('Network error while fetching profile')
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<ApiResponse<UserData>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.updateProfile(data)
      
      if (response.success && response.data) {
        setUserData(response.data)
      } else {
        setError(response.error || 'Failed to update profile')
      }
      
      return response
    } catch (err) {
      const errorResponse: ApiResponse<UserData> = {
        success: false,
        error: 'Network error while updating profile'
      }
      setError(errorResponse.error!)
      console.error('Error updating profile:', err)
      return errorResponse
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    userData,
    loading,
    error,
    getProfile,
    updateProfile,
    clearError
  }
} 