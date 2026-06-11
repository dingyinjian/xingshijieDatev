import axios from 'axios'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchTodayPeopleCount, testHikvisionConnection } from '@/api/hikvision'
import type { HikvisionPeopleCount } from '@/types/hikvision'

const enabled = import.meta.env.VITE_HIKVISION_ENABLED === 'true'
const pollInterval = Number(import.meta.env.VITE_HIKVISION_POLL_INTERVAL || 10000)

const defaultCount = (): HikvisionPeopleCount => ({
  enter: 0,
  exit: 0,
  visit: 0,
  updatedAt: '',
})

export function useHikvisionVisitor() {
  const count = ref<HikvisionPeopleCount>(defaultCount())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const connected = ref(false)

  let timer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    if (!enabled) return

    loading.value = true
    error.value = null
    try {
      count.value = await fetchTodayPeopleCount()
      connected.value = true
    } catch (e: unknown) {
      connected.value = false
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { error?: string } | string | undefined
        const status = e.response?.status
        if (status === 401) {
          error.value = '摄像头认证失败，请检查 .env 中的用户名和密码'
        } else {
          error.value =
            (typeof data === 'object' && data?.error) ||
            (typeof data === 'string' ? data : null) ||
            e.message ||
            '摄像头请求失败'
        }
      } else {
        error.value = e instanceof Error ? e.message : '摄像头请求失败'
      }
      console.error('[hikvision]', error.value)
    } finally {
      loading.value = false
    }
  }

  async function checkConnection() {
    if (!enabled) return false
    try {
      await testHikvisionConnection()
      connected.value = true
      return true
    } catch {
      connected.value = false
      return false
    }
  }

  function startPolling() {
    if (!enabled) return
    stopPolling()
    void refresh()
    timer = setInterval(() => void refresh(), pollInterval)
  }

  function stopPolling() {
    if (timer != null) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(() => {
    if (enabled) startPolling()
  })

  onBeforeUnmount(stopPolling)

  return {
    enabled,
    count,
    loading,
    error,
    connected,
    refresh,
    checkConnection,
  }
}
