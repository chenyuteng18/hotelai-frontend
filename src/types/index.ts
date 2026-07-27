export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: UserInfo
}

export interface UserInfo {
  id: number
  username: string
  role: string
  hotelName: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface DashboardStats {
  occupancyRate: number
  avgDailyRate: number
  revPar: number
  totalRevenue: number
  occupancyTrend: TrendPoint[]
  revenueTrend: TrendPoint[]
}

export interface TrendPoint {
  date: string
  value: number
}

export interface Prediction {
  id: number
  date: string
  type: 'occupancy' | 'revenue' | 'price'
  predictedValue: number
  confidence: number
  lowerBound: number
  upperBound: number
  factors: PredictionFactor[]
}

export interface PredictionFactor {
  name: string
  impact: number
  direction: 'positive' | 'negative'
}

export interface Suggestion {
  id: number
  title: string
  category: 'pricing' | 'inventory' | 'marketing'
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'approved' | 'rejected'
  expectedImpact: number
  safetyMargin: number
  currentProgress: number
  description: string
  createdAt: string
}

export interface Approval {
  id: number
  title: string
  type: 'price_change' | 'inventory_release' | 'promotion'
  status: 'pending' | 'approved' | 'rejected'
  requester: string
  amount: number
  reason: string
  createdAt: string
  decidedAt?: string
  decidedBy?: string
}

export interface Room {
  id: number
  number: string
  floor: number
  typeId: number
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  currentPrice: number
  suggestedPrice: number
}

export interface RoomType {
  id: number
  name: string
  basePrice: number
  capacity: number
  totalRooms: number
  availableRooms: number
  amenities: string[]
}

export interface Competitor {
  id: number
  name: string
  avgPrice: number
  occupancyRate: number
  rating: number
  priceHistory: TrendPoint[]
}

export interface KanbanColumn {
  id: string
  title: string
  items: KanbanCard[]
}

export interface KanbanCard {
  id: number
  title: string
  metric: string
  value: number
  change: number
  status: 'up' | 'down' | 'stable'
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
