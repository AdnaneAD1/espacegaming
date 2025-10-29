// Types pour les différents modes de jeu Call of Duty Mobile

// Énumération des modes de jeu supportés
export enum GameMode {
  // Battle Royale
  BR_SQUAD = 'br_squad',    // 4 joueurs (mode actuel)
  BR_DUO = 'br_duo',        // 2 joueurs
  BR_SOLO = 'br_solo',      // 1 joueur
  
  // Multijoueur
  MP_1V1 = 'mp_1v1',        // 1 contre 1
  MP_2V2 = 'mp_2v2',        // 2 contre 2
  MP_5V5 = 'mp_5v5'         // 5 contre 5
}

// Configuration de chaque mode de jeu
export interface GameModeConfig {
  id: GameMode;
  name: string;
  displayName: string;
  description: string;
  category: 'battle_royale' | 'multiplayer';
  teamSize: number;
  minPlayers: number;
  maxPlayers: number;
  pointsSystem: GameModePointsSystem;
  settings: GameModeSettings;
}

// Système de points spécifique à chaque mode
export interface GameModePointsSystem {
  // Points par placement (pour BR) ou victoire (pour MP)
  placement: Record<number, number>;
  // Points par kill
  killPoints: number;
}

// Paramètres spécifiques au mode de jeu
export interface GameModeSettings {
  // Durée maximale d'une partie (en minutes)
  maxGameDuration: number;
  // Nombre de parties par équipe dans un tournoi
  gamesPerTeam: number;
  // Format du tournoi
  tournamentFormat: 'elimination' | 'round_robin' | 'swiss' | 'bracket' | 'groups_then_elimination' | 'groups_only';
  // Pour les modes multijoueur : format Best Of
  bestOf?: 3 | 5;
  // Configuration des phases de groupes (pour MJ)
  groupStage?: {
    enabled: boolean;
    teamsPerGroup: number; // Nombre d'équipes par groupe (calculé automatiquement)
    qualifiersPerGroup: 1 | 2; // Nombre d'équipes qui se qualifient par groupe
    roundRobinInGroup: boolean; // Chaque équipe joue contre toutes les autres du groupe
  };
  // Cartes/maps autorisées
  allowedMaps?: string[];
  // Règles spéciales
  specialRules?: string[];
}

// Résultat d'une partie selon le mode
export interface GameModeResult {
  id: string;
  tournamentId: string;
  gameMode: GameMode;
  gameNumber: number;
  
  // Participants (équipe ou joueur individuel)
  participants: GameParticipant[];
  
  // Informations de la partie
  gameInfo: {
    map?: string;
    duration: number; // en secondes
    startTime: Date;
    endTime: Date;
  };
  
  // Métadonnées
  timestamp: Date;
  createdBy: string; // ID de l'admin qui a saisi le résultat
}

// Participant à une partie (équipe ou joueur)
export interface GameParticipant {
  id: string; // teamId ou playerId
  name: string; // nom de l'équipe ou pseudo du joueur
  
  // Résultats de performance
  performance: {
    placement: number; // Position finale (1er, 2ème, etc.)
    kills: number;
    deaths?: number; // Pour les modes MP
    assists?: number; // Pour les modes MP
    damage?: number; // Dégâts infligés
    points: number; // Points calculés selon le système
  };
  
  // Détails des joueurs (pour les équipes)
  players?: PlayerPerformance[];
}

// Performance individuelle d'un joueur
export interface PlayerPerformance {
  playerId: string;
  pseudo: string;
  kills: number;
}

// Classement général par mode de jeu
export interface GameModeRanking {
  tournamentId: string;
  gameMode: GameMode;
  
  // Classement par équipe/joueur
  rankings: ParticipantRanking[];
  
  // Statistiques globales
  stats: {
    totalGames: number;
    totalParticipants: number;
    averageKills: number;
    topKiller: {
      id: string;
      name: string;
      kills: number;
    };
  };
  
  lastUpdated: Date;
}

// Classement d'un participant (équipe ou joueur)
export interface ParticipantRanking {
  participantId: string;
  participantName: string;
  participantType: 'team' | 'player';
  
  // Position dans le classement
  position: number;
  
  // Statistiques de performance
  stats: {
    totalPoints: number;
    totalKills: number;
    totalDeaths?: number;
    totalAssists?: number;
    gamesPlayed: number;
    wins: number;
    losses?: number;
    averagePoints: number;
    averageKills: number;
    bestPlacement: number;
    killDeathRatio?: number; // Pour les modes MP
  };
  
  // Historique des parties
  recentGames: string[]; // IDs des dernières parties
}

