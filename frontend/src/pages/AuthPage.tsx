import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brain, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/* ================= SCHEMAS ================= */

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signUpSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'parent', 'teacher']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignInForm = z.infer<typeof signInSchema>
type SignUpForm = z.infer<typeof signUpSchema>

/* ================= COMPONENT ================= */

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  /* ============ Redirect after login ============ */

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  /* ============ Forms ============ */

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  })

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: 'student' }
  })

  /* ============ SIGN IN ============ */

  const handleSignIn = async (data: SignInForm) => {
    setLoading(true)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        alert(result.message || 'Login failed')
        setLoading(false)
        return
      }

      // Save user in context
      const user = result.user || { email: data.email }
      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', result.token)
      navigate('/dashboard')

    } catch (error) {
      console.error(error)
      alert('Something went wrong')
    }

    setLoading(false)
  }

  /* ============ SIGN UP ============ */

  const handleSignUp = async (data: SignUpForm) => {
    setLoading(true)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        alert(result.message || 'Registration failed')
        setLoading(false)
        return
      }

      alert('Account created successfully!')
      setMode('signin')

    } catch (error) {
      console.error(error)
      alert('Something went wrong')
    }

    setLoading(false)
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4 transition-colors duration-300">
      <div className="max-w-md w-full card p-8 rounded-xl">

        <div className="text-center mb-6">
          <Brain className="mx-auto w-12 h-12 text-blue-600" />
          <h2 className="text-2xl font-bold mt-4 text-slate-900 dark:text-slate-100">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
        </div>

        {mode === 'signin' && (
          <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">

            <div>
              <label className="text-slate-700 dark:text-slate-200">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  {...signInForm.register('email')}
                  type="email"
                  className="w-full pl-10 p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                />
              </div>
              <p className="text-red-500 text-sm">
                {signInForm.formState.errors.email?.message}
              </p>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-200">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  {...signInForm.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 dark:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-red-500 text-sm">
                {signInForm.formState.errors.password?.message}
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </button>

            <p className="text-center text-sm mt-4 text-slate-600 dark:text-slate-300">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-blue-600"
              >
                Register
              </button>
            </p>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">

            <div>
              <label className="text-slate-700 dark:text-slate-200">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  {...signUpForm.register('username')}
                  type="text"
                  className="w-full pl-10 p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-200">Email</label>
              <input
                {...signUpForm.register('email')}
                type="email"
                className="w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-200">Password</label>
              <input
                {...signUpForm.register('password')}
                type="password"
                className="w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-200">Confirm Password</label>
              <input
                {...signUpForm.register('confirmPassword')}
                type="password"
                className="w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
              />
              <p className="text-red-500 text-sm">
                {signUpForm.formState.errors.confirmPassword?.message}
              </p>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-200">Role</label>
              <select
                {...signUpForm.register('role')}
                className="w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
              >
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
            </button>

            <p className="text-center text-sm mt-4 text-slate-600 dark:text-slate-300">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-blue-600"
              >
                Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default AuthPage
