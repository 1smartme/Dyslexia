export type LearningTrack = 'wordRecognition' | 'readingComprehension' | 'letterSequencing'

export interface SessionLike {
  game_type?: string
  score?: number
  total?: number
  accuracy?: number
}

const norm = (s: string) => s.toLowerCase().replace(/[\s_]+/g, '-')

function gameTypeToTrack(gameType: string | undefined): LearningTrack | null {
  if (!gameType) return null
  const g = norm(gameType)
  if (
    g.includes('word-recognition') ||
    g.includes('wordrecognition') ||
    g.includes('speed-word') ||
    g.includes('sound-twin') ||
    g.includes('odd-one-out') ||
    g.includes('oddoneout') ||
    g === 'word_recognition' ||
    g === 'speed_words' ||
    g === 'sound_twins' ||
    g === 'odd_one_out'
  ) {
    return 'wordRecognition'
  }
  if (g.includes('reading-comprehension') || g.includes('readingcomprehension') || g === 'reading_comprehension') {
    return 'readingComprehension'
  }
  if (
    g.includes('letter-sequencing') ||
    g.includes('lettersequencing') ||
    g.includes('letter-mirror') ||
    g.includes('build-word') ||
    g === 'letter_sequencing' ||
    g === 'letter_mirror' ||
    g === 'build_word'
  ) {
    return 'letterSequencing'
  }
  return null
}

function sessionAccuracy(s: SessionLike): number {
  const total = Number(s.total)
  const score = Number(s.score)
  if (total > 0 && Number.isFinite(score)) {
    return Math.min(1, Math.max(0, score / total))
  }
  const a = Number(s.accuracy)
  if (Number.isFinite(a)) {
    return Math.min(1, Math.max(0, a > 1 ? a / 100 : a))
  }
  return 0
}

export function aggregateSessionsByTrack(sessions: SessionLike[]): Record<
  LearningTrack,
  { averageRaw: number; count: number }
> {
  const buckets: Record<LearningTrack, { sum: number; count: number }> = {
    wordRecognition: { sum: 0, count: 0 },
    readingComprehension: { sum: 0, count: 0 },
    letterSequencing: { sum: 0, count: 0 },
  }

  for (const s of sessions || []) {
    const track = gameTypeToTrack(String(s.game_type || ''))
    if (!track) continue
    const acc = sessionAccuracy(s)
    buckets[track].sum += acc
    buckets[track].count += 1
  }

  return {
    wordRecognition: {
      averageRaw: buckets.wordRecognition.count ? buckets.wordRecognition.sum / buckets.wordRecognition.count : 0,
      count: buckets.wordRecognition.count,
    },
    readingComprehension: {
      averageRaw: buckets.readingComprehension.count
        ? buckets.readingComprehension.sum / buckets.readingComprehension.count
        : 0,
      count: buckets.readingComprehension.count,
    },
    letterSequencing: {
      averageRaw: buckets.letterSequencing.count ? buckets.letterSequencing.sum / buckets.letterSequencing.count : 0,
      count: buckets.letterSequencing.count,
    },
  }
}

/** Heuristic: scores table often stores 0–10 points per round-set, not 0–100. */
export function scoreRowToPercent(row: { score?: number; game_name?: string }): number {
  const s = Number(row.score ?? 0)
  if (!Number.isFinite(s)) return 0
  if (s >= 0 && s <= 10) return Math.min(100, Math.round(s * 10))
  if (s <= 100) return Math.round(s)
  return Math.min(100, Math.round(s))
}
