import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/* ================= TYPES ================= */

export interface User {
  id: number
  username: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean

  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (
    username: string,
    email: string,
    password: string,
    role: string
  ) => Promise<{ error?: string }>

  signOut: () => void
  setUser: React.Dispatch<React.SetStateAction<User | null>>

  isAdmin: boolean
  isTeacher: boolean
  isParent: boolean
}

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /* ========== Load User on Refresh ========== */

  useEffect(() => {
    const storedUser = localStorage.getItem('user')

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    setLoading(false)
  }, [])

  /* ========== Role Helpers ========== */

  const isAdmin = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'
  const isParent = user?.role === 'parent'

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  /* ========== SIGN IN ========== */

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { error: data.message || 'Login failed' }
      }

      // Save user + token
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)

      return {}
    } catch (error) {
      return { error: 'Something went wrong during login' }
    }
  }

  /* ========== SIGN UP ========== */

  const signUp = async (
    username: string,
    email: string,
    password: string,
    role: string
  ) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { error: data.message || 'Registration failed' }
      }

      return {}
    } catch (error) {
      return { error: 'Something went wrong during registration' }
    }
  }

  /* ========== SIGN OUT ========== */

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  /* ========== PROVIDER VALUE ========== */

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        setUser,
        isAdmin,
        isTeacher,
        isParent,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/* ================= HOOK ================= */

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
