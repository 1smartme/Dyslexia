# Session Metrics System Documentation

## Overview

The Session Metrics System is a comprehensive analytics framework for displaying and tracking user performance across:
- **Game Performance**: Accuracy, response times, correct/incorrect answers
- **Eye Tracking Data**: Fixations, gaze stability, focus loss events
- **ML Predictions**: Dyslexia risk assessment with confidence scores

## Components

### 1. SessionMetricsDisplay
**Full-featured analytics dashboard** showing all metrics in organized cards.

**Location**: `frontend/src/components/analytics/SessionMetricsDisplay.tsx`

**Usage**:
```tsx
import SessionMetricsDisplay from './components/analytics/SessionMetricsDisplay'

<SessionMetricsDisplay 
  userId="user123"
  gameSessionId="session456"
  showRefresh={true}
/>
```

**Features**:
- Responsive 3-column grid layout
- Color-coded risk levels (Green/Yellow/Red)
- Loading and error states
- Real-time refresh capability
- Progress bars for metrics

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| userId | string | ✅ | - | User ID to fetch metrics for |
| gameSessionId | string | ❌ | undefined | Optional session ID to filter results |
| showRefresh | boolean | ❌ | true | Show refresh button |

### 2. SessionMetricsCard
**Compact summary card** for dashboards and overview pages.

**Location**: `frontend/src/components/analytics/SessionMetricsCard.tsx`

**Usage**:
```tsx
import SessionMetricsCard from './components/analytics/SessionMetricsCard'

<SessionMetricsCard 
  userId="user123"
  compact={true}
  onClick={() => navigate('/analytics')}
/>
```

**Features**:
- Compact or detailed view modes
- Clickable (optional)
- Self-initializing data fetch
- Hover effects
- Mini icons for quick recognition

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| userId | string | ✅ | - | User ID to fetch metrics for |
| gameSessionId | string | ❌ | undefined | Optional session ID |
| compact | boolean | ❌ | false | Show compact 3-metric view |
| onClick | function | ❌ | undefined | Callback when card is clicked |

## Hooks

### useSessionMetrics
**React hook** for managing session metrics state and operations.

**Location**: `frontend/src/hooks/useSessionMetrics.ts`

**Usage**:
```tsx
import { useSessionMetrics } from './hooks/useSessionMetrics'

function MyComponent() {
  const { gameMetrics, eyeTracking, mlPrediction, loading, error, refresh } = 
    useSessionMetrics('user123')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <>
      <h2>Game Accuracy: {gameMetrics?.accuracy}%</h2>
      <button onClick={refresh}>Refresh Data</button>
    </>
  )
}
```

**Return Values**:
```tsx
{
  gameMetrics: GameMetricsResponse | null
  eyeTracking: EyeTrackingMetricsResponse | null
  mlPrediction: MLPredictionResponse | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  fetchMetrics: () => Promise<void>
  refresh: () => Promise<void>
}
```

## Services

### sessionMetricsService
**Service layer** for API communication.

**Location**: `frontend/src/services/sessionMetricsService.ts`

**API Endpoints**:
```
GET  /api/game/user-results?userId=<id>
GET  /api/eye-tracking/session?userId=<id>
GET  /api/prediction/latest?userId=<id>
```

**Methods**:

#### fetchGameMetrics(userId, gameSessionId?)
Fetches game performance data.

**Returns**:
```tsx
{
  accuracy: number           // 0-100
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  avgResponseTime: number    // milliseconds
  gameName: string
  difficulty: string
}
```

#### fetchEyeTrackingMetrics(userId, gameSessionId?)
Fetches eye tracking data.

**Returns**:
```tsx
{
  totalFixations: number
  avgFixationDuration: number        // milliseconds
  gazeStabilityScore: number         // 0-100
  focusLossEvents: number
}
```

#### fetchMLPrediction(userId, gameSessionId?)
Fetches ML predictions.

**Returns**:
```tsx
{
  riskLevel: 'Low' | 'Medium' | 'High'
  confidenceScore: number            // 0-1
  indicators: string[]
  recommendations: string[]
}
```

#### fetchAllMetrics(userId, gameSessionId?)
Convenience method to fetch all metrics at once.

## Data Flow

```
User Component
    ↓
useSessionMetrics Hook
    ↓
sessionMetricsService
    ↓
Backend APIs
  ├─ /api/game/user-results
  ├─ /api/eye-tracking/session
  └─ /api/prediction/latest
```

## Error Handling

The system gracefully handles:
- **Missing Authentication**: Checks for token in localStorage
- **API Failures**: Returns default/empty data instead of crashing
- **Network Errors**: Shows user-friendly error messages
- **Null/Missing Fields**: Defaults to safe fallback values

