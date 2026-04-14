# Session Tracker Integration Guide

## System Architecture

The Session Tracker system is designed to display comprehensive metrics from game performance, eye tracking, and ML predictions. It consists of:

```
┌─────────────────────────────────────────────────────────────┐
│          React Components (Analytics UI)                    │
├─────────────────────────────────────────────────────────────┤
│  • SessionMetricsDisplay  (Full Dashboard)                  │
│  • SessionMetricsCard     (Compact Widget)                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│        React Hooks (State & Data Management)                │
├─────────────────────────────────────────────────────────────┤
│  • useSessionMetrics      (Main Hook)                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│       Services (API Communication)                          │
├─────────────────────────────────────────────────────────────┤
│  • sessionMetricsService  (API Calls & Data Transformation) │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│            Backend REST APIs                                │
├─────────────────────────────────────────────────────────────┤
│  • GET /api/game/user-results                               │
│  • GET /api/eye-tracking/session                            │
│  • GET /api/prediction/latest                               │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
frontend/src/
├── components/analytics/
│   ├── SessionMetricsDisplay.tsx    ← Full dashboard UI
│   ├── SessionMetricsCard.tsx       ← Compact card widget
│   ├── index.ts                     ← Export barrel
│   └── README.md                    ← Component documentation
│
├── hooks/
│   └── useSessionMetrics.ts         ← Custom React hook
│
├── services/
│   └── sessionMetricsService.ts     ← API service layer
│
└── pages/
    └── SessionAnalyticsPage.tsx     ← Full page example
```

## Quick Start

### 1. Import and Use in Your Component

**Option A: Full Dashboard**
```tsx
import SessionMetricsDisplay from '@/components/analytics/SessionMetricsDisplay'

function MyPage() {
  const { user } = useAuth()
  
  return (
    <SessionMetricsDisplay 
      userId={user.id}
      showRefresh={true}
    />
  )
}
```

**Option B: Dashboard Widget**
```tsx
import SessionMetricsCard from '@/components/analytics/SessionMetricsCard'

function Dashboard() {
  const { user } = useAuth()
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SessionMetricsCard 
        userId={user.id}
        compact={true}
        onClick={() => navigate('/session-analytics')}
      />
    </div>
  )
}
```

**Option C: Custom Hook**
```tsx
import { useSessionMetrics } from '@/hooks/useSessionMetrics'

function MyChart() {
  const { gameMetrics, eyeTracking, mlPrediction, loading } = 
    useSessionMetrics('user123')

  if (loading) return <Spinner />
  
  return (
    <div>
      <h2>Accuracy: {gameMetrics?.accuracy}%</h2>
      <h2>Risk: {mlPrediction?.riskLevel}</h2>
    </div>
  )
}
```

## Component Behaviors

### SessionMetricsDisplay
- **Purpose**: Display all metrics in an organized dashboard
- **Data Fetching**: Automatic on mount, optional manual refresh
- **Layout**: Responsive 3-column grid (mobile → 1 col, tablet → 2 col, desktop → 3 col)
- **Error Handling**: Shows error card if fetch fails
- **Loading State**: Spinner while fetching
- **Empty State**: Message if no data available

### SessionMetricsCard
- **Purpose**: Quick overview widget for dashboards
- **Data Fetching**: Automatic on mount
- **Modes**: Compact (3 metrics) or Full (detailed view)
- **Interactivity**: Optional onClick handler for navigation
- **Styling**: Hover effects and animations

## API Response Handling

The service automatically transforms backend responses to handle different naming conventions:

```tsx
// Backend sends (snake_case)
{
  "total_fixations": 234,
  "avg_fixation_duration": 250
}

// Service transforms to (camelCase)
{
  totalFixations: 234,
  avgFixationDuration: 250
}
```

## Error Scenarios and Handling

| Scenario | Behavior | User Message |
|----------|----------|--------------|
| Not Authenticated | Request fails | "Not authenticated" error |
| API Returns 404 | Default empty data | Component shows "No data available" |
| Network Error | Catch block triggers | Shows error card with retry button |
| Missing Data Fields | Uses fallback values | Displays 0 or N/A gracefully |
| Service Unavailable | Request timeout | "Failed to load metrics" |

## State Management Pattern

```tsx
// Hook manages all state
const [state, setState] = useState({
  gameMetrics: null,
  eyeTracking: null,
  mlPrediction: null,
  loading: true,
  error: null,
  lastUpdated: null
})

// Callbacks for operations
const fetchMetrics = async () => { /* fetch from API */ }
const refresh = () => { /* call fetchMetrics */ }

// Return state and operations
return { ...state, fetchMetrics, refresh }
```

