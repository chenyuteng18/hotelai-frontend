import axios from 'axios'
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  DashboardStats,
  Prediction,
  Suggestion,
  Approval,
  Room,
  RoomType,
  Competitor,
  KanbanColumn,
  PaginatedResponse,
} from '../types'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://118.190.207.62:8080/api',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login(data: LoginRequest) {
    return http.post<ApiResponse<LoginResponse>>('/auth/login', data)
  },
  changePassword(data: ChangePasswordRequest) {
    return http.put<ApiResponse<null>>('/auth/password', data)
  },
  getProfile() {
    return http.get<ApiResponse<{ username: string; role: string; hotelName: string }>>('/auth/profile')
  },
}

export const dashboardApi = {
  getStats() {
    return http.get<ApiResponse<DashboardStats>>('/dashboard/stats')
  },
}

export const kanbanApi = {
  getColumns() {
    return http.get<ApiResponse<KanbanColumn[]>>('/kanban/columns')
  },
}

export const predictionApi = {
  getOccupancy(params?: { startDate?: string; endDate?: string }) {
    return http.get<ApiResponse<Prediction[]>>('/predictions/occupancy', { params })
  },
  getRevenue(params?: { startDate?: string; endDate?: string }) {
    return http.get<ApiResponse<Prediction[]>>('/predictions/revenue', { params })
  },
  getPrice(params?: { startDate?: string; endDate?: string }) {
    return http.get<ApiResponse<Prediction[]>>('/predictions/price', { params })
  },
}

export const suggestionApi = {
  getList(params?: { page?: number; pageSize?: number; status?: string }) {
    return http.get<ApiResponse<PaginatedResponse<Suggestion>>>('/suggestions', { params })
  },
  getDetail(id: number) {
    return http.get<ApiResponse<Suggestion>>(`/suggestions/${id}`)
  },
}

export const approvalApi = {
  getList(params?: { page?: number; pageSize?: number; status?: string }) {
    return http.get<ApiResponse<PaginatedResponse<Approval>>>('/approvals', { params })
  },
  getDetail(id: number) {
    return http.get<ApiResponse<Approval>>(`/approvals/${id}`)
  },
  approve(id: number) {
    return http.put<ApiResponse<null>>(`/approvals/${id}/approve`)
  },
  reject(id: number, reason: string) {
    return http.put<ApiResponse<null>>(`/approvals/${id}/reject`, { reason })
  },
}

export const roomApi = {
  getList(params?: { page?: number; pageSize?: number; status?: string; floor?: number }) {
    return http.get<ApiResponse<PaginatedResponse<Room>>>('/rooms', { params })
  },
  getTypes() {
    return http.get<ApiResponse<RoomType[]>>('/rooms/types')
  },
}

export const competitorApi = {
  getList() {
    return http.get<ApiResponse<Competitor[]>>('/competitors')
  },
}
