import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TournamentMatch, TournamentTeam, PlayInTeamStats, PlayInResult, PlayInConfig } from '@/types/tournament-multi';
import { GameMode } from '@/types/game-modes';

export class PlayInService {
  
  /**
   * Calculer la structure du play-in basée sur le nombre d'équipes
   */
  static calculatePlayInStructure(totalTeams: number): PlayInConfig {
    // Trouver la puissance de 2 inférieure
    const targetBracketSize = Math.pow(2, Math.floor(Math.log2(totalTeams)));
    const teamsToEliminate = totalTeams - targetBracketSize;
    
    // Si déjà puissance de 2, pas de play-in
    if (teamsToEliminate === 0) {
      return {
        enabled: false,
        totalTeams,
        targetBracketSize,
        blocATeams: 0,
        blocBTeams: 0,
        qualifiersFromBlocA: 0,
        qualifiersFromBlocB: 0,
        directQualifiers: 0,
        wildcardsNeeded: 0
      };
    }
    
    // Diviser en blocs : Bloc B max 3 équipes (poule round-robin)
    // Bloc A doit avoir un nombre PAIR d'équipes pour les matchs simples
    let blocBTeams = Math.min(3, teamsToEliminate);
    let blocATeams = totalTeams - blocBTeams;
    
    // Si Bloc A a un nombre impair, déplacer une équipe du Bloc B vers Bloc A
    if (blocATeams % 2 !== 0 && blocBTeams > 0) {
      blocATeams += 1;
      blocBTeams -= 1;
    }
    
    // Calculer les qualifiés
    const qualifiersFromBlocA = Math.floor(blocATeams / 2);
    const qualifiersFromBlocB = blocBTeams > 0 ? 1 : 0;
    const directQualifiers = qualifiersFromBlocA + qualifiersFromBlocB;
    const wildcardsNeeded = Math.max(0, targetBracketSize - directQualifiers);
    
    return {
      enabled: teamsToEliminate > 0,
      totalTeams,
      targetBracketSize,
      blocATeams,
      blocBTeams,
      qualifiersFromBlocA,
      qualifiersFromBlocB,
      directQualifiers,
      wildcardsNeeded
    };
  }
  
  /**
   * Générer le play-in complet (Bloc A + Bloc B)
   * Crée uniquement les matchs, pas de collection séparée
   */
  static async generatePlayIn(
    tournamentId: string,
    gameMode: GameMode,
    teams: TournamentTeam[]
  ): Promise<{
    blocAMatches: number;
    blocBMatches: number;
    totalMatches: number;
  }> {
    try {
      const structure = this.calculatePlayInStructure(teams.length);
      
      if (!structure.enabled) {
        console.log('✅ Nombre d\'équipes = puissance de 2, pas de play-in');
        return {
          blocAMatches: 0,
          blocBMatches: 0,
          totalMatches: 0
        };
      }
      
      // Mélanger les équipes
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      
      // Diviser en blocs
      const blocATeams = shuffledTeams.slice(0, structure.blocATeams);
      const blocBTeams = shuffledTeams.slice(structure.blocATeams);
      
      // Générer les matchs
      const batch = writeBatch(db);
      const matchesRef = collection(db, `tournaments/${tournamentId}/matches`);
      
      let totalMatches = 0;
      
      // BLOC A : Matchs simples
      console.log(`📍 Bloc A: ${structure.blocATeams} équipes → ${structure.qualifiersFromBlocA} matchs`);
      const blocAMatches = this.generateBlocAMatches(
        blocATeams,
        tournamentId,
        gameMode,
        batch,
        matchesRef
      );
      totalMatches += blocAMatches;
      
      // BLOC B : Poule round-robin
      console.log(`📍 Bloc B: ${structure.blocBTeams} équipes → poule round-robin`);
      const blocBMatches = this.generateBlocBMatches(
        blocBTeams,
        tournamentId,
        gameMode,
        batch,
        matchesRef
      );
      totalMatches += blocBMatches;
      
      await batch.commit();
      
      console.log(`✅ Play-in généré: ${blocAMatches} matchs Bloc A + ${blocBMatches} matchs Bloc B = ${totalMatches} total`);
      
      return {
        blocAMatches,
        blocBMatches,
        totalMatches
      };
      
    } catch (error) {
      console.error('Erreur lors de la génération du play-in:', error);
      throw error;
    }
  }
  
