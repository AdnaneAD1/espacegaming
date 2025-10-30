import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  TournamentKillLeaderboard,
  KillLeaderboardEntry,
  TournamentResult
} from '@/types/tournament-multi';
import { GameMode } from '@/types/game-modes';

// Fonction utilitaire pour convertir les timestamps Firestore en Date
function convertTimestampToDate(timestamp: Date | Timestamp | null | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }
  return new Date();
}

export class KillLeaderboardService {
  
  // Mettre à jour le classement des killeurs après l'ajout d'un résultat
  static async updateKillLeaderboard(
    tournamentId: string, 
    gameMode: GameMode, 
    result: TournamentResult
  ): Promise<void> {
    try {
      // Mettre à jour les statistiques pour chaque joueur du résultat
      if (result.playerStats) {
        for (const playerStat of result.playerStats) {
          await this.updatePlayerKillStats(
            tournamentId,
            gameMode,
            playerStat.playerId,
            playerStat.pseudo,
            result.teamId,
            result.teamName,
            playerStat.kills
          );
        }
      } else {
        // Si pas de stats individuelles, utiliser les stats d'équipe
        // (pour les anciens résultats ou modes où on ne track pas individuellement)
        await this.updateTeamKillStats(
          tournamentId,
          gameMode,
          result.teamId,
          result.teamName,
          result.kills
        );
      }
      
      // Recalculer et sauvegarder le classement
      await this.recalculateLeaderboard(tournamentId, gameMode);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du classement des killeurs:', error);
      throw error;
    }
  }
  
  // Mettre à jour les statistiques d'un joueur individuel
  static async updatePlayerKillStats(
    tournamentId: string,
    gameMode: GameMode,
    playerId: string,
    playerName: string,
    teamId: string,
    teamName: string,
    kills: number
  ): Promise<void> {
    // ✅ Toujours comptabiliser le joueur, même avec 0 kill
    const playerStatsRef = doc(
      db, 
      `kill-leaderboards/modes/${gameMode}/${tournamentId}/players/${playerId}`
    );
    
    const playerDoc = await getDoc(playerStatsRef);
    
    if (playerDoc.exists()) {
      // Mettre à jour les stats existantes
      const currentStats = playerDoc.data();
      const newTotalKills = currentStats.killStats.totalKills + kills;
      const newGamesPlayed = currentStats.killStats.gamesPlayed + 1;
      
      await updateDoc(playerStatsRef, {
        'killStats.totalKills': newTotalKills,
        'killStats.gamesPlayed': newGamesPlayed,
        'killStats.averageKillsPerGame': newTotalKills / newGamesPlayed,
        'killStats.bestSingleGame': Math.max(currentStats.killStats.bestSingleGame, kills),
        lastUpdated: serverTimestamp()
      });
    } else {
      // Créer de nouvelles stats (même si kills = 0)
      const newEntry: Omit<KillLeaderboardEntry, 'position' | 'positionChange'> = {
        playerId,
        playerName,
        teamId,
        teamName,
        killStats: {
          totalKills: kills, // Peut être 0
          gamesPlayed: 1,
          averageKillsPerGame: kills, // Peut être 0
          bestSingleGame: kills // Peut être 0
        }
      };
      
      await setDoc(playerStatsRef, {
        ...newEntry,
        position: 0, // Sera recalculé
        lastUpdated: serverTimestamp()
      });
    }
  }
  
