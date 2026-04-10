export type GameDifficulty = 'easy' | 'medium' | 'hard'

export interface GameContentItem {
  word: string
  image: string
}

export const DIFFICULTY_SETTINGS: Record<GameDifficulty, {
  rounds: number
  time: number
  hintsEnabled: boolean
  scoreMultiplier: number
}> = {
  easy: { rounds: 4, time: 18, hintsEnabled: true, scoreMultiplier: 1 },
  medium: { rounds: 6, time: 12, hintsEnabled: true, scoreMultiplier: 1.2 },
  hard: { rounds: 9, time: 8, hintsEnabled: false, scoreMultiplier: 1.5 }
}

export const WORD_POOLS = {
  easy: ['cat', 'dog', 'sun', 'tree'],
  medium: ['apple', 'tiger', 'river'],
  hard: ['astronaut', 'galaxy', 'elephant']
} as const

const EXTRA_SCALABLE_WORDS: Record<GameDifficulty, string[]> = {
  easy: ['fish', 'book', 'ball', 'car', 'star', 'bird'],
  medium: ['chair', 'garden', 'rocket', 'planet', 'bridge', 'forest'],
  hard: ['dinosaur', 'volcano', 'microscope', 'laboratory', 'satellite', 'universe']
}

const EMOJI_MAP: Record<string, string> = {
  cat: '🐱',
  dog: '🐶',
  sun: '☀️',
  tree: '🌳',
  apple: '🍎',
  tiger: '🐯',
  river: '🌊',
  astronaut: '👨‍🚀',
  galaxy: '🌌',
  elephant: '🐘',
  fish: '🐟',
  book: '📘',
  ball: '⚽',
  car: '🚗',
  star: '⭐',
  bird: '🐦',
  chair: '🪑',
  garden: '🌿',
  rocket: '🚀',
  planet: '🪐',
  bridge: '🌉',
  forest: '🌲',
  dinosaur: '🦖',
  volcano: '🌋',
  microscope: '🔬',
  laboratory: '🧪',
  satellite: '🛰️',
  universe: '✨'
}

export const HARD_CONFUSING_WORDS = [
  ['form', 'from'],
  ['angel', 'angle'],
  ['there', 'three'],
  ['quiet', 'quite'],
  ['trial', 'trail'],
  ['planet', 'platen']
] as const

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export const getWordsForDifficulty = (difficulty: GameDifficulty, includeScalable = true) => {
  const base = [...WORD_POOLS[difficulty]]
  return includeScalable ? [...base, ...EXTRA_SCALABLE_WORDS[difficulty]] : base
}

export const getGameContent = (
  difficulty: GameDifficulty,
  count?: number
): GameContentItem[] => {
  const pool = getWordsForDifficulty(difficulty, true)
  const mapped = pool.map(word => ({ word, image: EMOJI_MAP[word] ?? '🧩' }))
  const shuffled = shuffle(mapped)
  return typeof count === 'number' ? shuffled.slice(0, Math.max(1, count)) : shuffled
}

export const pickConfusingWord = (baseWord: string) => {
  const match = HARD_CONFUSING_WORDS.find(([a]) => a === baseWord.toLowerCase())
  return match?.[1] ?? null
}
