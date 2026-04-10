# UI Refactoring Migration Guide

## Overview
This guide explains how to update existing game components to use the new standardized UI system.

## New Components Available

### 1. GameShell
**Location**: `./GameShell.tsx`

Wraps the entire game experience with standardized header and stats bar.

**Usage**:
```tsx
<GameShell
  title="Game Name"
  round={currentRound}
  totalRounds={totalRounds}
  score={score}
  streak={streak}
  timeLeft={timeLeft}
  difficulty={difficulty}
  onBack={handleBack}
  onReset={handleReset}
>
  {/* Game content here */}
</GameShell>
```

### 2. GameContent & Supporting Components
**Location**: `./GameComponents.tsx`

```tsx
import {
  GameContent,      // Main content wrapper
  AnswerGrid,       // Flexible grid for answers
  FeedbackOverlay,  // Full-screen feedback
  GameSection,      // Content sections  
  GameButton        // Standardized button
} from './GameComponents'
```

## Migration Steps

### Step 1: Update Imports
Replace old imports with new components:

```tsx
// Old
import AnimatedCard from '../ui/AnimatedCard'
import ProgressBar from '../ui/ProgressBar'

// New
import GameShell from './GameShell'
import { GameContent, GameSection, AnswerGrid, FeedbackOverlay } from './GameComponents'
```

### Step 2: Restructure JSX

**Before**:
```tsx
return (
  <div className="min-h-screen gradient-bg p-4">
    <div className="max-w-2xl mx-auto">
      <AnimatedCard className="mb-6 p-6">
        <h1>Game Title</h1>
        <div className="flex justify-between">
          {/* Stats scattered everywhere */}
        </div>
      </AnimatedCard>
      
      <AnimatedCard className="p-8">
        {/* Game content */}
      </AnimatedCard>
    </div>
  </div>
)
```

**After**:
```tsx
return (
  <GameShell
    title="Game Title"
    round={currentRound}
    totalRounds={totalRounds}
    score={score}
    onBack={handleBack}
  >
    <GameContent centerContent>
      <GameSection title="Instructions">
        {/* Game instruction/prompt */}
      </GameSection>
      
      <AnswerGrid columns={2} gap="md">
        {/* Answer buttons */}
      </AnswerGrid>
    </GameContent>
  </GameShell>
)
```

### Step 3: Update Feedback System

**Before**:
```tsx
const [showFeedback, setShowFeedback] = useState<{
  type: 'success' | 'error'
  message: string
} | null>(null)

// Then in JSX:
{showFeedback && (
  <motion.div
    className={`absolute inset-0 flex items-center justify-center z-10 ${
      showFeedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } bg-opacity-90 text-white`}
  >
    {/* Feedback */}
  </motion.div>
)}
```

**After**:
```tsx
const [showFeedback, setShowFeedback] = useState<{
  type: 'success' | 'error'
  message: string
  emoji: string
} | null>(null)

// Then in JSX:
<FeedbackOverlay
  show={!!showFeedback}
  type={showFeedback?.type || 'info'}
  message={showFeedback?.message || ''}
  emoji={showFeedback?.emoji}
/>
```

### Step 4: Update Answer Options Grid

**Before**:
```tsx
<div className="grid grid-cols-2 gap-4">
  {options.map((option, index) => (
    <div key={index}>
      <InteractiveButton onClick={() => handleAnswer(option)}>
        {option}
      </InteractiveButton>
    </div>
  ))}
</div>
```

**After**:
```tsx
<AnswerGrid columns={2} gap="md">
  {options.map((option, index) => (
    <motion.div key={index}>
      <InteractiveButton onClick={() => handleAnswer(option)}>
        {option}
      </InteractiveButton>
    </motion.div>
  ))}
</AnswerGrid>
```

## Games to Update

### Priority 1 (Most Used)
- [ ] `WordRecognitionGame.tsx` → Use `WordRecognitionGameRefactored.tx as reference
- [ ] `LetterMirrorGame.tsx`
- [ ] `BuildWordGame.tsx` 
- [ ] `LetterSequencingGame.tsx`

### Priority 2 (Important)
- [ ] `ReadingComprehensionGame.tsx`
- [ ] `SpeedWordsGame.tsx`
- [ ] `SoundTwinsGame.tsx`
- [ ] `OddOneOutGame.tsx`

## Common Patterns

### Pattern 1: Simple Single-Answer Game
```tsx
<GameShell
  title="Game Name"
  round={currentRound + 1}
  totalRounds={totalRounds}
  score={score}
  streak={streak}
  timeLeft={timeLeft}
>
  <GameContent centerContent>
    <GameSection title="Select the correct answer">
      <div className="mb-8 p-6 bg-primary-50 rounded-lg text-2xl font-bold text-primary-600">
        {question}
      </div>
      
      <AnswerGrid columns={options.length <= 2 ? 2 : options.length <= 4 ? 2 : 3}>
        {options.map((opt, idx) => (
          <motion.div key={idx}>
            <InteractiveButton
              onClick={() => handleAnswer(opt)}
              variant="outline"
            >
              {opt}
            </InteractiveButton>
          </motion.div>
        ))}
      </AnswerGrid>
    </GameSection>
  </GameContent>
</GameShell>
```

### Pattern 2: Game with Intermediate States
```tsx
// While playing
<GameShell {...props}>
  <GameContent>{/* Playing state */}</GameContent>
</GameShell>