  /**
   * Générer les matchs du Bloc A (matchs simples)
   */
  private static generateBlocAMatches(
    teams: TournamentTeam[],
    tournamentId: string,
    gameMode: GameMode,
    batch: ReturnType<typeof writeBatch>,
    matchesRef: ReturnType<typeof collection>
  ): number {
    let matchNumber = 1;
    
    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        const matchData: Omit<TournamentMatch, 'id'> = {
          tournamentId,
          gameMode,
          phaseType: 'play_in',
          blocType: 'A',
          round: 1,
          matchNumber,
          team1Id: teams[i].id,
          team1Name: teams[i].name,
          team2Id: teams[i + 1].id,
          team2Name: teams[i + 1].name,
          status: 'pending',
          createdAt: new Date()
        };
        
        const newMatchRef = doc(matchesRef);
        batch.set(newMatchRef, {
          ...matchData,
          createdAt: serverTimestamp()
        });
        
        matchNumber++;
      }
    }
    
    return Math.floor(teams.length / 2);
  }
  
  /**
   * Générer les matchs du Bloc B (poule round-robin)
   */
  private static generateBlocBMatches(
    teams: TournamentTeam[],
    tournamentId: string,
    gameMode: GameMode,
    batch: ReturnType<typeof writeBatch>,
    matchesRef: ReturnType<typeof collection>
  ): number {
    let matchNumber = 1;
    
    // Poule round-robin : chaque équipe joue les autres
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const matchData: Omit<TournamentMatch, 'id'> = {
          tournamentId,
          gameMode,
          phaseType: 'play_in',
          blocType: 'B',
          round: 1,
          matchNumber,
          team1Id: teams[i].id,
          team1Name: teams[i].name,
          team2Id: teams[j].id,
          team2Name: teams[j].name,
          status: 'pending',
          createdAt: new Date()
        };
        
        const newMatchRef = doc(matchesRef);
        batch.set(newMatchRef, {
          ...matchData,
          createdAt: serverTimestamp()
        });
        
        matchNumber++;
      }
    }
    
    return (teams.length * (teams.length - 1)) / 2;
  }
  
  /**
   * Calculer les statistiques du play-in
   */
  static async calculatePlayInStats(tournamentId: string): Promise<PlayInTeamStats[]> {
    try {
      const matchesQuery = query(
        collection(db, `tournaments/${tournamentId}/matches`),
        where('phaseType', '==', 'play_in')
      );
      
      const snapshot = await getDocs(matchesQuery);
      const statsMap = new Map<string, PlayInTeamStats>();
      
      // Initialiser les stats pour toutes les équipes
      snapshot.docs.forEach(doc => {
        const match = doc.data() as TournamentMatch;
        
        if (!statsMap.has(match.team1Id)) {
          statsMap.set(match.team1Id, {
            teamId: match.team1Id,
            teamName: match.team1Name,
            blocType: match.blocType || 'A',
            wins: 0,
            losses: 0,
            roundsWon: 0,
            roundsLost: 0,
            roundDifference: 0,
            totalKills: 0,
            points: 0,
            qualified: false,
            isWildcard: false
          });
        }
        
        if (!statsMap.has(match.team2Id)) {
          statsMap.set(match.team2Id, {
            teamId: match.team2Id,
            teamName: match.team2Name,
            blocType: match.blocType || 'A',
            wins: 0,
            losses: 0,
            roundsWon: 0,
            roundsLost: 0,
            roundDifference: 0,
            totalKills: 0,
            points: 0,
            qualified: false,
            isWildcard: false
          });
        }
      });
      
      // Calculer les résultats des matchs complétés
      const completedQuery = query(
        collection(db, `tournaments/${tournamentId}/matches`),
        where('phaseType', '==', 'play_in'),
        where('status', '==', 'completed')
      );
      
      const completedSnapshot = await getDocs(completedQuery);
      
      completedSnapshot.docs.forEach(doc => {
        const match = doc.data() as TournamentMatch;
        const team1Stats = statsMap.get(match.team1Id)!;
        const team2Stats = statsMap.get(match.team2Id)!;
        
        if (!match.matchResult?.team1Stats || !match.matchResult?.team2Stats) return;
        
        // Récupérer les rounds gagnés/perdus et kills totaux de chaque équipe
        const team1RoundsWon = match.matchResult.team1Stats.roundsWon || 0;
        const team2RoundsWon = match.matchResult.team2Stats.roundsWon || 0;
        const team1TotalKills = match.matchResult.team1Stats.totalKills || 0;
        const team2TotalKills = match.matchResult.team2Stats.totalKills || 0;
        
        // Ajouter les rounds gagnés/perdus
        team1Stats.roundsWon += team1RoundsWon;
        team1Stats.roundsLost += team2RoundsWon;
        team2Stats.roundsWon += team2RoundsWon;
        team2Stats.roundsLost += team1RoundsWon;
        
        // Ajouter les kills totaux
        team1Stats.totalKills += team1TotalKills;
        team2Stats.totalKills += team2TotalKills;
        
        // wins = roundsWon (nombre de rounds gagnés)
        // losses = roundsLost (nombre de rounds perdus)
        team1Stats.wins = team1Stats.roundsWon;
        team1Stats.losses = team1Stats.roundsLost;
        team2Stats.wins = team2Stats.roundsWon;
        team2Stats.losses = team2Stats.roundsLost;
        
        // roundDifference = wins - losses
        team1Stats.roundDifference = team1Stats.wins - team1Stats.losses;
        team2Stats.roundDifference = team2Stats.wins - team2Stats.losses;
      });
      
      return Array.from(statsMap.values());
      
    } catch (error) {
      console.error('Erreur lors du calcul des stats play-in:', error);
      return [];
    }
  }
  
  /**
   * Récupérer les gagnants du Bloc A (matchs simples)
   * Directement depuis les résultats des matchs
   */
  static async getQualifiersFromBlocA(
    tournamentId: string,
    stats: PlayInTeamStats[]
  ): Promise<PlayInTeamStats[]> {
    try {
      // Récupérer tous les matchs du Bloc A complétés
      const matchesQuery = query(
        collection(db, `tournaments/${tournamentId}/matches`),
        where('phaseType', '==', 'play_in'),
        where('blocType', '==', 'A'),
        where('status', '==', 'completed')
      );
      
      const matchesSnapshot = await getDocs(matchesQuery);
      const winnerIds = new Set<string>();
      
      // Récupérer les IDs des gagnants
      matchesSnapshot.docs.forEach(doc => {
        const match = doc.data() as TournamentMatch;
        if (match.winnerId) {
          winnerIds.add(match.winnerId);
        }
      });
      
      // Récupérer les stats des gagnants
      const qualifiers = stats.filter(s => s.blocType === 'A' && winnerIds.has(s.teamId));
      console.log(`📊 Bloc A - Qualifiés (gagnants): ${qualifiers.map(t => t.teamName).join(', ')}`);
      return qualifiers;
    } catch (error) {
      console.error('Erreur lors de la récupération des qualifiés Bloc A:', error);
      return [];
    }
  }

  /**
   * Récupérer les perdants du Bloc A (matchs simples)
   * Directement depuis les résultats des matchs
   */
  static async getNonQualifiersFromBlocA(
    tournamentId: string,
    stats: PlayInTeamStats[]
  ): Promise<PlayInTeamStats[]> {
    try {
      // Récupérer tous les matchs du Bloc A complétés
      const matchesQuery = query(
        collection(db, `tournaments/${tournamentId}/matches`),
        where('phaseType', '==', 'play_in'),
        where('blocType', '==', 'A'),
        where('status', '==', 'completed')
      );
      
      const matchesSnapshot = await getDocs(matchesQuery);
      const loserIds = new Set<string>();
      
      // Récupérer les IDs des perdants
      matchesSnapshot.docs.forEach(doc => {
        const match = doc.data() as TournamentMatch;
        if (match.loserId) {
          loserIds.add(match.loserId);
        }
      });
      
      // Récupérer les stats des perdants
      const nonQualifiers = stats.filter(s => s.blocType === 'A' && loserIds.has(s.teamId));
      console.log(`📊 Bloc A - Non-qualifiés (perdants): ${nonQualifiers.map(t => t.teamName).join(', ')}`);
      return nonQualifiers;
    } catch (error) {
      console.error('Erreur lors de la récupération des non-qualifiés Bloc A:', error);
      return [];
    }
  }

  /**
   * Sélectionner les qualifiés du Bloc B
   */
  static selectQualifiersFromBlocB(
    stats: PlayInTeamStats[],
    count: number
  ): PlayInTeamStats[] {
    const blocBStats = stats.filter(s => s.blocType === 'B').sort((a, b) => {
      // Tri par wins (rounds gagnés), puis roundDifference
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.roundDifference !== a.roundDifference) return b.roundDifference - a.roundDifference;
      return b.points - a.points;
    });
    
    console.log(`📊 Bloc B - Qualifiés sélectionnés (${count}):`, blocBStats.slice(0, count).map(t => `${t.teamName} (${t.wins}W)`));
    return blocBStats.slice(0, count);
  }

  /**
   * Sélectionner les wildcards parmi les non-qualifiés
   */
  static async selectWildcards(
    tournamentId: string,
    stats: PlayInTeamStats[],
    qualifiersFromBlocB: number,
    count: number
  ): Promise<PlayInTeamStats[]> {
    // Récupérer les perdants du Bloc A directement depuis les matchs
    const nonQualifiersFromBlocA = await this.getNonQualifiersFromBlocA(tournamentId, stats);
    
    // Récupérer les non-qualifiés du Bloc B (par tri)
    const blocBStats = stats.filter(s => s.blocType === 'B').sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.roundDifference !== a.roundDifference) return b.roundDifference - a.roundDifference;
      return b.points - a.points;
    });
    const nonQualifiersFromBlocB = blocBStats.slice(qualifiersFromBlocB);
    
    // Candidats aux wildcards (perdants de Bloc A + non-qualifiés de Bloc B)
    const wildcardCandidates = [
      ...nonQualifiersFromBlocA,
      ...nonQualifiersFromBlocB
    ].sort((a, b) => {
      // 1. Nombre total de KILLS (totalKills de tous les matchs)
      const aKills = a.totalKills || 0;
      const bKills = b.totalKills || 0;
      if (bKills !== aKills) return bKills - aKills;
      
      // 2. Nombre de VICTOIRES (rounds gagnés = wins)
      if (b.wins !== a.wins) return b.wins - a.wins;
      
      // 3. DIFFÉRENCE DE ROUNDS (wins - losses)
      if (b.roundDifference !== a.roundDifference) return b.roundDifference - a.roundDifference;
      
      // 4. TIRAGE AU SORT en dernier recours
      return Math.random() - 0.5;
    });
    
    const selectedWildcards = wildcardCandidates.slice(0, count);
    console.log(`🎯 Wildcards sélectionnés (${count}):`, selectedWildcards.map(t => `${t.teamName} (${t.totalKills}K, ${t.wins}W)`));
    return selectedWildcards;
  }

  /**
   * Sélectionner les qualifiés et les wildcards
   */
  static async selectQualifiersAndWildcards(
    tournamentId: string,
    stats: PlayInTeamStats[],
    structure: PlayInConfig
  ): Promise<PlayInResult> {
    // Sélectionner les qualifiés de chaque bloc
    const qualifiedFromBlocA = await this.getQualifiersFromBlocA(tournamentId, stats);
    const qualifiedFromBlocB = this.selectQualifiersFromBlocB(stats, structure.qualifiersFromBlocB);
    const qualifiedTeams = [...qualifiedFromBlocA, ...qualifiedFromBlocB];
    
    // Sélectionner les wildcards parmi les non-qualifiés
    const wildcardTeams = await this.selectWildcards(
      tournamentId,
      stats,
      structure.qualifiersFromBlocB,
      structure.wildcardsNeeded
    );
    
    // Marquer les qualifiés
    qualifiedTeams.forEach(team => {
      team.qualified = true;
      team.isWildcard = false;
    });
    
    // Marquer les wildcards
    wildcardTeams.forEach(team => {
      team.qualified = true;
      team.isWildcard = true;
    });
    
    return {
      qualifiedTeams,
      wildcardTeams,
      totalQualified: qualifiedTeams.length + wildcardTeams.length
    };
  }
}