// Classement des meilleurs killeurs par mode
export interface KillLeaderboard {
  tournamentId: string;
  gameMode: GameMode;
  
  // Top killeurs
  topKillers: KillLeaderEntry[];
  
  // Statistiques
  stats: {
    totalKills: number;
    averageKillsPerGame: number;
    highestSingleGameKills: {
      playerId: string;
      playerName: string;
      kills: number;
      gameId: string;
    };
  };
  
  lastUpdated: Date;
}

// Entrée dans le classement des killeurs
export interface KillLeaderEntry {
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  
  // Statistiques de kills
  killStats: {
    totalKills: number;
    gamesPlayed: number;
    averageKillsPerGame: number;
    bestSingleGame: number;
    killStreak: number; // Plus longue série
  };
  
  // Position dans le classement
  position: number;
  previousPosition?: number; // Pour voir l'évolution
}

// Configuration complète des modes de jeu
export const GAME_MODES_CONFIG: Record<GameMode, GameModeConfig> = {
  [GameMode.BR_SQUAD]: {
    id: GameMode.BR_SQUAD,
    name: 'br_squad',
    displayName: 'Battle Royale Squad',
    description: 'Mode Battle Royale en équipe de 4 joueurs',
    category: 'battle_royale',
    teamSize: 4,
    minPlayers: 4,
    maxPlayers: 4,
    pointsSystem: {
      placement: {
        1: 25, 2: 20, 3: 17, 4: 15,
        5: 12, 6: 12, 7: 12, 8: 12, 9: 12, 10: 12,
        11: 10, 12: 10, 13: 10, 14: 10, 15: 10, 16: 10, 17: 10, 18: 10, 19: 10, 20: 10,
        21: 8, 22: 8, 23: 8, 24: 8, 25: 8, 26: 8, 27: 8, 28: 8, 29: 8, 30: 8,
        31: 5, 32: 5, 33: 5, 34: 5, 35: 5, 36: 5, 37: 5, 38: 5, 39: 5, 40: 5,
        41: 3, 42: 3, 43: 3, 44: 3, 45: 3, 46: 3, 47: 3, 48: 3, 49: 3, 50: 3
      },
      killPoints: 10 // Ancien système BR maintenu
    },
    settings: {
      maxGameDuration: 30,
      gamesPerTeam: 6,
      tournamentFormat: 'round_robin',
      allowedMaps: ['Blackout', 'Isolated', 'Alcatraz'],
      specialRules: ['Pas de véhicules aériens', 'FPP uniquement']
    }
  },
  
  [GameMode.BR_DUO]: {
    id: GameMode.BR_DUO,
    name: 'br_duo',
    displayName: 'Battle Royale Duo',
    description: 'Mode Battle Royale en équipe de 2 joueurs',
    category: 'battle_royale',
    teamSize: 2,
    minPlayers: 2,
    maxPlayers: 2,
    pointsSystem: {
      placement: {
        1: 30, 2: 25, 3: 20, 4: 17, 5: 15,
        6: 12, 7: 12, 8: 12, 9: 12, 10: 12,
        11: 10, 12: 10, 13: 10, 14: 10, 15: 10,
        16: 8, 17: 8, 18: 8, 19: 8, 20: 8,
        21: 5, 22: 5, 23: 5, 24: 5, 25: 5
      },
      killPoints: 12
    },
    settings: {
      maxGameDuration: 25,
      gamesPerTeam: 8,
      tournamentFormat: 'round_robin',
      allowedMaps: ['Blackout', 'Isolated'],
      specialRules: ['FPP uniquement']
    }
  },
  
  [GameMode.BR_SOLO]: {
    id: GameMode.BR_SOLO,
    name: 'br_solo',
    displayName: 'Battle Royale Solo',
    description: 'Mode Battle Royale en solo',
    category: 'battle_royale',
    teamSize: 1,
    minPlayers: 1,
    maxPlayers: 1,
    pointsSystem: {
      placement: {
        1: 35, 2: 30, 3: 25, 4: 22, 5: 20,
        6: 18, 7: 16, 8: 14, 9: 12, 10: 10,
        11: 8, 12: 8, 13: 8, 14: 8, 15: 8,
        16: 6, 17: 6, 18: 6, 19: 6, 20: 6,
        21: 4, 22: 4, 23: 4, 24: 4, 25: 4
      },
      killPoints: 15
    },
    settings: {
      maxGameDuration: 20,
      gamesPerTeam: 10,
      tournamentFormat: 'round_robin',
      allowedMaps: ['Blackout', 'Isolated'],
      specialRules: ['FPP uniquement', 'Pas de classes']
    }
  },
  
  [GameMode.MP_1V1]: {
    id: GameMode.MP_1V1,
    name: 'mp_1v1',
    displayName: 'Multijoueur 1v1',
    description: 'Duel en 1 contre 1',
    category: 'multiplayer',
    teamSize: 1,
    minPlayers: 1,
    maxPlayers: 1,
    pointsSystem: {
      placement: { 1: 50, 2: 20 }, // Victoire/Défaite
      killPoints: 5
    },
    settings: {
      maxGameDuration: 10,
      gamesPerTeam: 5,
      tournamentFormat: 'groups_then_elimination',
      bestOf: 3,
      groupStage: {
        enabled: true,
        teamsPerGroup: 4, // Sera calculé automatiquement
        qualifiersPerGroup: 2, // Les 2 premiers de chaque groupe
        roundRobinInGroup: true
      },
      allowedMaps: ['Nuketown', 'Crash', 'Firing Range'],
      specialRules: ['Pas de killstreaks', 'Armes limitées']
    }
  },
  
  [GameMode.MP_2V2]: {
    id: GameMode.MP_2V2,
    name: 'mp_2v2',
    displayName: 'Multijoueur 2v2',
    description: 'Combat en équipe de 2 contre 2',
    category: 'multiplayer',
    teamSize: 2,
    minPlayers: 2,
    maxPlayers: 2,
    pointsSystem: {
      placement: { 1: 40, 2: 15 }, // Victoire/Défaite
      killPoints: 8
    },
    settings: {
      maxGameDuration: 15,
      gamesPerTeam: 6,
      tournamentFormat: 'groups_then_elimination',
      bestOf: 5,
      groupStage: {
        enabled: true,
        teamsPerGroup: 4, // Sera calculé automatiquement
        qualifiersPerGroup: 2, // Les 2 premiers de chaque groupe
        roundRobinInGroup: true
      },
      allowedMaps: ['Nuketown', 'Crash', 'Firing Range', 'Shipment'],
      specialRules: ['Killstreaks autorisés']
    }
  },
  
  [GameMode.MP_5V5]: {
    id: GameMode.MP_5V5,
    name: 'mp_5v5',
    displayName: 'Multijoueur 5v5',
    description: 'Combat en équipe de 5 contre 5',
    category: 'multiplayer',
    teamSize: 5,
    minPlayers: 5,
    maxPlayers: 5,
    pointsSystem: {
      placement: { 1: 30, 2: 10 }, // Victoire/Défaite
      killPoints: 10
    },
    settings: {
      maxGameDuration: 20,
      gamesPerTeam: 4,
      tournamentFormat: 'groups_then_elimination',
      bestOf: 5,
      groupStage: {
        enabled: true,
        teamsPerGroup: 4, // Sera calculé automatiquement
        qualifiersPerGroup: 1, // Le premier de chaque groupe (plus compétitif)
        roundRobinInGroup: true
      },
      allowedMaps: ['Nuketown', 'Crash', 'Firing Range', 'Crossfire', 'Summit'],
      specialRules: ['Toutes armes autorisées', 'Killstreaks limités']
    }
  }
};

