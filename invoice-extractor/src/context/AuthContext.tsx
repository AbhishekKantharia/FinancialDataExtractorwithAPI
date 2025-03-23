"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { api } from "../services/api"
import axios from "axios"

interface User {
  id: number
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const response = await api.get("/api/profile/")
      setUser(response.data)
    } catch (error) {
      console.error("Auth check failed:", error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      const response = await api.post("/api/token/", { username, password }, { withCredentials: true })

      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`
      await checkAuthStatus()
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string) => {
    setLoading(true)
    try {
      await api.post("/api/register/", { username, email, password })
      await login(username, password)
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const refreshAccessToken = async () => {
    try {
      const response = await api.post("/api/token/refresh/", {}, { withCredentials: true })
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`
    } catch (error) {
      console.error("Token refresh failed:", error)
      logout()
    }
  }

  const logout = async () => {
    try {
      await api.post("/api/logout/", {}, { withCredentials: true })
    } catch (error) {
      console.error("Logout error:", error)
    }
    setUser(null)
    delete api.defaults.headers.common["Authorization"]
  }

  useEffect(() => {
    const interval = setInterval(refreshAccessToken, 15 * 60 * 1000) // Refresh token every 15 minutes
    return () => clearInterval(interval)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

