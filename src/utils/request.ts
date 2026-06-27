import axios, { type AxiosRequestConfig } from 'axios'

import { requestEventBus } from '@/event-bus'

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10_000,
})

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers.Authorization = localStorage.getItem('token') || ''
    requestEventBus.emit({ type: 'request' })
    return config
  },
  (error) => {
    requestEventBus.emit({ type: 'requestError', error })
    return Promise.reject(error)
  },
)

axiosInstance.interceptors.response.use(
  (response) => {
    requestEventBus.emit({ type: 'response', data: response.data })
    return response
  },
  (error) => {
    const data = error.response?.data
    const code = data?.code
    requestEventBus.emit({ type: 'responseError', error, code })
    if (error.response?.status === 400 && data?.message === '未登录') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/sign-in'
    }
    return Promise.reject(error)
  },
)

export async function request<T = unknown>(config: AxiosRequestConfig) {
  const response = await axiosInstance.request<ResponseBody<T>>(config)
  return response.data
}

export default request