// Utilitaires pour les modes de jeu
export class GameModeUtils {
  
  // Obtenir la configuration d'un mode
  static getConfig(gameMode: GameMode): GameModeConfig {
    return GAME_MODES_CONFIG[gameMode];
  }
  
  // Obtenir tous les modes d'une catégorie
  static getModesByCategory(category: 'battle_royale' | 'multiplayer'): GameMode[] {
    return Object.values(GameMode).filter(mode => 
      GAME_MODES_CONFIG[mode].category === category
    );
  }
  
  // Calculer les points pour un résultat
  static calculatePoints(
    gameMode: GameMode, 
    placement: number, 
    kills: number
  ): number {
    const config = GAME_MODES_CONFIG[gameMode];
    const placementPoints = config.pointsSystem.placement[placement] || 0;
    const killPoints = kills * config.pointsSystem.killPoints;
    
    return placementPoints + killPoints;
  }
  
  // Vérifier si un mode nécessite des équipes
  static isTeamMode(gameMode: GameMode): boolean {
    const config = GAME_MODES_CONFIG[gameMode];
    return (config?.teamSize || 1) > 1;
  }
  
  // Obtenir le nom d'affichage d'un mode
  static getDisplayName(gameMode: GameMode): string {
    return GAME_MODES_CONFIG[gameMode]?.displayName || 'Mode inconnu';
  }
  
  // Obtenir la taille d'équipe requise
  static getTeamSize(gameMode: GameMode | undefined): number {
    // Pour les anciens tournois sans gameMode, retourner 4 (BR Squad par défaut)
    if (!gameMode) return 4;
    return GAME_MODES_CONFIG[gameMode]?.teamSize || 4;
  }
  
