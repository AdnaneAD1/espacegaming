export interface GameResult {
  id: string;
  gameNumber: number;
  teamId: string;
  teamName: string;
  placement: number; // 1-50
  kills: number;
  points: number; // Calculé automatiquement
  timestamp: Date;
}

export interface TeamRanking {
  teamId: string;
  teamName: string;
  totalPoints: number;
  totalKills: number;
  gamesPlayed: number;
  averagePoints: number;
  bestPlacement: number;
  position: number; // Rang dans le classement
}

export interface Tournament {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  currentGame: number;
  totalGames: number;
  startDate: Date;
  endDate?: Date;
  deadline_register?: Date; // Date limite pour les inscriptions
  results: GameResult[];
  rankings: TeamRanking[];
}

// Système de points basé sur le placement
export const PLACEMENT_POINTS: Record<number, number> = {
  1: 25,   // Top 1
  2: 20,   // Top 2  
  3: 17,   // Top 3
  4: 15,   // Top 4
  5: 12, 6: 12, 7: 12, 8: 12, 9: 12, 10: 12,  // Top 5-10
  11: 10, 12: 10, 13: 10, 14: 10, 15: 10, 16: 10, 17: 10, 18: 10, 19: 10, 20: 10,  // Top 11-20
  21: 8, 22: 8, 23: 8, 24: 8, 25: 8, 26: 8, 27: 8, 28: 8, 29: 8, 30: 8,  // Top 21-30
  31: 5, 32: 5, 33: 5, 34: 5, 35: 5, 36: 5, 37: 5, 38: 5, 39: 5, 40: 5,  // Top 31-40
  41: 3, 42: 3, 43: 3, 44: 3, 45: 3, 46: 3, 47: 3, 48: 3, 49: 3, 50: 3   // Top 41-50
};

// Points par kill
export const KILL_POINTS = 10;

// Fonction utilitaire pour calculer les points
export function calculatePoints(placement: number, kills: number): number {
  const placementPoints = PLACEMENT_POINTS[placement] || 0;
  const killPoints = kills * KILL_POINTS;
  return placementPoints + killPoints;
}
