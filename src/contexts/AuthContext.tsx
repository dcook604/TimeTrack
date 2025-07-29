'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '@/lib/api-client'

export interface User {
  id: string
  email: string
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
  profile: {
    fullName: string
    province: string
    vacationBalance: number
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (email: string, password: string, fullName: string, province: string) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
  hasRole: (requiredRole: 'EMPLOYEE' | 'MANAGER' | 'ADMIN') => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Role hierarchy for permission checking
  const roleHierarchy = {
    EMPLOYEE: 0,
    MANAGER: 1,
    ADMIN: 2
  }

  const hasRole = (requiredRole: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'): boolean => {
    if (!user) return false
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
  }

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser()
      if (response.success && response.data) {
        setUser((response.data as any).user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      if (response.success && response.data) {
        setUser((response.data as any).user)
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const register = async (email: string, password: string, fullName: string, province: string) => {
    try {
      const response = await apiClient.register(email, password, fullName, province)
      if (response.success && response.data) {
        setUser((response.data as any).user)
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Check authentication status on mount (only once)
  useEffect(() => {
    const checkAuth = async () => {
      if (!authChecked) {
        setLoading(true)
        try {
          await refreshUser()
        } catch (error) {
          console.error('Initial auth check failed:', error)
          setUser(null)
        } finally {
          setLoading(false)
          setAuthChecked(true)
        }
      }
    }

    checkAuth()
  }, [authChecked])

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    refreshUser,
    isAuthenticated: !!user,
    hasRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, hasRole } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    }

    if (!user) {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return null
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}