## Integration Checklist

- [ ] Copy components to `frontend/src/components/analytics/`
- [ ] Copy service to `frontend/src/services/sessionMetricsService.ts`
- [ ] Copy hook to `frontend/src/hooks/useSessionMetrics.ts`
- [ ] Copy page example to `frontend/src/pages/SessionAnalyticsPage.tsx`
- [ ] Add route in your router configuration
- [ ] Verify backend APIs are running and accessible
- [ ] Test with a real user ID
- [ ] Check dark mode compatibility
- [ ] Verify responsive layout on mobile

## Backend API Requirements

Your backend needs to implement these endpoints:

### 1. Game Results Endpoint
```
GET /api/game/user-results?userId=<id>&sessionId=<optional>

Response:
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

### 2. Eye Tracking Endpoint
```
GET /api/eye-tracking/session?userId=<id>&sessionId=<optional>

Response:
{
  "total_fixations": 234,
  "avg_fixation_duration": 250,
  "gaze_stability_score": 92.5,
  "focus_loss_events": 3
}
```

### 3. ML Prediction Endpoint
```
GET /api/prediction/latest?userId=<id>&sessionId=<optional>

Response:
{
  "risk_level": "Low",
  "confidence_score": 0.92,
  "indicators": ["Normal reading pattern", "Good gaze stability"],
  "recommendations": ["Continue regular practice games"]
}
```

## Testing the Integration

### Manual Testing
1. Navigate to a page with SessionMetricsDisplay
2. Wait for data to load
3. Verify all three card sections appear
4. Check that numbers match expected values
5. Click refresh button
6. Test with different users
7. Test error state (use invalid user ID)

### Browser Console Testing
```jsx
// Check if data loaded
document.querySelector('[class*="Session"]')

// Verify API calls
// Open Network tab → filter by XHR
// Check for /api/game/user-results, /api/eye-tracking/session, /api/prediction/latest
```

## Customization

### Change Color Scheme
Edit color classes in components:
```tsx
// Game metrics uses blue
<div className="bg-gradient-to-r from-blue-500 to-blue-600">

// Change to your color
<div className="bg-gradient-to-r from-indigo-500 to-indigo-600">
```

### Customize Risk Level Colors
```tsx
const getRiskLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'low': return 'bg-green-100 text-green-800'      // Edit here
    case 'medium': return 'bg-yellow-100 text-yellow-800'  // Edit here
    case 'high': return 'bg-red-100 text-red-800'          // Edit here
  }
}
```

### Add More Metrics
```tsx
// In SessionMetricsDisplay, add new card after eyeTracking:
{newMetric && (
  <motion.div className="lg:col-span-4">
    {/* Your new metric card */}
  </motion.div>
)}
```

## Performance Tips

1. **Lazy Load**: Import components only when needed
2. **Memoize**: Use `React.memo` for expensive components
3. **Throttle Refresh**: Implement debounce on refresh button
4. **Cache Data**: Consider caching API responses in localStorage
5. **Pagination**: For large datasets, paginate results

## Troubleshooting

### Metrics not loading?
```
1. Check browser console for errors
2. Open Network tab and verify API calls
3. Check Authentication token: localStorage.getItem('token')
4. Verify API endpoints in environment config
5. Check CORS headers in backend
```

### Styling looks wrong?
```
1. Clear browser cache (Ctrl+Shift+Delete)
2. Verify Tailwind CSS is imported in main.css
3. Check dark mode toggle is working
4. Rebuild CSS: npm run build
5. Check for conflicting CSS classes
```

### Data is stale?
```
1. Click Refresh button
2. Use useSessionMetrics hook directly
3. Call sessionMetricsService.fetchAllMetrics() manually
4. Implement auto-refresh with setInterval
```

## Advanced Features

### Auto-Refresh
```tsx
useEffect(() => {
  const interval = setInterval(() => {
    fetchMetrics()
  }, 30000) // Refresh every 30 seconds
  
  return () => clearInterval(interval)
}, [fetchMetrics])
```

### Custom Formatting
```tsx
const formatMetric = (value: number, type: string) => {
  if (type === 'time') return `${(value / 1000).toFixed(2)}s`
  if (type === 'percentage') return `${value.toFixed(1)}%`
  return value
}
```

### Export Data
```tsx
const exportMetrics = () => {
  const data = JSON.stringify({ gameMetrics, eyeTracking, mlPrediction })
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'metrics.json'
  a.click()
}
```

## Support

For issues or questions:
1. Check the comprehensive README in `components/analytics/README.md`
2. Review service implementation in `sessionMetricsService.ts`
3. Check browser console for detailed error messages
4. Verify backend API responses match expected format
