import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  DocumentData,
  UpdateData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  GameModeStats,
  TournamentResult
} from '@/types/tournament-multi';
import { GameMode, GameModeUtils } from '@/types/game-modes';

// Fonction utilitaire pour convertir les timestamps Firestore en Date
function convertTimestampToDate(timestamp: Date | Timestamp | null | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }
  return new Date();
}

export class GameModeStatsService {
  
  // Mettre à jour les statistiques d'un mode de jeu après l'ajout d'un résultat
  static async updateGameModeStats(
    tournamentId: string,
    gameMode: GameMode,
    result: TournamentResult
  ): Promise<void> {
    try {
      const statsRef = doc(db, `game-mode-stats/${tournamentId}/modes/${gameMode}`);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        await this.updateExistingStats(statsRef, statsDoc.data() as GameModeStats, result);
      } else {
        await this.createInitialStats(statsRef, tournamentId, gameMode, result);
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statistiques du mode de jeu:', error);
      throw error;
    }
  }
  
  // Mettre à jour les statistiques existantes
  private static async updateExistingStats(
    statsRef: DocumentReference<DocumentData>,
    currentStats: GameModeStats,
    result: TournamentResult
  ): Promise<void> {
    const newTotalGames = currentStats.totalGames + 1;
    const newTotalKills = currentStats.totalKills + result.kills;
    const newAverageKillsPerGame = newTotalKills / newTotalGames;
    const newAveragePointsPerGame = (currentStats.averagePointsPerGame * currentStats.totalGames + result.points) / newTotalGames;
    
    // Vérifier les nouveaux records
    const updates: UpdateData<DocumentData> = {
      totalGames: newTotalGames,
      totalKills: newTotalKills,
      averageKillsPerGame: newAverageKillsPerGame,
      averagePointsPerGame: newAveragePointsPerGame,
      lastUpdated: serverTimestamp()
    };
    
    // Record de kills en une partie
    if (result.kills > currentStats.records.mostKillsSingleGame.kills) {
      updates['records.mostKillsSingleGame'] = {
        playerId: result.playerStats?.[0]?.playerId || result.teamId,
        playerName: result.playerStats?.[0]?.pseudo || result.teamName,
        kills: result.kills,
        gameId: result.id
      };
    }
    
    // Record de score
    if (result.points > currentStats.records.highestScore.points) {
      updates['records.highestScore'] = {
        participantId: result.teamId,
        participantName: result.teamName,
        points: result.points,
        gameId: result.id
      };
    }
    
    // Record de série de kills - pour l'instant on utilise 0 car pas de bonus
    // Cette fonctionnalité pourra être ajoutée plus tard si nécessaire
    
    await updateDoc(statsRef, updates);
  }
  
  // Créer les statistiques initiales
  private static async createInitialStats(
    statsRef: DocumentReference<DocumentData>,
    tournamentId: string,
    gameMode: GameMode,
    result: TournamentResult
  ): Promise<void> {
    const initialStats: GameModeStats = {
      gameMode,
      tournamentId,
      totalParticipants: 1, // Sera recalculé
      totalGames: 1,
      totalKills: result.kills,
      averageKillsPerGame: result.kills,
      averagePointsPerGame: result.points,
      records: {
        mostKillsSingleGame: {
          playerId: result.playerStats?.[0]?.playerId || result.teamId,
          playerName: result.playerStats?.[0]?.pseudo || result.teamName,
          kills: result.kills,
          gameId: result.id
        },
        highestScore: {
          participantId: result.teamId,
          participantName: result.teamName,
          points: result.points,
          gameId: result.id
        },
        longestKillStreak: {
          playerId: result.playerStats?.[0]?.playerId || result.teamId,
          playerName: result.playerStats?.[0]?.pseudo || result.teamName,
          streak: 0, // Pas de bonus pour l'instant
          gameId: result.id
        }
      },
      lastUpdated: new Date()
    };
    
    await setDoc(statsRef, {
      ...initialStats,
      lastUpdated: serverTimestamp()
    });
    
    // Recalculer le nombre total de participants
    await this.recalculateTotalParticipants(tournamentId, gameMode);
  }
  