  // Obtenir le format Best Of pour les modes multijoueur
  static getBestOf(gameMode: GameMode): 3 | 5 | undefined {
    return GAME_MODES_CONFIG[gameMode]?.settings?.bestOf;
  }
  
  // Vérifier si un mode est en format Best Of
  static isBestOfMode(gameMode: GameMode): boolean {
    const config = GAME_MODES_CONFIG[gameMode];
    return config?.settings?.bestOf !== undefined;
  }
  
  // Vérifier si un mode utilise des phases de groupes
  static hasGroupStage(gameMode: GameMode): boolean {
    const config = GAME_MODES_CONFIG[gameMode];
    return config?.settings?.groupStage?.enabled === true;
  }

  // Vérifier si un mode est multijoueur
  static isMultiplayerMode(gameMode: GameMode): boolean {
    const config = GAME_MODES_CONFIG[gameMode];
    return config?.category === 'multiplayer';
  }
  
  // Calculer le nombre optimal d'équipes par groupe
  static calculateOptimalGroupSize(totalTeams: number, gameMode: GameMode): number {
    const config = GAME_MODES_CONFIG[gameMode];
    if (!config?.settings?.groupStage?.enabled) return totalTeams;
    
    // Logique pour calculer automatiquement la taille des groupes
    if (totalTeams <= 8) return 4; // 2 groupes de 4
    if (totalTeams <= 12) return 4; // 3 groupes de 4
    if (totalTeams <= 16) return 4; // 4 groupes de 4
    if (totalTeams <= 24) return 6; // 4 groupes de 6
    return Math.ceil(totalTeams / 4); // Maximum 4 groupes
  }
  
  // Calculer le nombre de groupes nécessaires
  static calculateNumberOfGroups(totalTeams: number, gameMode: GameMode): number {
    const groupSize = this.calculateOptimalGroupSize(totalTeams, gameMode);
    return Math.ceil(totalTeams / groupSize);
  }
  
  // Obtenir le nombre de qualifiés par groupe
  static getQualifiersPerGroup(gameMode: GameMode): 1 | 2 {
    const config = GAME_MODES_CONFIG[gameMode];
    return config?.settings?.groupStage?.qualifiersPerGroup || 1;
  }

  // Obtenir le format Best Of effectif (config personnalisée ou par défaut)
  static getEffectiveBestOf(gameMode: GameMode, customFormat?: { bestOf?: 3 | 5 }): 3 | 5 | undefined {
    if (customFormat?.bestOf) {
      return customFormat.bestOf;
    }
    return this.getBestOf(gameMode);
  }

  // Vérifier si le tournoi utilise des phases de groupes (config personnalisée ou par défaut)
  static hasEffectiveGroupStage(gameMode: GameMode, customFormat?: { 
    tournamentFormat: 'elimination_direct' | 'groups_then_elimination' | 'groups_only';
    groupStage?: { enabled: boolean };
  }): boolean {
    if (customFormat) {
      return customFormat.tournamentFormat !== 'elimination_direct' && 
             customFormat.groupStage?.enabled !== false;
    }
    return this.hasGroupStage(gameMode);
  }

  // Obtenir les formats disponibles pour un mode de jeu
  static getAvailableFormats(gameMode: GameMode): {
    label: string;
    value: 'elimination_direct' | 'groups_then_elimination' | 'groups_only';
    description: string;
  }[] {
    const formats: {
      label: string;
      value: 'elimination_direct' | 'groups_then_elimination' | 'groups_only';
      description: string;
    }[] = [
      {
        label: 'Élimination directe',
        value: 'elimination_direct',
        description: 'Bracket d\'élimination simple sans phases de groupes'
      }
    ];

    // Les modes multijoueur peuvent avoir des phases de groupes
    if (this.isMultiplayerMode(gameMode)) {
      formats.push(
        {
          label: 'Groupes puis élimination',
          value: 'groups_then_elimination',
          description: 'Phase de groupes suivie d\'un bracket d\'élimination'
        },
        {
          label: 'Groupes uniquement',
          value: 'groups_only',
          description: 'Seulement des phases de groupes, pas d\'élimination'
        }
      );
    }

    return formats;
  }

  // Obtenir les options Best Of disponibles pour un mode
  static getAvailableBestOf(gameMode: GameMode): { label: string; value: 3 | 5 }[] {
    if (!this.isMultiplayerMode(gameMode)) {
      return []; // Les modes BR n'ont pas de Best Of
    }

    return [
      { label: 'Best Of 3 (BO3)', value: 3 },
      { label: 'Best Of 5 (BO5)', value: 5 }
    ];
  }
}


