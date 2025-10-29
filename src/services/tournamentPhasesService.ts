import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  TournamentPhase,
  TournamentGroup,
  EliminationMatch,
  TournamentTeam
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

export class TournamentPhasesService {
  
  // Générer automatiquement les phases de groupes
  static async generateGroupStage(
    tournamentId: string,
    gameMode: GameMode,
    teams: TournamentTeam[]
  ): Promise<string> {
    try {
      // Vérifier si le mode supporte les phases de groupes
      if (!GameModeUtils.hasGroupStage(gameMode)) {
        throw new Error('Ce mode de jeu ne supporte pas les phases de groupes');
      }
      
      // Calculer la répartition optimale
      const totalTeams = teams.length;
      const groupSize = GameModeUtils.calculateOptimalGroupSize(totalTeams, gameMode);
      const numberOfGroups = GameModeUtils.calculateNumberOfGroups(totalTeams, gameMode);
      
      // Créer la phase de groupes
      const phaseId = `${tournamentId}_group_stage`;
      const phase: TournamentPhase = {
        id: phaseId,
        tournamentId,
        phaseType: 'group_stage',
        phaseNumber: 1,
        status: 'pending',
        startDate: new Date()
      };
      
      await setDoc(doc(db, `tournament-phases/${phaseId}`), {
        ...phase,
        startDate: serverTimestamp()
      });
      
      // Mélanger les équipes aléatoirement
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      
      // Créer les groupes
      const batch = writeBatch(db);
      const groups: TournamentGroup[] = [];
      
      for (let i = 0; i < numberOfGroups; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, D...
        const groupTeams = shuffledTeams.slice(i * groupSize, (i + 1) * groupSize);
        
        const group: TournamentGroup = {
          id: `${phaseId}_group_${groupName}`,
          tournamentId,
          phaseId,
          groupName: `Groupe ${groupName}`,
          teams: groupTeams.map(team => ({
            teamId: team.id,
            teamName: team.name,
            points: 0,
            wins: 0,
            losses: 0,
            kills: 0,
            position: 0,
            qualified: false
          })),
          status: 'pending'
        };
        
        groups.push(group);
        batch.set(doc(db, `tournament-groups/${group.id}`), group);
      }
      
      await batch.commit();
      
      console.log(`Phase de groupes générée: ${numberOfGroups} groupes de ${groupSize} équipes`);
      return phaseId;
      
    } catch (error) {
      console.error('Erreur lors de la génération des phases de groupes:', error);
      throw error;
    }
  }
  
  // Calculer les classements dans un groupe
  static async updateGroupRankings(groupId: string): Promise<void> {
    try {
      const groupDoc = await getDoc(doc(db, `tournament-groups/${groupId}`));
      if (!groupDoc.exists()) return;
      
      const group = groupDoc.data() as TournamentGroup;
      
      // Trier les équipes par points, puis par kills
      const sortedTeams = [...group.teams].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.kills - a.kills;
      });
      
      // Mettre à jour les positions
      sortedTeams.forEach((team, index) => {
        team.position = index + 1;
      });
      
      // Marquer les équipes qualifiées
      const qualifiersPerGroup = GameModeUtils.getQualifiersPerGroup(
        group.tournamentId.split('_')[0] as GameMode // Approximation, à améliorer
      );
      
      sortedTeams.forEach((team, index) => {
        team.qualified = index < qualifiersPerGroup;
      });
      
