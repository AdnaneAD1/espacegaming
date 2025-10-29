// Types pour le système multi-tournois
import { GameMode } from './game-modes';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  gameMode: GameMode;
  status: 'draft' | 'active' | 'completed';
  startDate: Date;
  endDate?: Date;
  deadline_register?: Date;
  date_result?: Date;
  createdAt: Date;
  updatedAt: Date;
  settings: TournamentSettings;
  
  // Configuration personnalisée du format
  customFormat?: {
    bestOf?: 3 | 5; // Override du BO par défaut du mode
    tournamentFormat: 'elimination_direct' | 'groups_then_elimination' | 'groups_only';
    groupStage?: {
      enabled: boolean;
      teamsPerGroup?: number;
      qualifiersPerGroup?: 1 | 2;
      roundRobinInGroup?: boolean;
    };
  };
  
  stats: {
    totalTeams: number;
    totalGames: number;
    averageKillsPerGame?: number;
    topKiller?: {
      playerId: string;
      playerName: string;
      kills: number;
    };
  };
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
  gameMode: GameMode; // Mode de jeu de l'équipe
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
  gameMode: GameMode;
  gameNumber: number;
  teamId: string;
  teamName: string;
  placement: number; // 1 = victoire, 2 = défaite (pour MJ) / Position finale (pour BR)
  kills: number; // Total kills de l'équipe
  points: number;
  
  // Pour les modes multijoueur BO3/BO5 : détails par partie
  matchDetails?: {
    bestOf: 3 | 5; // BO3 ou BO5
    roundsWon: number; // Nombre de manches gagnées
    roundsLost: number; // Nombre de manches perdues
    rounds: {
      roundNumber: number;
      won: boolean; // true si cette manche est gagnée
      playerKills: {
        playerId: string;
        pseudo: string;
        kills: number;
      }[];
    }[];
  };
  
  // Détails des joueurs (kills totaux sur toutes les manches)
  playerStats?: {
    playerId: string;
    pseudo: string;
    kills: number;
  }[];
  
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
  averageKills: number;
  position: number;
  lastUpdated: Date;
}

export interface KillLeaderboardEntry {
  position: number;
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  
  killStats: {
    totalKills: number;
    gamesPlayed: number;
    averageKillsPerGame: number;
    bestSingleGame: number;
  };
  
  // Évolution du classement
  previousPosition?: number;
  positionChange?: 'up' | 'down' | 'same' | 'new';
}

// Statistiques globales par mode de jeu
export interface GameModeStats {
  gameMode: GameMode;
  tournamentId: string;
  
  // Statistiques générales
  totalParticipants: number;
  totalGames: number;
  totalKills: number;
  averageKillsPerGame: number;
  averagePointsPerGame: number;
  
  // Records
  records: {
    mostKillsSingleGame: {
      playerId: string;
      playerName: string;
      kills: number;
      gameId: string;
    };
    highestScore: {
      participantId: string;
      participantName: string;
      points: number;
      gameId: string;
    };
    longestKillStreak: {
      playerId: string;
      playerName: string;
      streak: number;
      gameId: string;
    };
  };
  
  lastUpdated: Date;
}

// Classement des killeurs par tournoi et mode
export interface TournamentKillLeaderboard {
  tournamentId: string;
  gameMode: GameMode;
  entries: KillLeaderboardEntry[];
  stats: {
    totalKills: number;
    averageKillsPerGame: number;
    topPlayerTotalKills: {
      playerId: string;
      playerName: string;
      kills: number;
      teamName: string;
    };
  };
  lastUpdated: Date;
}

// Gestion des phases de tournoi pour les modes multijoueur
export interface TournamentPhase {
  id: string;
  tournamentId: string;
  phaseType: 'group_stage' | 'elimination';
  phaseNumber: number; // 1 = phase de groupes, 2 = élimination, etc.
  status: 'pending' | 'active' | 'completed';
  startDate?: Date;
  endDate?: Date;
}

// Groupe pour la phase de groupes
export interface TournamentGroup {
  id: string;
  tournamentId: string;
  phaseId: string;
  groupName: string; // "Groupe A", "Groupe B", etc.
  teams: {
    teamId: string;
    teamName: string;
    points: number;
    wins: number;
    losses: number;
    kills: number;
    position: number; // Position dans le groupe
    qualified: boolean; // Qualifié pour la phase suivante
  }[];
  status: 'pending' | 'active' | 'completed';
}

// Match générique (pour tous types de phases)
export interface TournamentMatch {
  id: string;
  tournamentId: string;
  gameMode: GameMode;
  phaseType: 'group_stage' | 'elimination' | 'round_robin'; // Type de phase
  round?: number; // Pour élimination: 1 = premier tour, 2 = quarts, 3 = demis, 4 = finale
  matchNumber: number; // Numéro du match
  groupName?: string; // Pour phase de groupes: "Groupe A", "Groupe B", etc.
  isThirdPlaceMatch?: boolean; // Pour la petite finale (3ème place)
  
  // Équipes
  team1Id: string;
  team1Name: string;
  team2Id: string;
  team2Name: string;
  
  // Résultat
  winnerId?: string;
  winnerName?: string;
  loserId?: string;
  loserName?: string;
  status: 'pending' | 'in_progress' | 'completed';
  
  // Dates
  scheduledDate?: Date;
  completedDate?: Date;
  createdAt: Date;
  
  // Résultats détaillés du match
  matchResult?: {
    bestOf: 3 | 5;
    finalScore: string; // "2-1", "3-0", etc.
    team1Stats: {
      roundsWon: number;
      totalKills: number;
      playerStats: {
        playerId: string;
        pseudo: string;
        kills: number;
      }[];
    };
    team2Stats: {
      roundsWon: number;
      totalKills: number;
      playerStats: {
        playerId: string;
        pseudo: string;
        kills: number;
      }[];
    };
    rounds: {
      roundNumber: number;
      winnerId: string;
      team1Kills: number;
      team2Kills: number;
      duration?: number; // Durée en minutes
    }[];
  };
}

// Match dans un bracket d'élimination (alias pour compatibilité)
export type EliminationMatch = TournamentMatch;

// Utilitaires pour la migration
export interface MigrationData {
  tournament: Tournament;
  teams: TournamentTeam[];
  results: TournamentResult[];
}
