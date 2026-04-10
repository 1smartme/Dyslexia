import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import GamePage from './pages/GamePage'
import AdminDashboard from './pages/AdminDashboard'
import ProfilePage from './pages/ProfilePage'
import ParentDashboard from './pages/ParentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import UserProfile from './pages/UserProfile'
import ThemeToggle from './components/ui/ThemeToggle'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
        <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-gray-900">
          <ThemeToggle />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/games" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/game/:gameType" 
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/parent" 
              element={
                <ProtectedRoute requireParent>
                  <ParentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher" 
              element={
                <ProtectedRoute requireTeacher>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/:userId" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              duration: 4000,
              style: {
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
              }
            }}
          />
        </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App