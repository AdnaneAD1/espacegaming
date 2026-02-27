import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TournamentMatch, Tournament, TournamentTeam } from '@/types/tournament-multi';
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

export class MatchService {

  /**
   * Calculer la distribution optimale des groupes
   * Gère les cas où le nombre d'équipes n'est pas une puissance de 2
   */
  static calculateGroupDistribution(
    totalTeams: number,
    teamsPerGroup: number
  ): {
    numGroups: number;
    groupSizes: number[];
    description: string;
  } {
    const numGroups = Math.ceil(totalTeams / teamsPerGroup);
    const baseTeamsPerGroup = Math.floor(totalTeams / numGroups);
    const remainder = totalTeams % numGroups;

    // Créer un tableau avec les tailles de groupes
    const groupSizes: number[] = [];
    for (let i = 0; i < numGroups; i++) {
      // Les premiers groupes ont une équipe de plus si remainder > 0
      groupSizes.push(i < remainder ? baseTeamsPerGroup + 1 : baseTeamsPerGroup);
    }

    const description = groupSizes.length === 1
      ? `1 groupe de ${groupSizes[0]} équipes`
      : `${numGroups} groupes: ${groupSizes.map((size, i) => `${String.fromCharCode(65 + i)}(${size})`).join(', ')}`;

    return { numGroups, groupSizes, description };
  }

  /**
   * Générer les matchs selon le format du tournoi
   */
  static async generateMatches(
    tournamentId: string,
    tournament: Tournament,
    teams: TournamentTeam[]
  ): Promise<void> {
    if (teams.length < 2) {
      throw new Error('Au moins 2 équipes sont nécessaires pour créer des matchs');
    }

    const format = tournament.customFormat?.tournamentFormat || 'elimination_direct';

    switch (format) {
      case 'elimination_direct':
        await this.generateEliminationMatches(tournamentId, tournament.gameMode, teams);
        break;

      case 'groups_then_elimination':
        await this.generateGroupStageMatches(tournamentId, tournament, teams);
        break;

      case 'groups_only':
        await this.generateGroupStageMatches(tournamentId, tournament, teams);
        break;

      default:
        throw new Error(`Format de tournoi non supporté: ${format}`);
    }
  }