      // Sauvegarder les changements
      await updateDoc(doc(db, `tournament-groups/${groupId}`), {
        teams: sortedTeams
      });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des classements:', error);
      throw error;
    }
  }
  
  // Finaliser la phase de groupes et générer les qualifiés
  static async finalizeGroupStage(tournamentId: string): Promise<TournamentTeam[]> {
    try {
      // Récupérer tous les groupes du tournoi
      const groupsQuery = query(
        collection(db, 'tournament-groups'),
        where('tournamentId', '==', tournamentId)
      );
      
      const groupsSnapshot = await getDocs(groupsQuery);
      const qualifiedTeams: TournamentTeam[] = [];
      
      // Collecter les équipes qualifiées de chaque groupe
      groupsSnapshot.docs.forEach(doc => {
        const group = doc.data() as TournamentGroup;
        const qualified = group.teams.filter(team => team.qualified);
        
        qualified.forEach(team => {
          qualifiedTeams.push({
            id: team.teamId,
            name: team.teamName,
            // Autres propriétés à compléter selon le type TournamentTeam
          } as TournamentTeam);
        });
      });
      
      // Marquer la phase de groupes comme terminée
      const phaseId = `${tournamentId}_group_stage`;
      await updateDoc(doc(db, `tournament-phases/${phaseId}`), {
        status: 'completed',
        endDate: serverTimestamp()
      });
      
      console.log(`Phase de groupes terminée: ${qualifiedTeams.length} équipes qualifiées`);
      return qualifiedTeams;
      
    } catch (error) {
      console.error('Erreur lors de la finalisation de la phase de groupes:', error);
      throw error;
    }
  }
  
  // Générer le bracket d'élimination
  static async generateEliminationBracket(
    tournamentId: string,
    gameMode: GameMode,
    qualifiedTeams: TournamentTeam[]
  ): Promise<string> {
    try {
      const phaseId = `${tournamentId}_elimination`;
      
      // Créer la phase d'élimination
      const phase: TournamentPhase = {
        id: phaseId,
        tournamentId,
        phaseType: 'elimination',
        phaseNumber: 2,
        status: 'pending',
        startDate: new Date()
      };
      
      await setDoc(doc(db, `tournament-phases/${phaseId}`), {
        ...phase,
        startDate: serverTimestamp()
      });
      
      // Mélanger les équipes pour le bracket
      const shuffledTeams = [...qualifiedTeams].sort(() => Math.random() - 0.5);
      
      // Générer les matches du premier tour
      const batch = writeBatch(db);
      const matches: EliminationMatch[] = [];
      
      for (let i = 0; i < shuffledTeams.length; i += 2) {
        if (i + 1 < shuffledTeams.length) {
          const match: EliminationMatch = {
            id: `${phaseId}_r1_m${Math.floor(i / 2) + 1}`,
            tournamentId,
            gameMode,
            phaseType: 'elimination',
            round: 1,
            matchNumber: Math.floor(i / 2) + 1,
            team1Id: shuffledTeams[i].id,
            team1Name: shuffledTeams[i].name,
            team2Id: shuffledTeams[i + 1].id,
            team2Name: shuffledTeams[i + 1].name,
            status: 'pending',
            createdAt: new Date()
          };
          
          matches.push(match);
          batch.set(doc(db, `elimination-matches/${match.id}`), match);
        }
      }
      
      await batch.commit();
      
      console.log(`Bracket d'élimination généré: ${matches.length} matches au premier tour`);
      return phaseId;
      
    } catch (error) {
      console.error('Erreur lors de la génération du bracket:', error);
      throw error;
    }
  }
  
  // Enregistrer le résultat d'un match d'élimination
  static async recordEliminationResult(
    matchId: string,
    winnerId: string,
    matchResult: {
      bestOf: 3 | 5;
      team1RoundsWon: number;
      team2RoundsWon: number;
      rounds: {
        roundNumber: number;
        winnerId: string;
        team1Kills: number;
        team2Kills: number;
        playerStats: {
          playerId: string;
          pseudo: string;
          teamId: string;
          kills: number;
        }[];
      }[];
    }
  ): Promise<void> {
    try {
      const matchDoc = await getDoc(doc(db, `elimination-matches/${matchId}`));
      if (!matchDoc.exists()) {
        throw new Error('Match non trouvé');
      }
      
      const match = matchDoc.data() as EliminationMatch;
      const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;
      const winnerName = winnerId === match.team1Id ? match.team1Name : match.team2Name;
      const loserName = winnerId === match.team1Id ? match.team2Name : match.team1Name;
      
      // Mettre à jour le match
      await updateDoc(doc(db, `elimination-matches/${matchId}`), {
        winnerId,
        winnerName,
        loserId,
        loserName,
        status: 'completed',
        completedDate: serverTimestamp(),
        matchResult
      });
      
      // Générer le match suivant si nécessaire
      await this.generateNextRoundMatch(match, winnerId, winnerName);
      
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du résultat:', error);
      throw error;
    }
  }
  
  // Générer le match du tour suivant
  private static async generateNextRoundMatch(
    completedMatch: EliminationMatch,
    winnerId: string,
    winnerName: string
  ): Promise<void> {
    try {
      // Logique pour déterminer le prochain match
      if (!completedMatch.round) {
        throw new Error('Le match n\'a pas de numéro de round');
      }
      
      const nextRound = completedMatch.round + 1;
      const nextMatchNumber = Math.ceil(completedMatch.matchNumber / 2);
      const nextMatchId = `elimination_r${nextRound}_m${nextMatchNumber}`;
      
      // Vérifier si le match suivant existe déjà
      const nextMatchDoc = await getDoc(doc(db, `elimination-matches/${nextMatchId}`));
      
      if (nextMatchDoc.exists()) {
        // Le match existe, ajouter le gagnant
        const nextMatch = nextMatchDoc.data() as EliminationMatch;
        
        if (!nextMatch.team1Id) {
          await updateDoc(doc(db, `elimination-matches/${nextMatchId}`), {
            team1Id: winnerId,
            team1Name: winnerName
          });
        } else if (!nextMatch.team2Id) {
          await updateDoc(doc(db, `elimination-matches/${nextMatchId}`), {
            team2Id: winnerId,
            team2Name: winnerName
          });
        }
      } else {
        // Créer le nouveau match
        const newMatch: EliminationMatch = {
          id: nextMatchId,
          tournamentId: completedMatch.tournamentId,
          gameMode: completedMatch.gameMode,
          phaseType: 'elimination',
          round: nextRound,
          matchNumber: nextMatchNumber,
          team1Id: winnerId,
          team1Name: winnerName,
          team2Id: '',
          team2Name: '',
          status: 'pending',
          createdAt: new Date()
        };
        
        await setDoc(doc(db, `elimination-matches/${nextMatchId}`), newMatch);
      }
      
    } catch (error) {
      console.error('Erreur lors de la génération du match suivant:', error);
      throw error;
    }
  }
  
  // Récupérer toutes les phases d'un tournoi
  static async getTournamentPhases(tournamentId: string): Promise<TournamentPhase[]> {
    try {
      const phasesQuery = query(
        collection(db, 'tournament-phases'),
        where('tournamentId', '==', tournamentId),
        orderBy('phaseNumber', 'asc')
      );
      
      const snapshot = await getDocs(phasesQuery);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        startDate: convertTimestampToDate(doc.data().startDate),
        endDate: convertTimestampToDate(doc.data().endDate)
      } as TournamentPhase));
      
    } catch (error) {
      console.error('Erreur lors de la récupération des phases:', error);
      return [];
    }
  }
  
  // Récupérer tous les groupes d'un tournoi
  static async getTournamentGroups(tournamentId: string): Promise<TournamentGroup[]> {
    try {
      const groupsQuery = query(
        collection(db, 'tournament-groups'),
        where('tournamentId', '==', tournamentId)
      );
      
      const snapshot = await getDocs(groupsQuery);
      return snapshot.docs.map(doc => doc.data() as TournamentGroup);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes:', error);
      return [];
    }
  }
  
  // Récupérer tous les matches d'élimination d'un tournoi
  static async getEliminationMatches(tournamentId: string): Promise<EliminationMatch[]> {
    try {
      const matchesQuery = query(
        collection(db, 'elimination-matches'),
        where('tournamentId', '==', tournamentId),
        orderBy('round', 'asc'),
        orderBy('matchNumber', 'asc')
      );
      
      const snapshot = await getDocs(matchesQuery);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        scheduledDate: convertTimestampToDate(doc.data().scheduledDate),
        completedDate: convertTimestampToDate(doc.data().completedDate)
      } as EliminationMatch));
      
    } catch (error) {
      console.error('Erreur lors de la récupération des matches:', error);
      return [];
    }
  }
}
