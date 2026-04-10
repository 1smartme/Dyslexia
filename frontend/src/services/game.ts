// frontend/src/services/game.ts

export interface SaveGameScorePayload {
  gameName: string;
  difficulty: string;
  accuracy: number;
  avgResponseTime: number;
  errors: any;
}

export async function saveGameScore(payload: SaveGameScorePayload) {
  try {
    const response = await fetch("/api/save-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data; // { success: true } or { error: "..." }
  } catch (error) {
    console.error("Error saving game score:", error);
    return { error };
  }
}

export async function getRecentScores(limit = 30) {
  try {
    const response = await fetch(`/api/recent-scores?limit=${limit}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching recent scores:", error);
    return [];
  }
}