  /**
   * Générer les matchs de phase de groupes
   */
  static async generateGroupStageMatches(
    tournamentId: string,
    tournament: Tournament,
    teams: TournamentTeam[]
  ): Promise<void> {
    const groupConfig = tournament.customFormat?.groupStage;
    const format = tournament.customFormat?.tournamentFormat || 'elimination_direct';

    // Pour groups_only, créer un seul groupe avec toutes les équipes
    const isSingleGroup = format === 'groups_only';

    if (!isSingleGroup && (!groupConfig || !groupConfig.enabled)) {
      throw new Error('La configuration des groupes est manquante');
    }

    // Mélanger les équipes pour un tirage au sort équitable
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

    let groups: TournamentTeam[][] = [];

    if (isSingleGroup) {
      // ✅ Un seul groupe avec toutes les équipes (round-robin complet)
      groups = [shuffledTeams];
    } else {
      // Plusieurs groupes selon la configuration
      const teamsPerGroup = groupConfig!.teamsPerGroup || 4;

      // Calculer la distribution optimale des groupes
      const distribution = this.calculateGroupDistribution(teams.length, teamsPerGroup);
      const { numGroups } = distribution;

      console.log(`📊 Distribution des groupes: ${distribution.description}`);

      // Créer les groupes avec les tailles calculées
      for (let i = 0; i < numGroups; i++) {
        groups.push([]);
      }

      // Distribuer les équipes dans les groupes (serpentin pour équilibrer)
      shuffledTeams.forEach((team, index) => {
        const groupIndex = index % numGroups;
        groups[groupIndex].push(team);
      });
    }

    // Générer les matchs pour chaque groupe
    const batch = writeBatch(db);
    const matchesRef = collection(db, `tournaments/${tournamentId}/matches`);
    let globalMatchNumber = 1;

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const groupTeams = groups[groupIndex];
      const groupName = String.fromCharCode(65 + groupIndex); // A, B, C, etc.

      // Générer tous les matchs du groupe (round-robin)
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          const team1 = groupTeams[i];
          const team2 = groupTeams[j];

          const matchData: Omit<TournamentMatch, 'id'> = {
            tournamentId,
            gameMode: tournament.gameMode,
            phaseType: 'group_stage',
            matchNumber: globalMatchNumber++,
            groupName: `Groupe ${groupName}`,
            team1Id: team1.id,
            team1Name: team1.name,
            team2Id: team2.id,
            team2Name: team2.name,
            status: 'pending',
            createdAt: new Date()
          };

          const newMatchRef = doc(matchesRef);
          batch.set(newMatchRef, {
            ...matchData,
            createdAt: serverTimestamp()
          });
        }
      }
    }

    await batch.commit();

    if (isSingleGroup) {
      console.log(`✅ Matchs générés pour 1 groupe unique avec ${teams.length} équipes (round-robin complet)`);
    } else {
      console.log(`✅ Matchs de phase de groupes générés pour ${groups.length} groupes`);
    }
    console.log(`📍 Chemin Firestore: tournaments/${tournamentId}/matches`);
  }

  /**
   * Générer automatiquement les matchs pour un tournoi en élimination directe
   */
  static async generateEliminationMatches(
    tournamentId: string,
    gameMode: GameMode,
    teams: TournamentTeam[]
  ): Promise<void> {
    if (teams.length < 2) {
      throw new Error('Au moins 2 équipes sont nécessaires pour créer des matchs');
    }

    // Importer PlayInService pour vérifier si play-in est nécessaire
    const { PlayInService } = await import('./playInService');

    // Vérifier si le nombre d'équipes est une puissance de 2
    const structure = PlayInService.calculatePlayInStructure(teams.length);

    if (structure.enabled) {
      // Générer le play-in si nécessaire
      console.log(`⚠️ Nombre d'équipes (${teams.length}) n'est pas une puissance de 2`);
      console.log(`📍 Génération du Play-In pour atteindre ${structure.targetBracketSize} équipes`);

      const result = await PlayInService.generatePlayIn(tournamentId, gameMode, teams);
      console.log(`✅ Play-in créé: ${result.totalMatches} matchs (${result.blocAMatches} Bloc A + ${result.blocBMatches} Bloc B)`);
      return;
    }

    // Sinon, générer l'élimination directe classique
    console.log(`✅ Nombre d'équipes (${teams.length}) = puissance de 2, élimination directe`);

    // Mélanger les équipes aléatoirement pour un tirage au sort
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

    const batch = writeBatch(db);
    const matchesRef = collection(db, `tournaments/${tournamentId}/matches`);

    // Créer les matchs du premier tour
    const numMatches = Math.floor(shuffledTeams.length / 2);

    // Le premier tour d'élimination est toujours round 1
    const firstRoundNumber = 1;

    for (let i = 0; i < numMatches; i++) {
      const team1 = shuffledTeams[i * 2];
      const team2 = shuffledTeams[i * 2 + 1];

      const matchData: Omit<TournamentMatch, 'id'> = {
        tournamentId,
        gameMode,
        phaseType: 'elimination',
        round: firstRoundNumber,
        matchNumber: i + 1,
        team1Id: team1.id,
        team1Name: team1.name,
        team2Id: team2.id,
        team2Name: team2.name,
        status: 'pending',
        createdAt: new Date()
      };

      const newMatchRef = doc(matchesRef);
      batch.set(newMatchRef, {
        ...matchData,
        createdAt: serverTimestamp()
      });
    }

    await batch.commit();
    console.log(`${numMatches} matchs générés pour le tournoi ${tournamentId}`);
  }

  /**
   * Convertir PlayInTeamStats en TournamentTeam
   */
  private static convertPlayInTeamToTournamentTeam(
    playInTeam: { teamId: string; teamName: string },
    tournamentId: string,
    gameMode: GameMode
  ): TournamentTeam {
    return {
      id: playInTeam.teamId,
      tournamentId,
      gameMode,
      name: playInTeam.teamName,
      code: playInTeam.teamName.substring(0, 3).toUpperCase(),
      captain: {
        id: '',
        pseudo: '',
        country: '',
        whatsapp: '',
        deviceCheckVideo: '',
        status: 'validated' as const,
        joinedAt: new Date(),
        validatedAt: new Date(),
        isCaptain: true
      },
      players: [],
      status: 'complete' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      validatedAt: new Date()
    };
  }

  /**
   * Créer les matchs d'élimination à partir des équipes qualifiées
   */
  private static async createEliminationMatches(
    tournamentId: string,
    gameMode: GameMode,
    qualifiedTeams: TournamentTeam[]
  ): Promise<number> {
    // Mélanger les équipes qualifiées
    const shuffledTeams = [...qualifiedTeams].sort(() => Math.random() - 0.5);

    const batch = writeBatch(db);
    const matchesRef = collection(db, `tournaments/${tournamentId}/matches`);

    // Créer les matchs du premier tour d'élimination
    const numMatches = Math.floor(shuffledTeams.length / 2);
    const firstRoundNumber = 1;

    for (let i = 0; i < numMatches; i++) {
      const team1 = shuffledTeams[i * 2];
      const team2 = shuffledTeams[i * 2 + 1];

      const matchData: Omit<TournamentMatch, 'id'> = {
        tournamentId,
        gameMode,
        phaseType: 'elimination',
        round: firstRoundNumber,
        matchNumber: i + 1,
        team1Id: team1.id,
        team1Name: team1.name,
        team2Id: team2.id,
        team2Name: team2.name,
        status: 'pending',
        createdAt: new Date()
      };

      const newMatchRef = doc(matchesRef);
      batch.set(newMatchRef, {
        ...matchData,
        createdAt: serverTimestamp()
      });
    }

    await batch.commit();
    console.log(`✅ ${numMatches} matchs d'élimination créés`);
    return numMatches;
  }

  /**
   * Générer l'élimination après le play-in
   * Récupère les équipes qualifiées et wildcards du play-in
   */
  static async generateEliminationAfterPlayIn(
    tournamentId: string,
    gameMode: GameMode
  ): Promise<void> {
    try {
      const { PlayInService } = await import('./playInService');

      console.log('🔄 Début de la génération de l\'élimination après play-in...');

      // 1. Récupérer les stats du play-in
      console.log('📊 Récupération des stats play-in...');
      const stats = await PlayInService.calculatePlayInStats(tournamentId);

      if (stats.length === 0) {
        console.log('❌ Aucune stat play-in trouvée');
        return;
      }
      console.log(`✅ ${stats.length} équipes trouvées au play-in`);

      // 2. Calculer la structure
      console.log('🎯 Calcul de la structure...');
      const structure = PlayInService.calculatePlayInStructure(stats.length);
      console.log(`✅ Structure: ${structure.qualifiersFromBlocA} qualifiés Bloc A + ${structure.qualifiersFromBlocB} qualifiés Bloc B + ${structure.wildcardsNeeded} wildcards`);

      // 3. Sélectionner les qualifiés et wildcards
      console.log('🏆 Sélection des qualifiés et wildcards...');
      const result = await PlayInService.selectQualifiersAndWildcards(tournamentId, stats, structure);

      if (result.totalQualified === 0) {
        console.log('❌ Aucune équipe qualifiée du play-in');
        return;
      }
      console.log(`✅ ${result.totalQualified} équipes qualifiées (${result.qualifiedTeams.length} directs + ${result.wildcardTeams.length} wildcards)`);

      // 4. Convertir en TournamentTeam
      console.log('🔄 Conversion des équipes...');
      const allQualifiedTeams = [
        ...result.qualifiedTeams,
        ...result.wildcardTeams
      ].map(team => this.convertPlayInTeamToTournamentTeam(team, tournamentId, gameMode));
      console.log(`✅ ${allQualifiedTeams.length} équipes converties`);

      // 5. Créer les matchs d'élimination
      console.log('⚔️ Création des matchs d\'élimination...');
      const numMatches = await this.createEliminationMatches(tournamentId, gameMode, allQualifiedTeams);

      console.log(`\n🎉 ÉLIMINATION GÉNÉRÉE AVEC SUCCÈS`);
      console.log(`   - Total matchs: ${numMatches}`);
      console.log(`   - Qualifiés directs: ${result.qualifiedTeams.length}`);
      console.log(`   - Wildcards: ${result.wildcardTeams.length}`);
      console.log(`   - Total équipes: ${result.totalQualified}`);

    } catch (error) {
      console.error('❌ Erreur lors de la génération de l\'élimination après play-in:', error);
      throw error;
    }
  }

  /**
   * Générer les matchs du tour suivant après complétion d'un tour
   */
  static async generateNextRoundMatches(
    tournamentId: string,
    gameMode: GameMode,
    currentRound: number
  ): Promise<void> {
    try {
      // Récupérer les gagnants et perdants du tour actuel (élimination uniquement)
      const matchesQuery = query(
        collection(db, `tournaments/${tournamentId}/matches`),
        where('phaseType', '==', 'elimination'),
        where('round', '==', currentRound),
        where('status', '==', 'completed'),
        orderBy('matchNumber')
      );

      const matchesSnapshot = await getDocs(matchesQuery);
      const winners: { winnerId: string; winnerName: string }[] = [];
      const losers: { loserId: string; loserName: string }[] = [];

      matchesSnapshot.docs.forEach(doc => {
        const match = doc.data() as TournamentMatch;

        if (match.winnerId && match.winnerName) {
          winners.push({ winnerId: match.winnerId, winnerName: match.winnerName });
        }
        if (match.loserId && match.loserName) {
          losers.push({ loserId: match.loserId, loserName: match.loserName });
        }
      });

      console.log(`📊 Round ${currentRound} complété: ${winners.length} gagnants, ${losers.length} perdants`);

      if (winners.length < 2) {
        console.log('⏳ Pas assez de gagnants pour créer le tour suivant');
        return;
      }

      const batch = writeBatch(db);
      const matchesRef = collection(db, `tournaments/${tournamentId}/matches`);

      // Cas 1 : Exactement 2 gagnants = Demi-finales complétées → Créer Finale + Petite finale
      if (winners.length === 2 && losers.length === 2) {
        console.log('🏆 Demi-finales complétées → Création de la Finale et Petite finale');

        // 1. Créer la FINALE (gagnants des demis)
        const finaleData: Omit<TournamentMatch, 'id'> = {
          tournamentId,
          gameMode,
          phaseType: 'elimination',
          round: currentRound + 1,
          matchNumber: 1,
          team1Id: winners[0].winnerId,
          team1Name: winners[0].winnerName,
          team2Id: winners[1].winnerId,
          team2Name: winners[1].winnerName,
          status: 'pending',
          createdAt: new Date()
        };

        const finaleRef = doc(matchesRef);
        batch.set(finaleRef, {
          ...finaleData,
          createdAt: serverTimestamp()
        });

        // 2. Créer la PETITE FINALE (perdants des demis)
        const thirdPlaceData: Omit<TournamentMatch, 'id'> = {
          tournamentId,
          gameMode,
          phaseType: 'elimination',
          round: currentRound + 1,
          matchNumber: 2,
          team1Id: losers[0].loserId,
          team1Name: losers[0].loserName,
          team2Id: losers[1].loserId,
          team2Name: losers[1].loserName,
          status: 'pending',
          isThirdPlaceMatch: true,
          createdAt: new Date()
        };

        const thirdPlaceRef = doc(matchesRef);
        batch.set(thirdPlaceRef, {
          ...thirdPlaceData,
          createdAt: serverTimestamp()
        });

        await batch.commit();
        console.log('✅ Finale (Match 1) et Petite finale (Match 2) créées');

      } else {
        // Cas 2 : Autres cas (4, 8, 16... gagnants) → Créer les matchs du tour suivant
        const numMatches = Math.floor(winners.length / 2);
        console.log(`⚔️ Création de ${numMatches} matchs pour le tour ${currentRound + 1}`);

        for (let i = 0; i < numMatches; i++) {
          const team1 = winners[i * 2];
          const team2 = winners[i * 2 + 1];

          const matchData: Omit<TournamentMatch, 'id'> = {
            tournamentId,
            gameMode,
            phaseType: 'elimination',
            round: currentRound + 1,
            matchNumber: i + 1,
            team1Id: team1.winnerId,
            team1Name: team1.winnerName,
            team2Id: team2.winnerId,
            team2Name: team2.winnerName,
            status: 'pending',
            createdAt: new Date()
          };

          const newMatchRef = doc(matchesRef);
          batch.set(newMatchRef, {
            ...matchData,
            createdAt: serverTimestamp()
          });
        }

        await batch.commit();
        console.log(`✅ ${numMatches} matchs générés pour le tour ${currentRound + 1}`);
      }

    } catch (error) {
      console.error('❌ Erreur lors de la génération des matchs du tour suivant:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les matchs d'un tournoi
   */
  static async getMatches(tournamentId: string): Promise<TournamentMatch[]> {
    try {
      console.log('🔍 getMatches - Chargement des matchs pour tournoi:', tournamentId);

      // Ne pas utiliser orderBy sur 'round' car les matchs de groupe n'ont pas ce champ
      // On va trier côté client
      const matchesQuery = query(
        collection(db, `tournaments/${tournamentId}/matches`)
      );

      const snapshot = await getDocs(matchesQuery);
      console.log('📦 getMatches - Documents récupérés:', snapshot.size);

      const matches = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Match doc:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          createdAt: convertTimestampToDate(data.createdAt),
          scheduledDate: convertTimestampToDate(data.scheduledDate),
          completedDate: convertTimestampToDate(data.completedDate)
        } as TournamentMatch;
      });

      // Trier côté client : d'abord par phase (groupes puis élimination), puis par round/matchNumber
      const sortedMatches = matches.sort((a, b) => {
        // Les matchs de groupe d'abord
        if (a.phaseType === 'group_stage' && b.phaseType !== 'group_stage') return -1;
        if (a.phaseType !== 'group_stage' && b.phaseType === 'group_stage') return 1;

        // Si même phase, trier par round (pour élimination) ou par matchNumber
        if (a.round !== undefined && b.round !== undefined) {
          if (a.round !== b.round) return a.round - b.round;
        }

        return (a.matchNumber || 0) - (b.matchNumber || 0);
      });

      console.log('✅ getMatches - Matchs triés:', sortedMatches.length);
      return sortedMatches;
    } catch (error) {
      console.error('❌ getMatches - Erreur:', error);
      throw error;
    }
  }

  /**
   * Récupérer les matchs par type de phase
   */
  static async getMatchesByPhaseType(
    tournamentId: string,
    phaseType: 'group_stage' | 'play_in' | 'elimination'
  ): Promise<TournamentMatch[]> {
    const matchesQuery = query(
      collection(db, `tournaments/${tournamentId}/matches`),
      where('phaseType', '==', phaseType),
      orderBy('matchNumber')
    );

    const snapshot = await getDocs(matchesQuery);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestampToDate(data.createdAt),
        scheduledDate: convertTimestampToDate(data.scheduledDate),
        completedDate: convertTimestampToDate(data.completedDate)
      } as TournamentMatch;
    });
  }

  /**
   * Récupérer les matchs d'un tour spécifique
   */
  static async getMatchesByRound(tournamentId: string, round: number): Promise<TournamentMatch[]> {
    const matchesQuery = query(
      collection(db, `tournaments/${tournamentId}/matches`),
      where('round', '==', round),
      orderBy('matchNumber')
    );

    const snapshot = await getDocs(matchesQuery);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestampToDate(data.createdAt),
        scheduledDate: convertTimestampToDate(data.scheduledDate),
        completedDate: convertTimestampToDate(data.completedDate)
      } as TournamentMatch;
    });
  }

  /**
   * Enregistrer le résultat d'un match (ou d'une manche)
   */
  static async recordMatchResult(
    tournamentId: string,
    matchId: string,
    winnerId: string,
    winnerName: string,
    loserId: string,
    loserName: string,
    matchResult: TournamentMatch['matchResult'],
    isMatchComplete: boolean = true
  ): Promise<void> {
    const matchRef = doc(db, `tournaments/${tournamentId}/matches`, matchId);

    const updateData = {
      winnerId,
      winnerName,
      loserId,
      loserName,
      status: isMatchComplete ? 'completed' : 'in_progress',
      matchResult,
      ...(isMatchComplete && { completedDate: serverTimestamp() })
    };

    await updateDoc(matchRef, updateData);

    console.log(`${isMatchComplete ? 'Match' : 'Manche'} ${matchId} enregistré(e)`);
  }

  /**
   * Vérifier si tous les matchs d'un tour sont terminés
   */
  static async isRoundCompleted(tournamentId: string, round: number): Promise<boolean> {
    const matchesQuery = query(
      collection(db, `tournaments/${tournamentId}/matches`),
      where('round', '==', round)
    );

    const snapshot = await getDocs(matchesQuery);

    if (snapshot.empty) return false;

    return snapshot.docs.every(doc => {
      const match = doc.data() as TournamentMatch;
      return match.status === 'completed';
    });
  }

  /**
   * Obtenir le nombre de tours nécessaires pour un nombre d'équipes
   */
  static getNumberOfRounds(numTeams: number): number {
    return Math.ceil(Math.log2(numTeams));
  }

  /**
   * Obtenir le nom du tour (Quarts, Demis, Finale, etc.)
   */
  static getRoundName(round: number, totalRounds: number): string {
    const roundsFromEnd = totalRounds - round + 1;

    switch (roundsFromEnd) {
      case 1:
        return 'Finale';
      case 2:
        return 'Demi-finales';
      case 3:
        return 'Quarts de finale';
      case 4:
        return 'Huitièmes de finale';
      default:
        return `Tour ${round}`;
    }
  }

  /**
   * Calculer le classement d'un groupe
   */
  static async getGroupStandings(tournamentId: string, groupName: string): Promise<{
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    kills: number;
    points: number;
  }[]> {
    const matchesQuery = query(
      collection(db, `tournaments/${tournamentId}/matches`),
      where('phaseType', '==', 'group_stage'),
      where('groupName', '==', groupName),
      where('status', '==', 'completed')
    );

    const snapshot = await getDocs(matchesQuery);
    const standings = new Map<string, {
      teamId: string;
      teamName: string;
      wins: number;
      losses: number;
      kills: number;
      points: number;
    }>();

    snapshot.docs.forEach(doc => {
      const match = doc.data() as TournamentMatch;
      if (!match.winnerId || !match.matchResult) return;

      // Initialiser les équipes si nécessaire
      if (!standings.has(match.team1Id)) {
        standings.set(match.team1Id, {
          teamId: match.team1Id,
          teamName: match.team1Name,
          wins: 0,
          losses: 0,
          kills: 0,
          points: 0
        });
      }
      if (!standings.has(match.team2Id)) {
        standings.set(match.team2Id, {
          teamId: match.team2Id,
          teamName: match.team2Name,
          wins: 0,
          losses: 0,
          kills: 0,
          points: 0
        });
      }

      const team1Stats = standings.get(match.team1Id)!;
      const team2Stats = standings.get(match.team2Id)!;

      // Mettre à jour les stats
      team1Stats.kills += match.matchResult.team1Stats.totalKills;
      team2Stats.kills += match.matchResult.team2Stats.totalKills;

      if (match.winnerId === match.team1Id) {
        team1Stats.wins++;
        team1Stats.points += 3; // 3 points pour une victoire
        team2Stats.losses++;
      } else {
        team2Stats.wins++;
        team2Stats.points += 3;
        team1Stats.losses++;
      }
    });

    // Trier par points, puis par kills
    return Array.from(standings.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.kills - a.kills;
    });
  }

  /**
   * Calculer le classement d'un bloc du play-in (Bloc A ou B)
   */
  static async getPlayInBlocStandings(tournamentId: string, blocType: 'A' | 'B'): Promise<{
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    kills: number;
    points: number;
  }[]> {
    const matchesQuery = query(
      collection(db, `tournaments/${tournamentId}/matches`),
      where('phaseType', '==', 'play_in'),
      where('blocType', '==', blocType),
      where('status', '==', 'completed')
    );

    const snapshot = await getDocs(matchesQuery);
    const standings = new Map<string, {
      teamId: string;
      teamName: string;
      wins: number;
      losses: number;
      kills: number;
      points: number;
    }>();

    snapshot.docs.forEach(doc => {
      const match = doc.data() as TournamentMatch;
      if (!match.winnerId || !match.matchResult) return;

      // Initialiser les équipes si nécessaire
      if (!standings.has(match.team1Id)) {
        standings.set(match.team1Id, {
          teamId: match.team1Id,
          teamName: match.team1Name,
          wins: 0,
          losses: 0,
          kills: 0,
          points: 0
        });
      }
      if (!standings.has(match.team2Id)) {
        standings.set(match.team2Id, {
          teamId: match.team2Id,
          teamName: match.team2Name,
          wins: 0,
          losses: 0,
          kills: 0,
          points: 0
        });
      }

      const team1Stats = standings.get(match.team1Id)!;
      const team2Stats = standings.get(match.team2Id)!;

      // Mettre à jour les stats
      team1Stats.kills += match.matchResult.team1Stats.totalKills;
      team2Stats.kills += match.matchResult.team2Stats.totalKills;

      if (match.winnerId === match.team1Id) {
        team1Stats.wins++;
        team1Stats.points += 3; // 3 points pour une victoire
        team2Stats.losses++;
      } else {
        team2Stats.wins++;
        team2Stats.points += 3;
        team1Stats.losses++;
      }
    });

    // Trier par points, puis par kills
    return Array.from(standings.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.kills - a.kills;
    });
  }

  /**
   * Sélectionner les meilleurs non-qualifiés de tous les groupes (repêchage adaptatif)
   * Fonctionne comme les "meilleurs troisièmes" de la CDM/CAN :
   * - Collecte tous les non-qualifiés de chaque groupe
   * - Les trie entre eux par points puis kills
   * - Sélectionne les N meilleurs pour compléter le bracket
   */
  static async selectBestNonQualifiedTeams(
    tournamentId: string,
    groupNames: string[],
    qualifiersPerGroup: number,
    slotsNeeded: number
  ): Promise<{ teamId: string; teamName: string; groupName: string; points: number; kills: number; rank: number }[]> {
    const allNonQualified: { teamId: string; teamName: string; groupName: string; points: number; kills: number; rank: number }[] = [];

    for (const groupName of groupNames) {
      const standings = await this.getGroupStandings(tournamentId, groupName);
      // Les non-qualifiés sont ceux après la position qualifiersPerGroup
      const nonQualified = standings.slice(qualifiersPerGroup);
      nonQualified.forEach((team, index) => {
        allNonQualified.push({
          teamId: team.teamId,
          teamName: team.teamName,
          groupName,
          points: team.points,
          kills: team.kills,
          rank: qualifiersPerGroup + index + 1 // Position réelle dans le groupe (3, 4, ...)
        });
      });
    }

    // Trier par :
    // 1. Rang dans le groupe (asc : les 3èmes avant les 4èmes)
    // 2. Points (desc)
    // 3. Kills (desc)
    allNonQualified.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (b.points !== a.points) return b.points - a.points;
      return b.kills - a.kills;
    });

    // Sélectionner les N meilleurs
    const selected = allNonQualified.slice(0, slotsNeeded);

    console.log(`🔄 Repêchage - Candidats: ${allNonQualified.length}, Sélectionnés: ${selected.length}`);
    selected.forEach((team, i) => {
      console.log(`   ${i + 1}. ${team.teamName} (${team.groupName}) - ${team.points} pts, ${team.kills} kills`);
    });

    return selected;
  }

  /**
   * Générer la phase d'élimination avec les équipes qualifiées des groupes
   * Inclut le repêchage adaptatif si le nombre de qualifiés n'est pas une puissance de 2
   */
  static async generateEliminationFromGroups(
    tournamentId: string,
    tournament: Tournament
  ): Promise<{ directQualified: number; repechageCount: number; totalTeams: number; repechageTeams: { teamName: string; groupName: string; points: number; kills: number }[] }> {
    const groupConfig = tournament.customFormat?.groupStage;
    if (!groupConfig) {
      throw new Error('Configuration des groupes manquante');
    }

    const qualifiersPerGroup = groupConfig.qualifiersPerGroup || 2;

    // Récupérer tous les groupes uniques
    const matchesQuery = query(
      collection(db, `tournaments/${tournamentId}/matches`),
      where('phaseType', '==', 'group_stage')
    );
    const snapshot = await getDocs(matchesQuery);
    const groupNamesSet = new Set<string>();
    snapshot.docs.forEach(doc => {
      const match = doc.data() as TournamentMatch;
      if (match.groupName) groupNamesSet.add(match.groupName);
    });
    const groupNamesList = Array.from(groupNamesSet).sort();

    // Récupérer les qualifiés directs de chaque groupe
    const qualifiedTeams: { teamId: string; teamName: string }[] = [];
    for (const groupName of groupNamesList) {
      const standings = await this.getGroupStandings(tournamentId, groupName);
      const topTeams = standings.slice(0, qualifiersPerGroup);
      qualifiedTeams.push(...topTeams.map(t => ({ teamId: t.teamId, teamName: t.teamName })));
    }

    if (qualifiedTeams.length < 2) {
      throw new Error('Pas assez d\'équipes qualifiées pour la phase d\'élimination');
    }

    console.log(`✅ Qualifiés directs: ${qualifiedTeams.length} équipes (top ${qualifiersPerGroup} de ${groupNamesList.length} groupes)`);

    // Calculer la puissance de 2 cible
    const targetBracketSize = Math.pow(2, Math.ceil(Math.log2(qualifiedTeams.length)));
    let repechageTeams: { teamId: string; teamName: string; groupName: string; points: number; kills: number }[] = [];

    // Repêchage adaptatif si besoin
    if (qualifiedTeams.length < targetBracketSize) {
      const slotsNeeded = targetBracketSize - qualifiedTeams.length;
      console.log(`🔄 Repêchage nécessaire: ${qualifiedTeams.length} qualifiés → cible ${targetBracketSize} → ${slotsNeeded} repêchés à sélectionner`);

      repechageTeams = await this.selectBestNonQualifiedTeams(
        tournamentId,
        groupNamesList,
        qualifiersPerGroup,
        slotsNeeded
      );

      if (repechageTeams.length < slotsNeeded) {
        console.warn(`⚠️ Seulement ${repechageTeams.length} repêchés disponibles sur ${slotsNeeded} nécessaires`);
      }
    } else {
      console.log(`✅ Nombre de qualifiés (${qualifiedTeams.length}) = puissance de 2, pas de repêchage nécessaire`);
    }

    // Fusionner qualifiés directs + repêchés
    const allTeams = [
      ...qualifiedTeams,
      ...repechageTeams.map(t => ({ teamId: t.teamId, teamName: t.teamName }))
    ];

    // Mélanger aléatoirement pour des matchs équitables
    const shuffledTeams = [...allTeams].sort(() => Math.random() - 0.5);
    console.log(`🎲 ${allTeams.length} équipes mélangées pour la phase d'élimination (${qualifiedTeams.length} directs + ${repechageTeams.length} repêchés)`);

    // Générer les matchs d'élimination
    const batch = writeBatch(db);
    const matchesRef = collection(db, `tournaments/${tournamentId}/matches`);
    const numMatches = Math.floor(shuffledTeams.length / 2);
    const firstRoundNumber = 1;

    for (let i = 0; i < numMatches; i++) {
      const team1 = shuffledTeams[i * 2];
      const team2 = shuffledTeams[i * 2 + 1];

      const matchData: Omit<TournamentMatch, 'id'> = {
        tournamentId,
        gameMode: tournament.gameMode,
        phaseType: 'elimination',
        round: firstRoundNumber,
        matchNumber: i + 1,
        team1Id: team1.teamId,
        team1Name: team1.teamName,
        team2Id: team2.teamId,
        team2Name: team2.teamName,
        status: 'pending',
        createdAt: new Date()
      };

      const newMatchRef = doc(matchesRef);
      batch.set(newMatchRef, {
        ...matchData,
        createdAt: serverTimestamp()
      });
    }

    await batch.commit();

    const summary = {
      directQualified: qualifiedTeams.length,
      repechageCount: repechageTeams.length,
      totalTeams: allTeams.length,
      repechageTeams: repechageTeams.map(t => ({
        teamName: t.teamName,
        groupName: t.groupName,
        points: t.points,
        kills: t.kills
      }))
    };

    console.log(`\n🏆 Phase d'élimination générée avec succès !`);
    console.log(`   - Qualifiés directs: ${summary.directQualified}`);
    console.log(`   - Repêchés: ${summary.repechageCount}`);
    console.log(`   - Total: ${summary.totalTeams} équipes → ${numMatches} matchs`);

    return summary;
  }

  /**
   * Supprimer tous les matchs d'un tournoi
   */
  static async deleteAllMatches(tournamentId: string): Promise<void> {
    const matchesQuery = query(collection(db, `tournaments/${tournamentId}/matches`));
    const snapshot = await getDocs(matchesQuery);

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Tous les matchs du tournoi ${tournamentId} ont été supprimés`);
  }

  /**
   * Supprimer uniquement les matchs d'élimination d'un tournoi
   */
  static async deleteEliminationMatches(tournamentId: string): Promise<void> {
    const matchesQuery = query(
      collection(db, `tournaments/${tournamentId}/matches`),
      where('phaseType', '==', 'elimination')
    );
    const snapshot = await getDocs(matchesQuery);

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`${snapshot.size} matchs d'élimination supprimés du tournoi ${tournamentId}`);
  }
}
