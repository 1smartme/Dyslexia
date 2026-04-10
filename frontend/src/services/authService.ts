const API_BASE = 'http://localhost:5000/api'

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    role: string
  }
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Login failed')
  }
  
  return await response.json()
}

export const register = async (email: string, password: string, username: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Registration failed')
  }
  
  return await response.json()
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken')
}

export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token)
}

export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken')
}