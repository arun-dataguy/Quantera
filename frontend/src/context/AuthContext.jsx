import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)
const API = import.meta.env.VITE_API_URL || 'http://localhost:8003/api'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const getAccess  = () => localStorage.getItem('q_access')
  const getRefresh = () => localStorage.getItem('q_refresh')
  const saveTokens = (access, refresh) => {
    localStorage.setItem('q_access', access)
    if (refresh) localStorage.setItem('q_refresh', refresh)
  }
  const clearTokens = () => {
    localStorage.removeItem('q_access')
    localStorage.removeItem('q_refresh')
  }

  const apiFetch = useCallback(async (path, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    const token = getAccess()
    if (token) headers['Authorization'] = `Bearer ${token}`
    let res = await fetch(`${API}${path}`, { ...options, headers })
    if (res.status === 401) {
      const refreshed = await tryRefresh()
      if (refreshed) {
        headers['Authorization'] = `Bearer ${getAccess()}`
        res = await fetch(`${API}${path}`, { ...options, headers })
      } else {
        clearTokens()
        setUser(null)
        throw new Error('Session expired')
      }
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(err.detail || 'Request failed')
    }
    return res.json()
  }, [])

  const tryRefresh = async () => {
    const rt = getRefresh()
    if (!rt) return false
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      })
      if (!res.ok) return false
      const data = await res.json()
      saveTokens(data.access_token, data.refresh_token)
      return true
    } catch { return false }
  }

  useEffect(() => {
    const init = async () => {
      if (!getAccess() && !getRefresh()) { setLoading(false); return }
      try {
        const data = await apiFetch('/auth/me')
        setUser(data)
      } catch { clearTokens() }
      finally { setLoading(false) }
    }
    init()
  }, [apiFetch])

  const register = async (email, fullName, password) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, full_name: fullName, password }),
    })
    saveTokens(data.access_token, data.refresh_token)
    setUser(data.user)
    return data.user
  }

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    saveTokens(data.access_token, data.refresh_token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: getRefresh() }),
      })
    } catch {}
    clearTokens()
    setUser(null)
  }

  const loginWithGoogle = () => {
    window.location.href = `${API}/auth/google`
  }

  const handleOAuthCallback = (accessToken, refreshToken) => {
    saveTokens(accessToken, refreshToken)
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(r => r.json()).then(setUser).catch(() => {})
  }

  const isPro     = user?.plan === 'pro' || user?.plan === 'premium'
  const isPremium = user?.plan === 'premium'

  return (
    <AuthContext.Provider value={{
      user, loading, apiFetch,
      register, login, logout,
      loginWithGoogle, handleOAuthCallback,
      isPro, isPremium,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}