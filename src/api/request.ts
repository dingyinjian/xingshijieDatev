import axios from 'axios'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res?.code !== undefined && res.code !== 200) {
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res?.data !== undefined ? res.data : res
  },
  (error) => Promise.reject(error),
)

export default service
