export interface EnterpriseItem {
  color: string
  name: string
  value: number
  percentage: number
}

export interface WorkOutputStat {
  value: string
  unit: string
  label: string
}

export type LeftItem2Stat = WorkOutputStat

export interface RightItem2Stat {
  value: string
  labelLine1: string
  labelLine2: string
}

export interface ParkStatItem {
  title: string
  value: string
}

export interface ModelPieItem {
  name: string
  value: number
  color: string
}

export type OperationItem = RightItem2Stat

export interface IndustryItem {
  value: string
  unit: string
  label: string
}

export interface OrderItem {
  orderType: string
  issueCompany: string
  receiveCompany: string
  receiveTime: string
  completeTime: string
}

export interface BuildingItem {
  buildingName: string
  buildingLocation: string
  companyNumber: number
}

export interface DashboardData {
  enterprise: EnterpriseItem[]
  workOutputRows: WorkOutputStat[][]
  parkStat: ParkStatItem[]
  modelUsage: {
    pie: ModelPieItem[]
    centerName: string
  }
  tokenUsage: {
    months: string[]
    lastMonth: number[]
    thisMonth: number[]
  }
  operation: OperationItem[]
  industry: IndustryItem[]
  orders: OrderItem[]
  building: BuildingItem[]
  visitCount: number
}
