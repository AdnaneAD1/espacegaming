// Types pour le système multi-tournois
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;
  deadline_register?: Date;
  date_result?: Date;
  createdAt: Date;
  updatedAt: Date;
  settings: TournamentSettings;
  stats: TournamentStats;
}

export interface TournamentSettings {
  maxTeams: number;
  maxGamesPerTeam: number;
  pointsSystem: {
    placement: Record<number, number>; // placement -> points
    killPoints: number; // points per kill
  };
  registrationOpen: boolean;
  resultsVisible: boolean;
}

export interface TournamentStats {
  totalTeams: number;
  totalGames: number;
  totalKills: number;
  averagePointsPerGame: number;
}

// Types étendus pour les équipes et résultats avec tournamentId
export interface TournamentTeam {
  id: string;
  tournamentId: string;
  name: string;
  code: string;
  captain: {
    id: string;
    pseudo: string;
    country: string;
    whatsapp: string;
    deviceCheckVideo: string;
    status: 'pending' | 'validated' | 'rejected';
    joinedAt: Date;
    validatedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    isCaptain?: boolean;
  };
  players: {
    id: string;
    pseudo: string;
    country: string;
    whatsapp: string;
    deviceCheckVideo: string;
    status: 'pending' | 'validated' | 'rejected';
    joinedAt: Date;
    validatedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    isCaptain?: boolean;
  }[];
  status: 'incomplete' | 'complete' | 'validated' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
  fcmToken?: string;
}

export interface TournamentResult {
  id: string;
  tournamentId: string;
  gameNumber: number;
  teamId: string;
  teamName: string;
  placement: number;
  kills: number;
  points: number;
  timestamp: Date;
}

export interface TournamentRanking {
  tournamentId: string;
  teamId: string;
  teamName: string;
  totalPoints: number;
  totalKills: number;
  gamesPlayed: number;
  averagePoints: number;
  bestPlacement: number;
  position: number;
}

// Utilitaires pour la migration
export interface MigrationData {
  tournament: Tournament;
  teams: TournamentTeam[];
  results: TournamentResult[];
}
