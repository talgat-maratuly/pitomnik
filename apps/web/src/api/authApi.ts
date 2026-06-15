import { apiRequest } from './client'
import type { AuthUser } from '@/lib/auth'
import { setAuth, clearAuth } from '@/lib/auth'

export async function login(username: string, password: string) {
  const data = await apiRequest<{ accessToken: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setAuth(data.accessToken, data.user)
  return data.user
}

export async function fetchMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me')
}

export function logout() {
  clearAuth()
}
