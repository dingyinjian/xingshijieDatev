/** 海康客流统计查询结果 */
export interface HikvisionPeopleCount {
  /** 进入人数 */
  enter: number
  /** 离开人数 */
  exit: number
  /** 参观人数（进入 - 离开，不小于 0） */
  visit: number
  /** 数据更新时间 */
  updatedAt: string
}

export interface HikvisionVisitorState {
  count: HikvisionPeopleCount
  loading: boolean
  error: string | null
  connected: boolean
}
