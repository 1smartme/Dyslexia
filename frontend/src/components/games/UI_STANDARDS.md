# Game UI Standards Guide

## Overview
This document outlines the standardized UI patterns for all dyslexia support platform games to ensure consistency, intuitiveness, and proper accessibility.

## Layout Structure

### Standard Game Template
All games should follow this structure:

```
┌─────────────────────────────────────────────────┐
│         GameShell (Header & Stats Bar)          │
│  [Back] [Title] [Reset]                         │
│  [Progress | Score | Time | Streak | Difficulty]
└─────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────┐
│      GameContent (Main Playing Area)            │
│      ┌───────────────────────────────────────┐  │
│      │    Game Instructions/Question          │  │
│      │    (Center-aligned, clear hierarchy)   │  │
│      └───────────────────────────────────────┘  │
│      ┌───────────────────────────────────────┐  │
│      │    Answer Options (AnswerGrid)         │  │
│      │    [Option 1] [Option 2]               │  │
│      │    [Option 3] [Option 4]               │  │
│      └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Component Usage

### GameShell Props
- `title`: Game title/name
- `round`: Current round number (1-based)
- `totalRounds`: Total number of rounds
- `score`: Current score
- `streak`: Consecutive correct answers (optional, shows with badge if >= 2)
- `timeLeft`: Seconds remaining (optional, animates when <= 3)
- `difficulty`: AI difficulty level (optional, shows with badge if > 1)
- `onBack`: Callback when back button clicked
- `onReset`: Callback when reset button clicked
- `showStreakBadge`: Show streak indicator
- `showDifficultyBadge`: Show difficulty indicator

### GameContent Props
- `centerContent`: Centers content vertically/horizontally
- `className`: Additional CSS classes

### AnswerGrid Props
- `columns`: Number of columns (2, 3, or 4)
- `gap`: Spacing between items (sm, md, lg)

### FeedbackOverlay Props
- Type: 'success' | 'error' | 'info'
- Auto-stacks vertically and centers on screen

## Spacing Standards

```
- Container padding: 32px (p-8)
- Card gap: 16px (gap-4) for standard, 24px (gap-6) for large
- Section margins: 24px (mb-6)
- Button height: 48px (py-3) for normal, 64px (py-4) for large
- Corner radius: 12px (rounded-lg) for buttons, 16px (rounded-xl) for cards
```

## Color Standards

### Status Colors
- **Success**: From green-500 to emerald-600 gradient
- **Error**: From red-500 to pink-600 gradient  
- **Info/Primary**: From blue-500 to purple-600 gradient
- **Warning**: From orange-500 to amber-600 gradient

### Text Hierarchy
- H1 (Game Title): 28-32px, bold, gradient text
- H2 (Instructions): 24px, bold, gray-900
- H3 (Stats): 18px, semibold, gray-900
- Body: 14-16px, regular, gray-700
- Small: 12-14px, regular/medium, gray-600

## Responsive Behavior

### Desktop (1024px+)
- AnswerGrid: 4 columns for many options, 2 columns for few
- Sidebar visible
- Full padding and spacing

### Tablet (768px - 1023px)
- AnswerGrid: 3 columns
- Adjusted padding (p-6)
- Condensed stat badges

### Mobile (< 768px)
- AnswerGrid: 2 columns (stacked as needed)
- Minimal padding (p-4)
- Simplified header (icon-based)
- Hidden non-essential elements
- Touch-optimized button sizes (min 48x48px)

## Animation Standards

### Entrance
- Stagger delay: 100-200ms between items
- Duration: 300ms
- Easing: ease-out

### Hover States
- Scale: 1.02 - 1.05
- Duration: 200ms
- Shadow expansion on cards

### Feedback
- Overlay appears/disappears: 200ms
- Emoji animation: rotate + scale
- Pulse on alerts: repeat when timeLeft <= 3s

## Accessibility

### Keyboard Navigation
- Tab through all buttons
- Enter/Space to activate
- Escape to go back
- Arrow keys for option selection (grid-based)

### Focus Indicators
- Blue ring: 2px offset 2px
- Visible on all interactive elements
- Dark mode: gray offset

### Color Contrast
- WCAG AA minimum (4.5:1 for text)
- Icons + text for important states
- Patterns or textures for color-blind users

### Motion
- `prefers-reduced-motion`: Respect system preferences
- No auto-playing animations
- Essential animations only

## Typography

### Font Stack
- Primary: Inter, system-ui, sans-serif
- Headings: Poppins, system-ui, sans-serif
- Dyslexic-friendly: OpenDyslexic, Inter, system-ui

### Font Sizes (Tailwind)
- xs: 12px
- sm: 14px
- base: 16px
- lg: 18px
- xl: 20px
- 2xl: 24px
- 3xl: 30px

## Usage Example

```tsx
import GameShell from './GameShell'
import { GameContent, GameSection, AnswerGrid } from './GameComponents'
import InteractiveButton from '../ui/InteractiveButton'

const MyGame = () => {
  return (
    <GameShell
      title="Word Recognition"
      round={5}
      totalRounds={10}
      score={8}
      streak={3}
      timeLeft={8}
      difficulty={2}
      onBack={() => navigate('/dashboard')}
      onReset={() => resetGame()}
    >
      <GameContent centerContent>
        <GameSection title="Which word matches the sound?">
          <button onClick={() => playSound()}>
            Play Sound Again
          </button>
          
          <AnswerGrid columns={2} gap="md">
            {options.map((option, idx) => (
              <InteractiveButton
                key={idx}
                onClick={() => handleAnswer(option)}
                variant="outline"
              >
                {option}
              </InteractiveButton>
            ))}
          </AnswerGrid>
        </GameSection>
      </GameContent>
    </GameShell>
  )
}
```

## Dark Mode Support

All components support dark mode using Tailwind's `dark:` prefix:
- Backgrounds: `bg-white dark:bg-gray-800`
- Text: `text-gray-900 dark:text-white`
- Borders: `border-gray-300 dark:border-gray-600`
- Shadows: Adjusted for dark backgrounds

## Interactive Elements Guidelines

### Buttons
- Size: 48px minimum height (touch-friendly)
- Minimum 12px padding horizontally
- Clear hover/active states
- Sound feedback on click
- Particles effect for gameplay feedback (optional)

### Cards
- Rounded corners: 16px minimum
- Shadow: 0 4px 6px rgba(0,0,0,0.1)
- Hover: Lift effect (shadow increase, -2px translateY)
- Padding: 24-32px

### Progress Indicators
- Bar height: 8px
- Animated gradient background
- Clear start/end states
- Percentage display optional

## Common Mistakes to Avoid

1. ❌ Inconsistent margin/padding - Use defined scale
2. ❌ Buttons too small - Minimum 48x48px
3. ❌ Missing focus states - Required for accessibility
4. ❌ No loading states - Show when fetching data
5. ❌ Unclear error messages - Be specific and helpful
6. ❌ Animation overload - Essential only
7. ❌ Poor contrast - Test with contrast checker
8. ❌ Not responsive - Test on mobile/tablet
9. ❌ Hover-only instructions - Need keyboard support
10. ❌ Inconsistent spacing - Use Tailwind scale
