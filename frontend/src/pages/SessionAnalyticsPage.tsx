import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import SessionMetricsDisplay from '../../components/analytics/SessionMetricsDisplay'
import { useNavigate } from 'react-router-dom'

const SessionAnalyticsPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [gameSessionId] = useState<string | undefined>(
    new URLSearchParams(location.search).get('sessionId') || undefined
  )

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <SessionMetricsDisplay userId={user.id} gameSessionId={gameSessionId} showRefresh={true} />
    </div>
  )
}

export default SessionAnalyticsPage
