'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DebugPage() {
  const { user, loading, isAuthenticated, authChecked } = useAuth()
  const [authTest, setAuthTest] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    // Get cookies
    setCookies(document.cookie)
  }, [])

  const testAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      setAuthTest(data)
    } catch (error) {
      setAuthTest({ error: error.message })
    }
  }

  const clearAllData = () => {
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reload the page
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Debug Information</h1>
          <p className="mt-2 text-gray-600">Authentication and system diagnostics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication State */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication State</CardTitle>
              <CardDescription>Current authentication status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Loading:</span>
                <Badge variant={loading ? "default" : "secondary"}>
                  {loading ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Authenticated:</span>
                <Badge variant={isAuthenticated ? "default" : "destructive"}>
                  {isAuthenticated ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>User:</span>
                <span className="text-sm text-gray-600">
                  {user ? user.email : "None"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Role:</span>
                <Badge variant="outline">
                  {user?.role || "None"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Environment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Environment</CardTitle>
              <CardDescription>Application environment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>NODE_ENV:</span>
                <Badge variant="outline">
                  {process.env.NODE_ENV || "Not set"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Base URL:</span>
                <span className="text-sm text-gray-600">
                  {typeof window !== 'undefined' ? window.location.origin : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Current Path:</span>
                <span className="text-sm text-gray-600">
                  {typeof window !== 'undefined' ? window.location.pathname : "Unknown"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies</CardTitle>
              <CardDescription>Current browser cookies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono break-all">
                {cookies || "No cookies found"}
              </div>
            </CardContent>
          </Card>

          {/* API Test */}
          <Card>
            <CardHeader>
              <CardTitle>API Test</CardTitle>
              <CardDescription>Test authentication endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testAuth} className="w-full">
                Test /api/auth/me
              </Button>
              {authTest && (
                <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                  <pre>{JSON.stringify(authTest, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Debug actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={clearAllData} variant="destructive">
                Clear All Data & Reload
              </Button>
              <Button onClick={() => window.location.href = '/login'}>
                Go to Login
              </Button>
              <Button onClick={() => window.location.href = '/'}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}