import axios from "axios"

export const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // Enables sending cookies (secure token storage)
  headers: {
    "Content-Type": "application/json",
  },
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token)
    } else {
      prom.reject(error)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      isRefreshing = true

      try {
        const response = await axios.post("http://localhost:8000/api/token/refresh/", {}, { withCredentials: true })
        const { access } = response.data

        api.defaults.headers.common["Authorization"] = `Bearer ${access}`
        processQueue(null, access)

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)

        // Logout the user
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api

