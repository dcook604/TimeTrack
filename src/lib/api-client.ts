// API client utility for making requests to the backend
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          details: data.details
        }
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: 'Network error or server unavailable'
      }
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    })
  }

  async register(email: string, password: string, fullName: string, province: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, province })
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Timesheet methods
  async getTimesheets(params?: {
    page?: number
    limit?: number
    status?: string
    userId?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.userId) searchParams.set('userId', params.userId)

    const query = searchParams.toString()
    return this.request(`/timesheets${query ? `?${query}` : ''}`)
  }

  async getTimesheet(id: string) {
    return this.request(`/timesheets/${id}`)
  }

  async createTimesheet(data: {
    weekEnding: string
    entries: Array<{
      date: string
      hoursWorked: number
      description: string
    }>
  }) {
    return this.request('/timesheets', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateTimesheet(id: string, data: {
    entries: Array<{
      date: string
      hoursWorked: number
      description: string
    }>
  }) {
    return this.request(`/timesheets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteTimesheet(id: string) {
    return this.request(`/timesheets/${id}`, {
      method: 'DELETE'
    })
  }

  async approveTimesheet(id: string, action: 'APPROVE' | 'REJECT', comments?: string) {
    return this.request(`/timesheets/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        approverComments: comments
      })
    })
  }

  // Vacation request methods
  async getVacationRequests(params?: {
    page?: number
    limit?: number
    status?: string
    userId?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.userId) searchParams.set('userId', params.userId)

    const query = searchParams.toString()
    return this.request(`/vacation/requests${query ? `?${query}` : ''}`)
  }

  async getVacationRequest(id: string) {
    return this.request(`/vacation/requests/${id}`)
  }

  async createVacationRequest(data: {
    startDate: string
    endDate: string
    requestType: 'VACATION' | 'SICK' | 'PERSONAL' | 'BEREAVEMENT' | 'MATERNITY' | 'PATERNITY'
    reason?: string
  }) {
    return this.request('/vacation/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateVacationRequest(id: string, data: {
    startDate?: string
    endDate?: string
    requestType?: 'VACATION' | 'SICK' | 'PERSONAL' | 'BEREAVEMENT' | 'MATERNITY' | 'PATERNITY'
    reason?: string
  }) {
    return this.request(`/vacation/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteVacationRequest(id: string) {
    return this.request(`/vacation/requests/${id}`, {
      method: 'DELETE'
    })
  }

  async approveVacationRequest(id: string, action: 'APPROVE' | 'REJECT', comments?: string) {
    return this.request(`/vacation/requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        reviewComments: comments
      })
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()