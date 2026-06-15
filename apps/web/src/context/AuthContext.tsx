import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchMe, logout as apiLogout } from '@/api/authApi'
import type { AuthUser, UserRole } from '@/lib/auth'
import { getStoredUser, getToken } from '@/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [loading, setLoading] = useState(!!getToken())

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await fetchMe()
      setUser(me)
    } catch {
      apiLogout()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      logout: () => {
        apiLogout()
        setUser(null)
      },
      hasRole: (...roles) => !!user && roles.includes(user.role),
      refresh,
    }),
    [user, loading, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