// Completion screen
<GameShell {...completeProps}>
  <GameContent>
    <GameSection>
      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stats cards */}
      </div>
      <div className="flex gap-4 justify-center mt-8">
        <InteractiveButton onClick={handleReset}>
          Play Again
        </InteractiveButton>
        <InteractiveButton onClick={handleBack} variant="outline">
          Back
        </InteractiveButton>
      </div>
    </GameSection>
  </GameContent>
</GameShell>
```

### Pattern 3: Drag-and-Drop / Multiple Selection Game
```tsx
<GameShell {...props}>
  <GameContent>
    <GameSection title="Main Instruction">
      {/* Draggable/Selectable items */}
    </GameSection>
    
    <GameSection>
      <AnswerGrid columns={2} gap="lg">
        {/* Selected items display area or final submission area */}
      </AnswerGrid>
    </GameSection>
  </GameContent>
</GameShell>
```

## Responsive Grid Sizing Guide

Use these rules for responsive `AnswerGrid` columns:

```
- 1-2 options: columns={2}
- 3-4 options: columns={2} on mobile, auto-wraps
- 4-6 options: columns={3} on desktop, columns={2} on mobile
- 6+ options: columns={4} on desktop, columns={2} on mobile
```

**Smart Auto-Sizing**:
```tsx
const getGridColumns = (optionCount: number) => {
  if (optionCount <= 2) return 2
  if (optionCount <= 4) return 2
  if (optionCount <= 6) return 3
  return 4
}

<AnswerGrid columns={getGridColumns(options.length)}>
  {/* options */}
</AnswerGrid>
```

## Dark Mode Checklist

✅ All new components have `dark:` variants
✅ Test gray colors: `dark:bg-gray-800`, `dark:text-white`
✅ Test gradients: `dark:from-blue-600 dark:to-purple-700`
✅ Test borders: `dark:border-gray-600`
✅ Test shadows: Adjust opacity for dark backgrounds

## Accessibility Checklist When Migrating

- [ ] All buttons have minimum 48x48px touch target
- [ ] Focus indicators visible (blue ring, 2px offset)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color contrast >= 4.5:1 for WCAG AA
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Error messages are clear and specific
- [ ] Loading states shown during async operations

## Testing Checkpoints

### Visual Testing
- [ ] Desktop (1920px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)
- [ ] Light mode
- [ ] Dark mode
- [ ] With session tracker (GameWithTracking component)

### Functional Testing
- [ ] All buttons clickable
- [ ] Time countdown works
- [ ] Score updates correctly
- [ ] Streak shows correctly (>= 2)
- [ ] Difficulty badge shows correctly (> 1)
- [ ] Feedback overlay displays and times out
- [ ] Stats display on completion

### Accessibility Testing
- [ ] Tab navigation works
- [ ] Focus indicators visible
- [ ] Screen reader announces game state
- [ ] Keyboard-only users can complete game
- [ ] Colors work for colorblind users

## Performance Optimizations

1. **Lazy Load Game Components**
```tsx
const WordRecognitionGame = lazy(() => import('./WordRecognitionGame'))
```

2. **Memoize Answer Grid**
```tsx
const MemoizedAnswerGrid = React.memo(AnswerGrid)
```

3. **Debounce Time Updates**
```tsx
const debouncedTimeUpdate = useCallback(
  debounce(() => setTimeLeft(t => t - 1), 100),
  []
)
```

4. **Use key prop correctly**
```tsx
// Good - stable key for reordering
{options.map((opt, idx) => (
  <div key={`${opt}-${idx}`}>
    {/* content */}
  </div>
))}

// Bad - index as key
{options.map((opt, idx) => (
  <div key={idx}>
    {/* content */}
  </div>
))}
```

## Troubleshooting

### Issue: Stats bar not showing
**Solution**: Make sure `GameShell` wraps `GameContent`. Stats are in the header, not game content.

### Issue: Answer grid doesn't wrap properly on mobile
**Solution**: Check `columns` prop value. On mobile, use `columns={2}` for most games. Tailwind handles the rest responsively.

### Issue: FeedbackOverlay appears but doesn't disappear
**Solution**: Ensure you're updating `showFeedback` state to null after timeout. Check that `FeedbackOverlay` show prop matches state.

### Issue: Dark mode text isn't visible
**Solution**: Add `dark:text-white` or appropriate dark color class to text elements. Never assume colors inherit properly.

### Issue: Performance is slow
**Solution**: 
1. Check for unnecessary re-renders using React DevTools
2. Memoize expensive components with `React.memo`
3. Use `useCallback` for event handlers
4. Lazy load game components

## Legacy Code Removal

Once all games are migrated, remove:
- [ ] Old `gradient-bg` class (use GameShell)
- [ ] Old `AnimatedCard` for games (use `GameContent`)
- [ ] Old `ProgressBar` usage in game headers (use `GameShell`)
- [ ] Manual timer animations (GameShell handles it)

## References

- **UI Standards**: See `UI_STANDARDS.md`
- **Component Examples**: See `WordRecognitionGameRefactored.tsx`
- **Tailwind Config**: `tailwind.config.js`
- **Animation Defaults**: See `framer-motion` docs

## Questions?

Review the reference implementation:
```
WordRecognitionGameRefactored.tsx
```

This file demonstrates:
✅ GameShell usage
✅ Feedback overlay integration  
✅ Answer grid implementation
✅ Game completion screen
✅ Stats display
✅ Dark mode support
✅ Responsive design
✅ Accessibility features