## Integration Examples

### 1. Dashboard Widget
```tsx
import SessionMetricsCard from './components/analytics/SessionMetricsCard'

export function Dashboard() {
  const { user } = useAuth()
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Other dashboard components */}
      
      <SessionMetricsCard 
        userId={user.id}
        compact={true}
        onClick={() => navigate('/session-analytics')}
      />
    </div>
  )
}
```

### 2. Full Analytics Page
```tsx
import SessionMetricsDisplay from './components/analytics/SessionMetricsDisplay'
import { useNavigate } from 'react-router-dom'

export function SessionAnalyticsPage() {
  const { user } = useAuth()
  const sessionId = useSearchParams().get('sessionId')
  
  return (
    <SessionMetricsDisplay 
      userId={user.id}
      gameSessionId={sessionId}
      showRefresh={true}
    />
  )
}
```

### 3. Custom Implementation
```tsx
import { useSessionMetrics } from './hooks/useSessionMetrics'

export function CustomMetricsView() {
  const { gameMetrics, eyeTracking, mlPrediction, loading, refresh } = 
    useSessionMetrics('user123')

  if (loading) return <Spinner />
  
  return (
    <div>
      <h2>My Performance</h2>
      {gameMetrics && (
        <div>
          <p>Accuracy: {gameMetrics.accuracy.toFixed(1)}%</p>
          <ProgressBar value={gameMetrics.accuracy} />
        </div>
      )}
      {eyeTracking && (
        <div>
          <p>Fixations: {eyeTracking.totalFixations}</p>
          <p>Stability: {eyeTracking.gazeStabilityScore.toFixed(0)}%</p>
        </div>
      )}
      {mlPrediction && (
        <div>
          <p>Risk Level: {mlPrediction.riskLevel}</p>
          <p>Confidence: {(mlPrediction.confidenceScore * 100).toFixed(0)}%</p>
        </div>
      )}
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

## Backend API Response Formats

### Game Metrics Response
```json
{
  "accuracy": 85.5,
  "total_questions": 20,
  "correct_answers": 17,
  "incorrect_answers": 3,
  "avg_response_time": 2500,
  "game_name": "Word Recognition",
  "difficulty": "Hard"
}
```

### Eye Tracking Response
```json
{
  "total_fixations": 234,
  "avg_fixation_duration": 250,
  "gaze_stability_score": 92.5,
  "focus_loss_events": 3
}
```

### ML Prediction Response
```json
{
  "risk_level": "Low",
  "confidence_score": 0.92,
  "indicators": [
    "Normal reading pattern",
    "Good gaze stability",
    "Appropriate fixation duration"
  ],
  "recommendations": [
    "Continue regular practice games",
    "Monitor for any changes in performance"
  ]
}
```

## Styling & Theming

The components use Tailwind CSS with dark mode support:
- **Color Scheme**: Primary blue for game metrics, cyan for eye tracking, purple for ML
- **Risk Levels**: Green (Low), Yellow (Medium), Red (High)
- **Responsive**: Mobile-first, adapts to all screen sizes
- **Dark Mode**: Fully supported with `dark:` prefix classes

## Performance Considerations

1. **Lazy Loading**: Components fetch data on mount
2. **Error Recovery**: Failed requests don't block other metrics
3. **Memoization**: Uses `useCallback` to prevent unnecessary re-renders
4. **Token Check**: Validates authentication before API calls

## Testing

Example test cases:
```tsx
describe('SessionMetricsDisplay', () => {
  it('should load and display metrics', async () => {
    render(<SessionMetricsDisplay userId="user123" />)
    expect(screen.getByText('Loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Session Metrics')).toBeInTheDocument())
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'))
    render(<SessionMetricsDisplay userId="user123" />)
    await waitFor(() => expect(screen.getByText(/Unable to Load/)).toBeInTheDocument())
  })
})
```

## Troubleshooting

**Metrics not loading?**
- Check authentication token in localStorage
- Verify user ID is correct
- Check Network tab for API responses

**Data looks wrong?**
- Verify backend APIs are running
- Check API endpoint URLs in environment config
- Ensure proper data serialization in backend

**Styling issues?**
- Clear Tailwind cache: `npm run build`
- Check dark mode toggle in your app
- Verify Tailwind config includes the analytics folder

## Future Enhancements

- [ ] Export metrics to PDF/CSV
- [ ] Trend charts over time
- [ ] Comparison with peer averages
- [ ] Custom date range selection
- [ ] Real-time metric updates via WebSocket
- [ ] Advanced filtering and sorting
- [ ] Integration with NeurologicalInsights component
