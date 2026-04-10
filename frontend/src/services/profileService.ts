const API_BASE = 'http://localhost:5000/api'

export interface UserProfile {
  id: string
  username: string
  email: string
  full_name?: string
  age?: number
  grade_level?: string
  school?: string
  parent_email?: string
  teacher_email?: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export const getProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const response = await fetch(`${API_BASE}/profiles/${userId}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return null
  }
}

export const updateProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const response = await fetch(`${API_BASE}/profiles/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to update profile:', error)
    return null
  }
}