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

export interface TimesheetEntry {
  workDate: string
  startTime?: string
  endTime?: string
  breakMinutes: number
  hoursWorked: number
  notes?: string
}

export interface CreateTimesheetData {
  weekStarting: string
  entries: TimesheetEntry[]
}

export interface Timesheet {
  id: string
  userId: string
  weekStarting: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  totalHours: number
  submittedAt?: string
  approvedAt?: string
  approvedById?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  entries: TimesheetEntry[]
  approvedBy?: {
    id: string
    email: string
    profile: {
      fullName: string
    }
  }
}

export interface VacationRequest {
  id: string
  userId: string
  startDate: string
  endDate: string
  requestType: 'VACATION' | 'SICK' | 'PERSONAL' | 'BEREAVEMENT' | 'MATERNITY' | 'PATERNITY'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason?: string
  daysRequested: number
  submittedAt: string
  reviewedAt?: string
  reviewedById?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    email: string
    profile: {
      fullName: string
      province: string
    }
  }
  reviewedBy?: {
    id: string
    email: string
    profile: {
      fullName: string
    }
  }
}

export interface CreateVacationRequestData {
  startDate: string
  endDate: string
  requestType: 'VACATION' | 'SICK' | 'PERSONAL' | 'BEREAVEMENT' | 'MATERNITY' | 'PATERNITY'
  reason?: string
}

export interface UpdateVacationRequestData {
  startDate?: string
  endDate?: string
  requestType?: 'VACATION' | 'SICK' | 'PERSONAL' | 'BEREAVEMENT' | 'MATERNITY' | 'PATERNITY'
  reason?: string
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
  }): Promise<ApiResponse<Timesheet[]>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.userId) searchParams.set('userId', params.userId)

    const query = searchParams.toString()
    return this.request<Timesheet[]>(`/timesheets${query ? `?${query}` : ''}`)
  }

  async getTimesheet(id: string): Promise<ApiResponse<Timesheet>> {
    return this.request<Timesheet>(`/timesheets/${id}`)
  }

  async createTimesheet(data: CreateTimesheetData): Promise<ApiResponse<Timesheet>> {
    return this.request<Timesheet>('/timesheets', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateTimesheet(id: string, data: {
    entries: TimesheetEntry[]
  }): Promise<ApiResponse<Timesheet>> {
    return this.request<Timesheet>(`/timesheets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteTimesheet(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/timesheets/${id}`, {
      method: 'DELETE'
    })
  }

  async submitTimesheet(id: string): Promise<ApiResponse<Timesheet>> {
    return this.request<Timesheet>(`/timesheets/${id}/submit`, {
      method: 'POST'
    })
  }

  async approveTimesheet(id: string, action: 'APPROVE' | 'REJECT', comments?: string): Promise<ApiResponse<Timesheet>> {
    return this.request<Timesheet>(`/timesheets/${id}/approve`, {
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
  }): Promise<ApiResponse<VacationRequest[]>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.userId) searchParams.set('userId', params.userId)

    const query = searchParams.toString()
    return this.request<VacationRequest[]>(`/vacation/requests${query ? `?${query}` : ''}`)
  }

  async getVacationRequest(id: string): Promise<ApiResponse<VacationRequest>> {
    return this.request<VacationRequest>(`/vacation/requests/${id}`)
  }

  async createVacationRequest(data: CreateVacationRequestData): Promise<ApiResponse<VacationRequest>> {
    return this.request<VacationRequest>('/vacation/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateVacationRequest(id: string, data: UpdateVacationRequestData): Promise<ApiResponse<VacationRequest>> {
    return this.request<VacationRequest>(`/vacation/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteVacationRequest(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/vacation/requests/${id}`, {
      method: 'DELETE'
    })
  }

  async approveVacationRequest(id: string, action: 'APPROVE' | 'REJECT', comments?: string): Promise<ApiResponse<VacationRequest>> {
    return this.request<VacationRequest>(`/vacation/requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        reviewComments: comments
      })
    })
  }

  // Dashboard methods
  async getDashboard(): Promise<ApiResponse<any>> {
    return this.request('/dashboard')
  }

  // Profile methods
  async getProfile(): Promise<ApiResponse<any>> {
    return this.request('/profile')
  }

  async updateProfile(data: {
    fullName?: string
    province?: string
    preferences?: {
      emailNotifications?: boolean
      timeFormat?: '12h' | '24h'
      theme?: 'light' | 'dark'
    }
  }): Promise<ApiResponse<any>> {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // User management methods (Admin only)
  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.request('/users')
  }

  async getUser(id: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`)
  }

  async createUser(data: {
    email: string
    password: string
    fullName: string
    province: string
    role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
    vacationBalance: number
  }): Promise<ApiResponse<any>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateUser(id: string, data: {
    email?: string
    fullName?: string
    province?: string
    role?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
    vacationBalance?: number
  }): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()