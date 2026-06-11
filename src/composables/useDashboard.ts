import { onMounted, ref } from 'vue'
import { fetchDashboard } from '@/api/dashboard'
import type { DashboardData } from '@/types/dashboard'

const defaultData = (): DashboardData => ({
  enterprise: [],
  workOutputRows: [],
  parkStat: [],
  modelUsage: { pie: [], centerName: '' },
  tokenUsage: { months: [], lastMonth: [], thisMonth: [] },
  operation: [],
  industry: [],
  orders: [],
  building: [],
  visitCount: 0,
})

export function useDashboard() {
  const data = ref<DashboardData>(defaultData())
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      data.value = await fetchDashboard()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '加载大屏数据失败'
      console.error('[datav]', error.value)
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { data, loading, error, reload: load }
}