  // Mettre à jour les statistiques d'équipe (pour compatibilité)
  private static async updateTeamKillStats(
    tournamentId: string,
    gameMode: GameMode,
    teamId: string,
    teamName: string,
    kills: number
  ): Promise<void> {
    // Pour les modes équipe sans stats individuelles,
    // on peut créer une entrée "équipe" dans le classement
    const teamStatsRef = doc(
      db, 
      `kill-leaderboards/modes/${gameMode}/${tournamentId}/teams/${teamId}`
    );
    
    const teamDoc = await getDoc(teamStatsRef);
    
    if (teamDoc.exists()) {
      const currentStats = teamDoc.data();
      const newTotalKills = currentStats.killStats.totalKills + kills;
      const newGamesPlayed = currentStats.killStats.gamesPlayed + 1;
      
      await updateDoc(teamStatsRef, {
        'killStats.totalKills': newTotalKills,
        'killStats.gamesPlayed': newGamesPlayed,
        'killStats.averageKillsPerGame': newTotalKills / newGamesPlayed,
        'killStats.bestSingleGame': Math.max(currentStats.killStats.bestSingleGame, kills),
        lastUpdated: serverTimestamp()
      });
    } else {
      await setDoc(teamStatsRef, {
        teamId,
        teamName,
        killStats: {
          totalKills: kills,
          gamesPlayed: 1,
          averageKillsPerGame: kills,
          bestSingleGame: kills
        },
        position: 0,
        lastUpdated: serverTimestamp()
      });
    }
  }
  
