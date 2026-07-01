export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface SelectOption<T extends string = string> {
  label: string
  value: T
  description?: string
  disabled?: boolean
}

export type SortDirection = 'asc' | 'desc'

export interface SortConfig<T extends string = string> {
  field: T
  direction: SortDirection
}

export interface FilterConfig {
  search?: string
  tags?: string[]
  dateFrom?: string
  dateTo?: string
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface WithId {
  id: string
}

export interface WithTimestamps {
  created_at: string
  updated_at: string
}

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export type Maybe<T> = T | null | undefined
