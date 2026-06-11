import request from './request'
import type { DashboardData } from '@/types/dashboard'

export function fetchDashboard(): Promise<DashboardData> {
  return request.get('/datav/dashboard/')
}