  // Recalculer le classement complet
  static async recalculateLeaderboard(
    tournamentId: string, 
    gameMode: GameMode
  ): Promise<void> {
    // Récupérer tous les joueurs
    const playersQuery = query(
      collection(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/players`),
      orderBy('killStats.totalKills', 'desc'),
      orderBy('killStats.averageKillsPerGame', 'desc')
    );
    
    const playersSnapshot = await getDocs(playersQuery);
    const batch = writeBatch(db);
    
    let position = 1;
    let previousKills = -1;
    let actualPosition = 1;
    
    playersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const currentKills = data.killStats.totalKills;
      
      // Gérer les égalités
      if (currentKills !== previousKills) {
        position = actualPosition;
      }
      
      // Calculer le changement de position
      let positionChange: 'up' | 'down' | 'same' | 'new' = 'same';
      if (data.previousPosition === undefined) {
        positionChange = 'new';
      } else if (position < data.previousPosition) {
        positionChange = 'up';
      } else if (position > data.previousPosition) {
        positionChange = 'down';
      }
      
      // Mettre à jour la position
      batch.update(doc.ref, {
        previousPosition: data.position || position,
        position: position,
        positionChange: positionChange,
        lastUpdated: serverTimestamp()
      });
      
      previousKills = currentKills;
      actualPosition++;
    });
    
    await batch.commit();
    
    // Mettre à jour les statistiques globales du classement
    await this.updateLeaderboardStats(tournamentId, gameMode);
    
    // Mettre à jour les records globaux si nécessaire
    await this.updateGlobalRecordsIfNeeded(tournamentId, gameMode);
  }
  
  // Mettre à jour les statistiques globales du classement
  private static async updateLeaderboardStats(
    tournamentId: string, 
    gameMode: GameMode
  ): Promise<void> {
    const playersQuery = query(
      collection(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/players`)
    );
    
    const playersSnapshot = await getDocs(playersQuery);
    
    let totalKills = 0;
    let totalGames = 0;
    let topPlayerTotalKills = { playerId: '', playerName: '', kills: 0, teamName: '' };
    
    playersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalKills += data.killStats.totalKills;
      totalGames += data.killStats.gamesPlayed;
      
      // ✅ Record = Plus grand nombre total de kills d'un joueur pour ce mode
      if (data.killStats.totalKills > topPlayerTotalKills.kills) {
        topPlayerTotalKills = {
          playerId: data.playerId,
          playerName: data.playerName,
          kills: data.killStats.totalKills,
          teamName: data.teamName || ''
        };
      }
    });
    
    const leaderboardStatsRef = doc(
      db, 
      `kill-leaderboards/modes/${gameMode}/${tournamentId}/stats/global`
    );
    
    await setDoc(leaderboardStatsRef, {
      totalKills,
      averageKillsPerGame: totalGames > 0 ? totalKills / totalGames : 0,
      topPlayerTotalKills,  // ✅ Nouveau nom pour clarifier
      lastUpdated: serverTimestamp()
    });
  }
  
  // Récupérer le classement des killeurs
  static async getKillLeaderboard(
    tournamentId: string, 
    gameMode: GameMode
  ): Promise<TournamentKillLeaderboard> {
    try {
      // Récupérer les joueurs classés
      const playersQuery = query(
        collection(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/players`),
        orderBy('position', 'asc')
      );
      
      const playersSnapshot = await getDocs(playersQuery);
      const entries: KillLeaderboardEntry[] = playersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          position: data.position,
          playerId: data.playerId,
          playerName: data.playerName,
          teamId: data.teamId,
          teamName: data.teamName,
          killStats: data.killStats,
          previousPosition: data.previousPosition,
          positionChange: data.positionChange
        };
      });
      
      // Récupérer les statistiques globales
      const statsRef = doc(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/stats/global`);
      const statsDoc = await getDoc(statsRef);
      
      const stats = statsDoc.exists() ? statsDoc.data() : {
        totalKills: 0,
        averageKillsPerGame: 0,
        topPlayerTotalKills: {
          playerId: '',
          playerName: '',
          kills: 0,
          teamName: ''
        }
      };
      
      return {
        tournamentId,
        gameMode,
        entries,
        stats: {
          totalKills: stats.totalKills,
          averageKillsPerGame: stats.averageKillsPerGame,
          topPlayerTotalKills: stats.topPlayerTotalKills || stats.topSingleGameKills
        },
        lastUpdated: convertTimestampToDate(stats.lastUpdated)
      };
      
    } catch (error) {
      console.error('Erreur lors de la récupération du classement des killeurs:', error);
      throw error;
    }
  }
  
  // S'abonner aux changements du classement en temps réel
  static subscribeToKillLeaderboard(
    tournamentId: string,
    gameMode: GameMode,
    callback: (leaderboard: TournamentKillLeaderboard) => void
  ): () => void {
    const playersQuery = query(
      collection(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/players`),
      orderBy('position', 'asc')
    );
    
    return onSnapshot(playersQuery, async (snapshot) => {
      try {
        const entries: KillLeaderboardEntry[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            position: data.position,
            playerId: data.playerId,
            playerName: data.playerName,
            teamId: data.teamId,
            teamName: data.teamName,
            killStats: data.killStats,
            previousPosition: data.previousPosition,
            positionChange: data.positionChange
          };
        });
        
        // Récupérer les stats globales
        const statsRef = doc(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/stats/global`);
        const statsDoc = await getDoc(statsRef);
        
        const stats = statsDoc.exists() ? statsDoc.data() : {
          totalKills: 0,
          averageKillsPerGame: 0,
          topPlayerTotalKills: {
            playerId: '',
            playerName: '',
            kills: 0,
            teamName: ''
          }
        };
        
        const leaderboard: TournamentKillLeaderboard = {
          tournamentId,
          gameMode,
          entries,
          stats: {
            totalKills: stats.totalKills,
            averageKillsPerGame: stats.averageKillsPerGame,
            topPlayerTotalKills: stats.topPlayerTotalKills || stats.topSingleGameKills
          },
          lastUpdated: convertTimestampToDate(stats.lastUpdated)
        };
        
        callback(leaderboard);
      } catch (error) {
        console.error('Erreur dans l\'abonnement au classement des killeurs:', error);
      }
    });
  }
  
  // Obtenir le top N des killeurs pour un tournoi et mode
  static async getTopKillers(
    tournamentId: string,
    gameMode: GameMode,
    limit: number = 10
  ): Promise<KillLeaderboardEntry[]> {
    try {
      const playersQuery = query(
        collection(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/players`),
        orderBy('killStats.totalKills', 'desc'),
        orderBy('killStats.averageKillsPerGame', 'desc')
      );
      
      const snapshot = await getDocs(playersQuery);
      const entries: KillLeaderboardEntry[] = [];
      
      snapshot.docs.slice(0, limit).forEach((doc, index) => {
        const data = doc.data();
        entries.push({
          position: index + 1,
          playerId: data.playerId,
          playerName: data.playerName,
          teamId: data.teamId,
          teamName: data.teamName,
          killStats: data.killStats,
          previousPosition: data.previousPosition,
          positionChange: data.positionChange
        });
      });
      
      return entries;
    } catch (error) {
      console.error('Erreur lors de la récupération du top des killeurs:', error);
      throw error;
    }
  }
  
  // Supprimer toutes les données d'un tournoi pour un mode spécifique
  static async deleteTournamentLeaderboard(
    tournamentId: string,
    gameMode: GameMode
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Supprimer tous les joueurs
      const playersQuery = query(
        collection(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/players`)
      );
      const playersSnapshot = await getDocs(playersQuery);
      playersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Supprimer toutes les équipes (si elles existent)
      const teamsQuery = query(
        collection(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/teams`)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      teamsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Supprimer les stats globales
      const statsRef = doc(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/stats/global`);
      batch.delete(statsRef);
      
      await batch.commit();
      console.log(`Leaderboard supprimé pour le tournoi ${tournamentId} en mode ${gameMode}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du leaderboard:', error);
      throw error;
    }
  }
  
  // Mettre à jour les records globaux si nécessaire (appelé après chaque recalcul)
  private static async updateGlobalRecordsIfNeeded(
    tournamentId: string,
    gameMode: GameMode
  ): Promise<void> {
    try {
      // Récupérer le top 3 du tournoi actuel
      const playersQuery = query(
        collection(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/players`),
        orderBy('killStats.totalKills', 'desc')
      );
      const playersSnapshot = await getDocs(playersQuery);
      
      if (playersSnapshot.empty) return;
      
      // Récupérer les records globaux actuels
      const globalRecordsRef = doc(db, `kill-leaderboards/modes/${gameMode}/global-records`);
      const globalRecordsDoc = await getDoc(globalRecordsRef);
      
      const currentRecords = globalRecordsDoc.exists() ? globalRecordsDoc.data() : {
        topTotalKills: null,
        topAverageKills: null,
        topSingleGame: null
      };
      
      let needsUpdate = false;
      const updates: {
        topTotalKills?: KillLeaderboardEntry;
        topAverageKills?: KillLeaderboardEntry;
        topSingleGame?: KillLeaderboardEntry;
        lastUpdated: ReturnType<typeof serverTimestamp>;
      } = { lastUpdated: serverTimestamp() };
      
      // Initialiser avec les records actuels
      let bestTotalKills = currentRecords.topTotalKills;
      let bestAverageKills = currentRecords.topAverageKills;
      let bestSingleGame = currentRecords.topSingleGame;
      
      // Parcourir les joueurs du tournoi pour trouver de nouveaux records
      playersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const entry: KillLeaderboardEntry = {
          position: data.position,
          playerId: data.playerId,
          playerName: data.playerName,
          teamId: data.teamId,
          teamName: data.teamName,
          killStats: data.killStats,
          previousPosition: data.previousPosition,
          positionChange: data.positionChange
        };
        
        // Vérifier record de kills totaux
        if (!bestTotalKills || 
            entry.killStats.totalKills > bestTotalKills.killStats.totalKills) {
          bestTotalKills = entry;
          needsUpdate = true;
        }
        
        // Vérifier record de moyenne
        if (!bestAverageKills || 
            entry.killStats.averageKillsPerGame > bestAverageKills.killStats.averageKillsPerGame) {
          bestAverageKills = entry;
          needsUpdate = true;
        }
        
        // Vérifier record de meilleur match
        if (!bestSingleGame || 
            entry.killStats.bestSingleGame > bestSingleGame.killStats.bestSingleGame) {
          bestSingleGame = entry;
          needsUpdate = true;
        }
      });
      
      // Mettre à jour les records si nécessaire
      if (needsUpdate) {
        updates.topTotalKills = bestTotalKills;
        updates.topAverageKills = bestAverageKills;
        updates.topSingleGame = bestSingleGame;
      }
      
      // Mettre à jour si de nouveaux records ont été trouvés
      if (needsUpdate) {
        await setDoc(globalRecordsRef, updates, { merge: true });
        console.log(`✅ Records globaux mis à jour pour le mode ${gameMode}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des records globaux:', error);
      // Ne pas bloquer si la mise à jour des records échoue
    }
  }
  
  // Obtenir les records globaux pour un mode de jeu (lecture depuis Firestore)
  static async getGlobalRecordsByMode(
    gameMode: GameMode
  ): Promise<{
    topTotalKills: KillLeaderboardEntry | null;
    topAverageKills: KillLeaderboardEntry | null;
    topSingleGame: KillLeaderboardEntry | null;
  }> {
    try {
      // Lire directement depuis le document des records globaux
      const globalRecordsRef = doc(db, `kill-leaderboards/modes/${gameMode}/global-records`);
      const globalRecordsDoc = await getDoc(globalRecordsRef);
      
      if (!globalRecordsDoc.exists()) {
        // Aucun record pour ce mode encore
        return {
          topTotalKills: null,
          topAverageKills: null,
          topSingleGame: null
        };
      }
      
      const data = globalRecordsDoc.data();
      return {
        topTotalKills: data.topTotalKills || null,
        topAverageKills: data.topAverageKills || null,
        topSingleGame: data.topSingleGame || null
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des records globaux:', error);
      throw error;
    }
  }
  
  // Recalculer tous les records globaux pour un mode (utilitaire admin)
  static async recalculateAllGlobalRecords(gameMode: GameMode): Promise<void> {
    try {
      console.log(`🔄 Recalcul de tous les records globaux pour ${gameMode}...`);
      
      // Récupérer tous les tournois pour ce mode
      const tournamentsQuery = query(
        collection(db, `kill-leaderboards/modes/${gameMode}`)
      );
      const tournamentsSnapshot = await getDocs(tournamentsQuery);
      
      let topTotalKills: KillLeaderboardEntry | null = null;
      let topAverageKills: KillLeaderboardEntry | null = null;
      let topSingleGame: KillLeaderboardEntry | null = null;
      
      // Parcourir tous les tournois
      for (const tournamentDoc of tournamentsSnapshot.docs) {
        const tournamentId = tournamentDoc.id;
        
        // Ignorer le document global-records
        if (tournamentId === 'global-records') continue;
        
        // Récupérer tous les joueurs de ce tournoi
        const playersQuery = query(
          collection(db, `kill-leaderboards/modes/${gameMode}/${tournamentId}/players`)
        );
        const playersSnapshot = await getDocs(playersQuery);
        
        playersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const entry: KillLeaderboardEntry = {
            position: data.position,
            playerId: data.playerId,
            playerName: data.playerName,
            teamId: data.teamId,
            teamName: data.teamName,
            killStats: data.killStats,
            previousPosition: data.previousPosition,
            positionChange: data.positionChange
          };
          
          // Record de kills totaux
          if (!topTotalKills || entry.killStats.totalKills > topTotalKills.killStats.totalKills) {
            topTotalKills = entry;
          }
          
          // Record de moyenne de kills
          if (!topAverageKills || entry.killStats.averageKillsPerGame > topAverageKills.killStats.averageKillsPerGame) {
            topAverageKills = entry;
          }
          
          // Record de kills en un seul match
          if (!topSingleGame || entry.killStats.bestSingleGame > topSingleGame.killStats.bestSingleGame) {
            topSingleGame = entry;
          }
        });
      }
      
      // Sauvegarder les records globaux
      const globalRecordsRef = doc(db, `kill-leaderboards/modes/${gameMode}/global-records`);
      await setDoc(globalRecordsRef, {
        topTotalKills,
        topAverageKills,
        topSingleGame,
        lastUpdated: serverTimestamp()
      });
      
      console.log(`✅ Records globaux recalculés pour ${gameMode}`);
    } catch (error) {
      console.error('Erreur lors du recalcul des records globaux:', error);
      throw error;
    }
  }
}
