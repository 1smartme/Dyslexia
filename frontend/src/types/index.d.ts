// src/types/index.d.ts
export type GameScoreRow = {
  id: number;
  user_id: string;
  game_name: string;
  difficulty_level: string;
  accuracy: number;
  avg_response_time: number;
  errors: Record<string, any>;
  created_at: string;
};