  // Recalculer le nombre total de participants uniques
  private static async recalculateTotalParticipants(
    tournamentId: string,
    gameMode: GameMode
  ): Promise<void> {
    try {
      // Récupérer tous les résultats pour ce tournoi et mode
      const resultsQuery = query(
        collection(db, `tournaments/${tournamentId}/results`),
        where('gameMode', '==', gameMode)
      );
      
      const resultsSnapshot = await getDocs(resultsQuery);
      const uniqueParticipants = new Set<string>();
      
      resultsSnapshot.docs.forEach(doc => {
        const result = doc.data();
        uniqueParticipants.add(result.teamId);
      });
      
      // Mettre à jour le nombre de participants
      const statsRef = doc(db, `game-mode-stats/${tournamentId}/modes/${gameMode}`);
      await updateDoc(statsRef, {
        totalParticipants: uniqueParticipants.size,
        lastUpdated: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Erreur lors du recalcul des participants:', error);
    }
  }
  
  // Récupérer les statistiques d'un mode de jeu
  static async getGameModeStats(
    tournamentId: string,
    gameMode: GameMode
  ): Promise<GameModeStats | null> {
    try {
      const statsRef = doc(db, `game-mode-stats/${tournamentId}/modes/${gameMode}`);
      const statsDoc = await getDoc(statsRef);
      
      if (!statsDoc.exists()) {
        return null;
      }
      
      const data = statsDoc.data();
      return {
        gameMode: data.gameMode,
        tournamentId: data.tournamentId,
        totalParticipants: data.totalParticipants,
        totalGames: data.totalGames,
        totalKills: data.totalKills,
        averageKillsPerGame: data.averageKillsPerGame,
        averagePointsPerGame: data.averagePointsPerGame,
        records: data.records,
        lastUpdated: convertTimestampToDate(data.lastUpdated)
      };
      
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du mode:', error);
      return null;
    }
  }
  
  // Récupérer les statistiques de tous les modes d'un tournoi
  static async getAllGameModeStats(tournamentId: string): Promise<GameModeStats[]> {
    try {
      const statsCollection = collection(db, `game-mode-stats/${tournamentId}/modes`);
      const snapshot = await getDocs(statsCollection);
      
      const stats: GameModeStats[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        stats.push({
          gameMode: data.gameMode,
          tournamentId: data.tournamentId,
          totalParticipants: data.totalParticipants,
          totalGames: data.totalGames,
          totalKills: data.totalKills,
          averageKillsPerGame: data.averageKillsPerGame,
          averagePointsPerGame: data.averagePointsPerGame,
          records: data.records,
          lastUpdated: convertTimestampToDate(data.lastUpdated)
        });
      });
      
      return stats;
      
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les statistiques:', error);
      return [];
    }
  }
  
  // S'abonner aux changements des statistiques en temps réel
  static subscribeToGameModeStats(
    tournamentId: string,
    gameMode: GameMode,
    callback: (stats: GameModeStats | null) => void
  ): () => void {
    const statsRef = doc(db, `game-mode-stats/${tournamentId}/modes/${gameMode}`);
    
    return onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const stats: GameModeStats = {
          gameMode: data.gameMode,
          tournamentId: data.tournamentId,
          totalParticipants: data.totalParticipants,
          totalGames: data.totalGames,
          totalKills: data.totalKills,
          averageKillsPerGame: data.averageKillsPerGame,
          averagePointsPerGame: data.averagePointsPerGame,
          records: data.records,
          lastUpdated: convertTimestampToDate(data.lastUpdated)
        };
        callback(stats);
      } else {
        callback(null);
      }
    });
  }
  
  // Obtenir un résumé comparatif de tous les modes d'un tournoi
  static async getTournamentModesSummary(tournamentId: string): Promise<{
    totalModes: number;
    totalGames: number;
    totalKills: number;
    totalParticipants: number;
    modeBreakdown: {
      gameMode: GameMode;
      displayName: string;
      games: number;
      kills: number;
      participants: number;
      topKiller: string;
      topScore: number;
    }[];
  }> {
    try {
      const allStats = await this.getAllGameModeStats(tournamentId);
      
      let totalGames = 0;
      let totalKills = 0;
      const allParticipants = new Set<string>();
      
      const modeBreakdown = allStats.map(stat => {
        totalGames += stat.totalGames;
        totalKills += stat.totalKills;
        
        return {
          gameMode: stat.gameMode,
          displayName: GameModeUtils.getDisplayName(stat.gameMode),
          games: stat.totalGames,
          kills: stat.totalKills,
          participants: stat.totalParticipants,
          topKiller: stat.records.mostKillsSingleGame.playerName,
          topScore: stat.records.highestScore.points
        };
      });
      
      return {
        totalModes: allStats.length,
        totalGames,
        totalKills,
        totalParticipants: allParticipants.size,
        modeBreakdown
      };
      
    } catch (error) {
      console.error('Erreur lors de la génération du résumé des modes:', error);
      return {
        totalModes: 0,
        totalGames: 0,
        totalKills: 0,
        totalParticipants: 0,
        modeBreakdown: []
      };
    }
  }
  
  // Réinitialiser les statistiques d'un mode (utile pour les tests)
  static async resetGameModeStats(
    tournamentId: string,
    gameMode: GameMode
  ): Promise<void> {
    try {
      const statsRef = doc(db, `game-mode-stats/${tournamentId}/modes/${gameMode}`);
      await setDoc(statsRef, {
        gameMode,
        tournamentId,
        totalParticipants: 0,
        totalGames: 0,
        totalKills: 0,
        averageKillsPerGame: 0,
        averagePointsPerGame: 0,
        records: {
          mostKillsSingleGame: {
            playerId: '',
            playerName: '',
            kills: 0,
            gameId: ''
          },
          highestScore: {
            participantId: '',
            participantName: '',
            points: 0,
            gameId: ''
          },
          longestKillStreak: {
            playerId: '',
            playerName: '',
            streak: 0,
            gameId: ''
          }
        },
        lastUpdated: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des statistiques:', error);
      throw error;
    }
  }
}
