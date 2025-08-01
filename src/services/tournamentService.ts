import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Tournament, 
  TournamentResult, 
  
  TournamentSettings 
} from '@/types/tournament-multi';
import { Team, Player } from '../types/index';
import { GameResult } from '../types/tournament';

// Fonction utilitaire pour convertir les timestamps Firestore en Date
function convertTimestampToDate(timestamp: Date | Timestamp | null | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }
  return new Date();
}

export class TournamentService {
  
  // Récupérer le tournoi actif
  static async getActiveTournament(): Promise<Tournament | null> {
    const q = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate(),
      deadline_register: data.deadline_register?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Tournament;
  }

  // Créer un nouveau tournoi
  static async createTournament(
    name: string, 
    description?: string,
    options?: {
      settings?: Partial<TournamentSettings>;
      startDate?: Date;
      endDate?: Date;
      deadline_register?: Date;
      date_result?: Date;
    }
  ): Promise<string> {
    const defaultSettings: TournamentSettings = {
      maxTeams: 25,
      maxGamesPerTeam: 3,
      pointsSystem: {
        placement: {
          1: 25,   // Top 1
          2: 20,   // Top 2  
          3: 17,   // Top 3
          4: 15,   // Top 4
          5: 12, 6: 12, 7: 12, 8: 12, 9: 12, 10: 12,  // Top 5-10
          11: 10, 12: 10, 13: 10, 14: 10, 15: 10, 16: 10, 17: 10, 18: 10, 19: 10, 20: 10,  // Top 11-20
          21: 8, 22: 8, 23: 8, 24: 8, 25: 8, 26: 8, 27: 8, 28: 8, 29: 8, 30: 8,  // Top 21-30
          31: 5, 32: 5, 33: 5, 34: 5, 35: 5, 36: 5, 37: 5, 38: 5, 39: 5, 40: 5,  // Top 31-40
          41: 3, 42: 3, 43: 3, 44: 3, 45: 3, 46: 3, 47: 3, 48: 3, 49: 3, 50: 3   // Top 41-50
        },
        killPoints: 10
      },
      registrationOpen: true,
      resultsVisible: false
    };

    const newTournament: Omit<Tournament, 'id'> = {
      name,
      description: description || '',
      status: 'draft',
      startDate: options?.startDate || new Date(),
      endDate: options?.endDate,
      deadline_register: options?.deadline_register,
      date_result: options?.date_result,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: { ...defaultSettings, ...options?.settings },
      stats: {
        totalTeams: 0,
        totalGames: 0,
        totalKills: 0,
        averagePointsPerGame: 0
      }
    };

    const docRef = await addDoc(collection(db, 'tournaments'), {
      ...newTournament,
      startDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  }

  // Supprimer un tournoi (seulement si statut draft)
  static async deleteTournament(tournamentId: string): Promise<void> {
    // Vérifier le statut du tournoi avant suppression
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) {
      throw new Error('Tournoi introuvable');
    }
    
    const tournamentData = tournamentDoc.data();
    if (tournamentData.status === 'active' || tournamentData.status === 'completed') {
      throw new Error('Impossible de supprimer un tournoi actif ou terminé');
    }

    const batch = writeBatch(db);

    // Supprimer toutes les équipes du tournoi
    const teamsSnapshot = await getDocs(collection(db, 'tournaments', tournamentId, 'teams'));
    teamsSnapshot.docs.forEach(teamDoc => {
      batch.delete(teamDoc.ref);
    });

    // Supprimer tous les résultats du tournoi
    const resultsSnapshot = await getDocs(collection(db, 'tournaments', tournamentId, 'results'));
    resultsSnapshot.docs.forEach(resultDoc => {
      batch.delete(resultDoc.ref);
    });

    // Supprimer le tournoi lui-même
    batch.delete(tournamentRef);

    await batch.commit();
  }

  // Activer un tournoi (désactive les autres)
  static async activateTournament(tournamentId: string): Promise<void> {
    const batch = writeBatch(db);

    // Désactiver tous les tournois actifs
    const activeQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active')
    );
    const activeSnapshot = await getDocs(activeQuery);
    
    activeSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        status: 'completed',
        updatedAt: serverTimestamp()
      });
    });

    // Activer le tournoi sélectionné
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    batch.update(tournamentRef, { 
      status: 'active',
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  }

  // Terminer un tournoi actif (le marquer comme completed)
  static async completeTournament(tournamentId: string): Promise<void> {
    // Vérifier que le tournoi existe et est actif
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) {
      throw new Error('Tournoi introuvable');
    }
    
    const tournamentData = tournamentDoc.data();
    if (tournamentData.status !== 'active') {
      throw new Error('Seuls les tournois actifs peuvent être terminés');
    }

    // Marquer le tournoi comme terminé
    await updateDoc(tournamentRef, {
      status: 'completed',
      endDate: new Date(), // Fixer la date de fin au moment de la completion
      updatedAt: serverTimestamp()
    });
  }

  // Migration des données existantes
  static async migrateExistingData(tournamentName: string): Promise<string> {
    console.log('🔄 Début de la migration des données existantes...');

    try {
      // 1. Créer le nouveau tournoi
      const tournamentId = await this.createTournament(
        tournamentName,
        'Tournoi migré depuis l\'ancienne structure'
      );

      console.log(`✅ Tournoi créé avec l'ID: ${tournamentId}`);

      // 1.5. Marquer le tournoi comme terminé avec la date exacte (26 juillet 2025 à 23h)
      const tournamentDate = new Date('2025-07-26T23:00:00+02:00'); // 26 juillet 2025 à 23h (heure française)
      const deadlineRegister = new Date('2025-07-24T23:59:00+02:00'); // 24 juillet 2025 à 23h59 (heure française)
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        status: 'completed',
        startDate: tournamentDate,
        endDate: tournamentDate, // Même date pour un tournoi d'une soirée
        deadline_register: deadlineRegister,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Tournoi marqué comme terminé (historique) avec date: 26 juillet 2025 à 23h et deadline inscription: 24 juillet 2025 à 23h59');

      // 2. Migrer les équipes
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      const batch = writeBatch(db);
      let teamCount = 0;
      
      // Créer une correspondance entre anciens et nouveaux IDs d'équipes
      const teamIdMapping: { [oldId: string]: string } = {};

      teamsSnapshot.docs.forEach(teamDoc => {
        const teamData = teamDoc.data() as Team;
        
        // Ne migrer que les équipes validées
        if (teamData.status !== 'validated') {
          return;
        }
        // Fonction pour nettoyer les champs undefined des joueurs
        const cleanPlayer = (player: Player): Player => {
          const cleanedPlayer: Player = {
            id: player.id,
            pseudo: player.pseudo,
            country: player.country,
            whatsapp: player.whatsapp,
            deviceCheckVideo: player.deviceCheckVideo,
            status: player.status,
            joinedAt: convertTimestampToDate(player.joinedAt)
          };
          
          if (player.validatedAt) cleanedPlayer.validatedAt = convertTimestampToDate(player.validatedAt);
          if (player.rejectedAt) cleanedPlayer.rejectedAt = convertTimestampToDate(player.rejectedAt);
          if (player.rejectionReason) cleanedPlayer.rejectionReason = player.rejectionReason;
          if (player.isCaptain !== undefined) cleanedPlayer.isCaptain = player.isCaptain;
          
          return cleanedPlayer;
        };

        const tournamentTeam: Partial<Team & { tournamentId: string }> = {
          tournamentId,
          name: teamData.name,
          code: teamData.code,
          captain: cleanPlayer(teamData.captain),
          players: teamData.players.map(cleanPlayer),
          status: teamData.status,
          createdAt: convertTimestampToDate(teamData.createdAt),
          updatedAt: convertTimestampToDate(teamData.updatedAt)
        };
        
        if (teamData.validatedAt) {
          tournamentTeam.validatedAt = convertTimestampToDate(teamData.validatedAt);
        }
        if (teamData.fcmToken) {
          tournamentTeam.fcmToken = teamData.fcmToken;
        }

        const newTeamRef = doc(collection(db, 'tournaments', tournamentId, 'teams'));
        batch.set(newTeamRef, {
          ...tournamentTeam,
          registrationDate: teamData.createdAt || serverTimestamp()
        });
        
        // Enregistrer la correspondance ancien ID -> nouveau ID
        teamIdMapping[teamDoc.id] = newTeamRef.id;
        teamCount++;
      });

      // 3. Migrer les résultats
      const resultsSnapshot = await getDocs(collection(db, 'tournament-results'));
      let resultCount = 0;
      let gameNumber = 1;

      resultsSnapshot.docs.forEach(resultDoc => {
        const resultData = resultDoc.data() as GameResult;
        
        // Utiliser la correspondance pour obtenir le bon teamId
        const newTeamId = teamIdMapping[resultData.teamId] || resultData.teamId;
        
        // Calculer les points selon le nouveau système
        const placementPoints = this.calculatePlacementPoints(resultData.placement);
        const killPoints = resultData.kills * 10; // Correction: 10 points par kill
        const totalPoints = placementPoints + killPoints;

        const newResult: Omit<TournamentResult, 'id'> = {
          tournamentId,
          gameNumber: gameNumber++,
          teamId: newTeamId, // Utiliser le nouveau ID
          teamName: resultData.teamName || 'Équipe inconnue',
          placement: resultData.placement,
          kills: resultData.kills,
          points: totalPoints,
          timestamp: convertTimestampToDate(resultData.timestamp)
        };

        const newResultRef = doc(collection(db, 'tournaments', tournamentId, 'results'));
        batch.set(newResultRef, {
          ...newResult,
          timestamp: resultData.timestamp || serverTimestamp()
        });
        resultCount++;
      });

      await batch.commit();

      // 4. Activer le tournoi migré
      // await this.activateTournament(tournamentId);

      // 5. Mettre à jour les statistiques
      await this.updateTournamentStats(tournamentId);

      console.log(`✅ Migration terminée:`);
      console.log(`   - ${teamCount} équipes migrées`);
      console.log(`   - ${resultCount} résultats migrés`);
      console.log(`   - Tournoi activé: ${tournamentId}`);

      return tournamentId;

    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      throw error;
    }
  }

  // Calculer les points de placement
  private static calculatePlacementPoints(placement: number): number {
    const pointsMap: Record<number, number> = {
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
    return pointsMap[placement] || 0;
  }

  // Mettre à jour les statistiques du tournoi
  static async updateTournamentStats(tournamentId: string): Promise<void> {
    const teamsSnapshot = await getDocs(collection(db, 'tournaments', tournamentId, 'teams'));
    const resultsSnapshot = await getDocs(collection(db, 'tournaments', tournamentId, 'results'));

    const totalTeams = teamsSnapshot.size;
    const totalGames = resultsSnapshot.size;
    let totalKills = 0;
    let totalPoints = 0;

    resultsSnapshot.docs.forEach(doc => {
      const result = doc.data() as TournamentResult;
      totalKills += result.kills;
      totalPoints += result.points;
    });

    const averagePointsPerGame = totalGames > 0 ? totalPoints / totalGames : 0;

    await updateDoc(doc(db, 'tournaments', tournamentId), {
      'stats.totalTeams': totalTeams,
      'stats.totalGames': totalGames,
      'stats.totalKills': totalKills,
      'stats.averagePointsPerGame': averagePointsPerGame,
      updatedAt: serverTimestamp()
    });
  }

  // Récupérer tous les tournois pour l'historique
  static async getAllTournaments(): Promise<Tournament[]> {
    const q = query(
      collection(db, 'tournaments'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate(),
        deadline_register: data.deadline_register?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Tournament;
    });
  }

  // Écouter les changements du tournoi actif
  static subscribeToActiveTournament(callback: (tournament: Tournament | null) => void) {
    const q = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      const tournament: Tournament = {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate(),
        deadline_register: data.deadline_register?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Tournament;

      callback(tournament);
    });
  }
}
