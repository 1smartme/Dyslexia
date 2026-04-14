import React, { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { saveDyslexiaSessionData, sendDyslexiaSessionData } from '../../services/dyslexiaSessionService'
import { useWebGazerTracking } from '../../hooks/useWebGazerTracking'

export interface SessionMetrics {
  timestamp: string
  readingSpeedWPM: number
  fixationCount: number
  accuracy: number
  regressionCount: number
  fixationMeanDuration: number
  scoreTotal: number
}

interface CameraTrackerProps {
  userId: string
  gameScore?: number
  gameName?: string
  difficulty?: string
  totalQuestions?: number
  isGamePage?: boolean
  errors?: Array<{ expected: string; actual: string }>
  onMetricsUpdate?: (metrics: SessionMetrics) => void
  onSessionSaved?: (response: unknown) => void
}

const CameraTracker: React.FC<CameraTrackerProps> = ({
  userId,
  gameScore = 0,
  gameName = 'game',
  difficulty = 'medium',
  totalQuestions = 1,
  isGamePage = false,
  errors = [],
  onMetricsUpdate,
  onSessionSaved,
}) => {
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const latestGameScoreRef = useRef<number>(gameScore)
  const [sessionId, setSessionId] = useState<string>('')
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<'Idle' | 'Recording' | 'Completed'>('Idle')
  const isRecordingRef = useRef(false)
  const trackingStartedRef = useRef(false)
  const saveInFlightRef = useRef(false)
  const hasSavedRef = useRef(false)
  const sessionStartedAtRef = useRef<string>('')
  const [cameraActive, setCameraActive] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, scale: 1 })
  const { isReady, error: gazeError, gazeStream, fixationStats, regressions, startTracking, stopTracking } = useWebGazerTracking()
  const fixationStatsRef = useRef(fixationStats)
  const regressionsRef = useRef(regressions)
  const [metrics, setMetrics] = useState<SessionMetrics>({
    timestamp: '',
    readingSpeedWPM: 0,
    fixationCount: 0,
    accuracy: 0,
    regressionCount: 0,
    fixationMeanDuration: 0,
    scoreTotal: gameScore,
  })

  useEffect(() => {
    isRecordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => {
    if (!isGamePage) return
    generateSessionId()
    hasSavedRef.current = false
    setStatus('Idle')
    console.log('Camera mounted on game page')
    startCamera()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stopTracking()
      void saveSessionData()
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
      stopCamera()
      console.log('Camera stopped on unmount')
    }
  }, [isGamePage])

  useEffect(() => {
    latestGameScoreRef.current = gameScore
    setMetrics((prev) => ({ ...prev, scoreTotal: gameScore }))
  }, [gameScore])

  useEffect(() => {
    fixationStatsRef.current = fixationStats
    regressionsRef.current = regressions
    if (isRecordingRef.current) {
      updateLiveMetrics(sessionDuration)
    }
  }, [fixationStats, regressions, sessionDuration])

  const updateLiveMetrics = (seconds: number) => {
    const scoreValue = latestGameScoreRef.current
    const elapsedMinutes = Math.max(0.1, seconds / 60)
    const readingSpeedWPM = Number((scoreValue / elapsedMinutes).toFixed(1))
    const accuracy = totalQuestions > 0 ? Math.min(1, Math.max(0, scoreValue / totalQuestions)) : 0
    const currentFixation = fixationStatsRef.current
    const currentRegressions = regressionsRef.current
    setMetrics((prev) => ({
      ...prev,
      readingSpeedWPM,
      fixationCount: currentFixation.count,
      regressionCount: currentRegressions.count,
      fixationMeanDuration: Math.round(currentFixation.mean_duration),
      accuracy,
      scoreTotal: scoreValue,
    }))
  }

  useEffect(() => {
    if (cameraActive && isReady && !trackingStartedRef.current) {
      void startSession()
    }
  }, [cameraActive, isReady])

  const generateSessionId = () => {
    const id = `session_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    setSessionId(id)
    return id
  }

  const startCamera = async () => {
    if (!isGamePage) return
    if (streamRef.current) {
      if (videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current;
      }
      setCameraActive(true)
      return
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      alert('Unable to access camera. Please grant camera permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setCameraActive(false)
    }
  }

  const startSession = async () => {
    if (!isGamePage) return
    if (trackingStartedRef.current) return
    if (!cameraActive) {
      await startCamera()
    }
    if (!isReady) {
      console.warn('WebGazer is still loading; session will start once ready.')
      return
    }
    await startTracking()
    trackingStartedRef.current = true
    setIsRecording(true)
    setStatus('Recording')
    setSessionDuration(0)
    const startedAt = new Date().toISOString()
    sessionStartedAtRef.current = startedAt
    const newMetrics = { ...metrics, timestamp: startedAt, scoreTotal: latestGameScoreRef.current }
    setMetrics(newMetrics)
    onMetricsUpdate?.(newMetrics)
    updateLiveMetrics(0)
    console.log('Session Started')
    console.log('Tracking Started')

    timerRef.current = setInterval(() => {
      setSessionDuration((prev) => {
        const next = prev + 1
        updateLiveMetrics(next)
        return next
      })
    }, 1000)
  }

  const saveSessionData = async () => {
    if (saveInFlightRef.current || hasSavedRef.current) return
    saveInFlightRef.current = true
    hasSavedRef.current = true

    const resolvedSessionId = sessionId || generateSessionId()
    const sessionTimestamp = sessionStartedAtRef.current || metrics.timestamp || new Date().toISOString()

    try {
      if (gazeStream.length > 0) {
        console.log('Sending Data')
        const payload = {
          session_id: resolvedSessionId,
          user_id: userId,
          game_type: gameName,
          difficulty,
          score: latestGameScoreRef.current,
          total: totalQuestions,
          errors,
          gaze_stream: gazeStream,
          fixation_stats: {
            mean_duration: fixationStatsRef.current.mean_duration,
            count: fixationStatsRef.current.count,
          },
          regressions: {
            count: regressionsRef.current.count,
          },
          reading_speed_wpm: metrics.readingSpeedWPM,
          timestamp: sessionTimestamp,
        }
        const dbResponse = await saveDyslexiaSessionData(payload)
        let mlResponse: unknown = null
        try {
          mlResponse = await sendDyslexiaSessionData(payload)
        } catch (mlErr) {
          // Session is already persisted in PostgreSQL, so ML forwarding should not block completion.
          console.warn('ML analysis failed, but session was saved to database:', mlErr)
        }
        onSessionSaved?.({ db: dbResponse, ml: mlResponse })
        console.log('Session Saved')
      } else if (isRecordingRef.current) {
        console.warn('No gaze points captured; skipping /api/dyslexia/analyze submit.')
      } else {
        console.log('Session ended before recording started; no session saved.')
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setIsRecording(false)
      setStatus('Completed')
      saveInFlightRef.current = false
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Session Tracker</h3>
      </div>
      
      <div className="relative bg-black rounded-lg overflow-hidden mb-4 w-full">
        <video 
          ref={videoRef} 
          autoPlay 
          muted
          className="w-full h-auto"
          style={{ 
            maxHeight: '45vh',
            transform: `translate(${cameraPosition.x}px, ${cameraPosition.y}px) scale(${cameraPosition.scale})`,
            transition: 'transform 0.2s'
          }}
        />
        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <Camera className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Camera Position</h4>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-600">Horizontal: {cameraPosition.x}px</label>
            <input type="range" min="-100" max="100" value={cameraPosition.x} onChange={(e) => setCameraPosition(p => ({ ...p, x: Number(e.target.value) }))} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Vertical: {cameraPosition.y}px</label>
            <input type="range" min="-100" max="100" value={cameraPosition.y} onChange={(e) => setCameraPosition(p => ({ ...p, y: Number(e.target.value) }))} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Zoom: {cameraPosition.scale.toFixed(1)}x</label>
            <input type="range" min="0.5" max="2" step="0.1" value={cameraPosition.scale} onChange={(e) => setCameraPosition(p => ({ ...p, scale: Number(e.target.value) }))} className="w-full" />
          </div>
          <button onClick={() => setCameraPosition({ x: 0, y: 0, scale: 1 })} className="text-xs text-blue-600 hover:underline">Reset Position</button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
          <span className="font-medium">Session ID:</span>
          <span className="text-gray-600 truncate sm:ml-2">{sessionId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium">Duration:</span>
          <span className="text-gray-600">{Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium">Status:</span>
          <span
            className={
              status === 'Recording'
                ? 'text-green-600'
                : status === 'Completed'
                ? 'text-blue-600'
                : 'text-gray-600'
            }
          >
            {status === 'Recording' ? '● Recording' : status}
          </span>
        </div>
      </div>

      {isRecording && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Current Metrics</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="font-medium">WPM:</span> {metrics.readingSpeedWPM}</div>
            <div><span className="font-medium">Fixations:</span> {metrics.fixationCount}</div>
            <div><span className="font-medium">Accuracy:</span> {(metrics.accuracy * 100).toFixed(0)}%</div>
            <div><span className="font-medium">Regressions:</span> {metrics.regressionCount}</div>
            <div><span className="font-medium">Fixation Duration:</span> {metrics.fixationMeanDuration}ms</div>
            <div><span className="font-medium">Score:</span> {metrics.scoreTotal}</div>
          </div>
        </div>
      )}

      {gazeError && (
        <p className="mt-2 text-xs text-red-600">WebGazer error: {gazeError}</p>
      )}
    </div>
  )
}

export { CameraTracker }
