import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface GazePoint {
  x: number
  y: number
  timestamp: number
}

export interface FixationStats {
  mean_duration: number
  count: number
}

export interface RegressionStats {
  count: number
}

interface WebGazerApi {
  setRegression: (type: string) => WebGazerApi
  setGazeListener: (listener: ((data: { x: number; y: number } | null) => void) | null) => WebGazerApi
  begin: () => Promise<unknown>
  clearGazeListener: () => WebGazerApi
  showVideoPreview?: (show: boolean) => WebGazerApi
  showPredictionPoints?: (show: boolean) => WebGazerApi
  showVideo?: (show: boolean) => WebGazerApi
  showFaceOverlay?: (show: boolean) => WebGazerApi
  showFaceFeedbackBox?: (show: boolean) => WebGazerApi
}

declare global {
  interface Window {
    webgazer?: WebGazerApi
  }
}

const WEBGAZER_SCRIPT = 'https://webgazer.cs.brown.edu/webgazer.js'
const FIXATION_RADIUS_PX = 40
const MIN_FIXATION_MS = 120
const REGRESSION_THRESHOLD_PX = 20

export function useWebGazerTracking() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gazeStream, setGazeStream] = useState<GazePoint[]>([])
  const [fixationStats, setFixationStats] = useState<FixationStats>({ mean_duration: 0, count: 0 })
  const [regressions, setRegressions] = useState<RegressionStats>({ count: 0 })

  const isTrackingRef = useRef(false)
  const uiCleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gazeStreamRef = useRef<GazePoint[]>([])
  const lastPointRef = useRef<GazePoint | null>(null)
  const fixationStartRef = useRef<GazePoint | null>(null)
  const fixationDurationSumRef = useRef(0)
  const fixationCountRef = useRef(0)
  const regressionCountRef = useRef(0)

  const hideWebGazerUi = useCallback(() => {
    const webgazer = window.webgazer
    if (webgazer) {
      webgazer.showVideoPreview?.(false)
      webgazer.showPredictionPoints?.(false)
      webgazer.showVideo?.(false)
      webgazer.showFaceOverlay?.(false)
      webgazer.showFaceFeedbackBox?.(false)
    }

    const overlayIds = [
      'webgazerVideoContainer',
      'webgazerVideoFeed',
      'webgazerFaceOverlay',
      'webgazerFaceFeedbackBox',
      'webgazerGazeDot',
    ]
    overlayIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        element.remove()
      }
    })
  }, [])

  const loadWebGazerScript = useCallback(async () => {
    if (window.webgazer) {
      setIsReady(true)
      return
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${WEBGAZER_SCRIPT}"]`)
      if (existing) {
        if (window.webgazer) {
          resolve()
        } else {
          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error('Failed to load WebGazer script')), { once: true })
        }
        return
      }

      const script = document.createElement('script')
      script.src = WEBGAZER_SCRIPT
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load WebGazer script'))
      document.body.appendChild(script)
    })

    if (!window.webgazer) {
      throw new Error('WebGazer not available after script load')
    }
    hideWebGazerUi()
    setIsReady(true)
  }, [hideWebGazerUi])

  useEffect(() => {
    loadWebGazerScript().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Could not initialize WebGazer'
      setError(message)
    })
  }, [loadWebGazerScript])

  const resetTracking = useCallback(() => {
    gazeStreamRef.current = []
    setGazeStream([])
    lastPointRef.current = null
    fixationStartRef.current = null
    fixationDurationSumRef.current = 0
    fixationCountRef.current = 0
    regressionCountRef.current = 0
    setFixationStats({ mean_duration: 0, count: 0 })
    setRegressions({ count: 0 })
  }, [])

  const commitFixation = useCallback((durationMs: number) => {
    if (durationMs < MIN_FIXATION_MS) {
      return
    }
    fixationCountRef.current += 1
    fixationDurationSumRef.current += durationMs
    setFixationStats({
      count: fixationCountRef.current,
      mean_duration: fixationDurationSumRef.current / fixationCountRef.current,
    })
  }, [])

  const gazeListener = useCallback((data: { x: number; y: number } | null) => {
    if (!isTrackingRef.current || !data) {
      return
    }

    const point: GazePoint = {
      x: data.x,
      y: data.y,
      timestamp: Date.now(),
    }

    const previous = lastPointRef.current
    if (previous) {
      const dx = point.x - previous.x
      const dy = point.y - previous.y

      if (dx < -REGRESSION_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
        regressionCountRef.current += 1
        setRegressions({ count: regressionCountRef.current })
      }

      const distance = Math.hypot(dx, dy)
      const fixationStart = fixationStartRef.current
      if (!fixationStart) {
        fixationStartRef.current = previous
      } else if (distance <= FIXATION_RADIUS_PX) {
        const currentDuration = point.timestamp - fixationStart.timestamp
        setFixationStats({
          count: fixationCountRef.current + (currentDuration >= MIN_FIXATION_MS ? 1 : 0),
          mean_duration:
            fixationCountRef.current + (currentDuration >= MIN_FIXATION_MS ? 1 : 0) > 0
              ? (fixationDurationSumRef.current + (currentDuration >= MIN_FIXATION_MS ? currentDuration : 0)) /
                (fixationCountRef.current + (currentDuration >= MIN_FIXATION_MS ? 1 : 0))
              : 0,
        })
      } else {
        const duration = previous.timestamp - fixationStart.timestamp
        commitFixation(duration)
        fixationStartRef.current = point
      }
    } else {
      fixationStartRef.current = point
    }

    lastPointRef.current = point
    gazeStreamRef.current = [...gazeStreamRef.current, point]
    setGazeStream(gazeStreamRef.current)
  }, [commitFixation])

  const startTracking = useCallback(async () => {
    if (!window.webgazer) {
      throw new Error('WebGazer is not loaded')
    }

    resetTracking()
    isTrackingRef.current = true

    await window.webgazer
      .setRegression('ridge')
      .setGazeListener(gazeListener)
      .begin()

    hideWebGazerUi()
    if (uiCleanupTimerRef.current) {
      clearInterval(uiCleanupTimerRef.current)
    }
    uiCleanupTimerRef.current = setInterval(() => {
      hideWebGazerUi()
    }, 500)
  }, [gazeListener, hideWebGazerUi, resetTracking])

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false
    const fixationStart = fixationStartRef.current
    const lastPoint = lastPointRef.current
    if (fixationStart && lastPoint) {
      commitFixation(lastPoint.timestamp - fixationStart.timestamp)
    }
    fixationStartRef.current = null
    window.webgazer?.clearGazeListener()
    if (uiCleanupTimerRef.current) {
      clearInterval(uiCleanupTimerRef.current)
      uiCleanupTimerRef.current = null
    }
  }, [commitFixation])

  const snapshot = useMemo(
    () => ({
      gaze_stream: gazeStream,
      fixation_stats: fixationStats,
      regressions,
    }),
    [gazeStream, fixationStats, regressions]
  )

  return {
    isReady,
    error,
    gazeStream,
    fixationStats,
    regressions,
    snapshot,
    startTracking,
    stopTracking,
    resetTracking,
  }
}

