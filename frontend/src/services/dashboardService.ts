export interface DashboardStats {
  totalGamesPlayed: number
  averageScore: number
  bestScore: number
  totalTimeMinutes: number
  recentScores: any[]
  gamesPlayedToday: number
  improvementTrend: number
}

const API_URL = "http://localhost:5000/api";

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/scores`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const recentScores = await response.json();

    if (!response.ok) throw new Error("Failed to fetch scores");

    const totalGamesPlayed = recentScores.length;

    const averageScore = recentScores.length > 0
      ? recentScores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / recentScores.length
      : 0;

    const bestScore = recentScores.length > 0
      ? Math.max(...recentScores.map((s: any) => s.score || 0))
      : 0;

    const totalTimeMinutes = 0; // You can calculate later if needed

    const today = new Date().toISOString().split('T')[0];

    const gamesPlayedToday = recentScores.filter((s: any) =>
      s.created_at?.startsWith(today)
    ).length;

    let improvementTrend = 0;

    if (recentScores.length >= 10) {
      const recent5 = recentScores.slice(0, 5);
      const previous5 = recentScores.slice(5, 10);

      const recentAvg =
        recent5.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / 5;

      const previousAvg =
        previous5.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / 5;

      improvementTrend = recentAvg - previousAvg;
    }

    return {
      totalGamesPlayed,
      averageScore,
      bestScore,
      totalTimeMinutes,
      recentScores: recentScores.slice(0, 10),
      gamesPlayedToday,
      improvementTrend
    };

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);

    return {
      totalGamesPlayed: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeMinutes: 0,
      recentScores: [],
      gamesPlayedToday: 0,
      improvementTrend: 0
    };
  }
}

export async function getGameProgress(gameType?: string) {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/scores`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const scores = await response.json();

    if (!response.ok) throw new Error("Failed to fetch progress");

    if (gameType) {
      return scores.filter((s: any) => s.game_name === gameType);
    }

    return scores;

  } catch (error) {
    console.error("Error fetching game progress:", error);
    return [];
  }
}
