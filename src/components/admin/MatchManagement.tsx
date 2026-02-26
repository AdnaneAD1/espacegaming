'use client';

import { useState, useEffect, useCallback } from 'react';
import { TournamentMatch, Tournament, TournamentTeam, TournamentKillLeaderboard, KillLeaderboardEntry } from '@/types/tournament-multi';
import { MatchService } from '@/services/matchService';
import { KillLeaderboardService } from '@/services/killLeaderboardService';
import { GameModeUtils } from '@/types/game-modes';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Swords, Trophy, Clock, CheckCircle, Play, Loader2, Target, GitBranch, X, Crown, Flame, Zap, TrendingUp, Medal, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import EliminationBracketTree from '@/components/tournament/EliminationBracketTree';
import WildcardsModal from '@/components/tournament/WildcardsModal';

interface MatchManagementProps {
  tournamentId: string;
  tournament: Tournament;
}

export default function MatchManagement({ tournamentId, tournament }: MatchManagementProps) {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [matchResult, setMatchResult] = useState({
    winnerId: '',
    team1Score: 0,
    team2Score: 0,
    team1Kills: 0,
    team2Kills: 0,
    team1PlayerStats: [] as { playerId: string; pseudo: string; kills: number }[],
    team2PlayerStats: [] as { playerId: string; pseudo: string; kills: number }[]
  });
  const [showKillLeaderboard, setShowKillLeaderboard] = useState(false);
  const [killLeaderboard, setKillLeaderboard] = useState<TournamentKillLeaderboard | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [globalRecords, setGlobalRecords] = useState<{
    topTotalKills: KillLeaderboardEntry | null;
    topAverageKills: KillLeaderboardEntry | null;
    topSingleGame: KillLeaderboardEntry | null;
  } | null>(null);
  const [showGroupStandings, setShowGroupStandings] = useState<string | null>(null);
  const [groupStandings, setGroupStandings] = useState<{
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    kills: number;
    points: number;
  }[]>([]);
  const [showBracket, setShowBracket] = useState(false);
  const [showWildcardsModal, setShowWildcardsModal] = useState(false);

  // Charger les matchs et les équipes
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Charger les matchs
      const matchesData = await MatchService.getMatches(tournamentId);
      console.log('Matchs chargés:', matchesData.length, matchesData);
      setMatches(matchesData);

      // Charger les équipes
      const teamsSnapshot = await getDocs(collection(db, `tournaments/${tournamentId}/teams`));
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TournamentTeam[];
      const validatedTeams = teamsData.filter(t => t.status === 'validated');
      console.log('Équipes validées:', validatedTeams.length, validatedTeams);
      setTeams(validatedTeams);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Générer les matchs automatiquement
  const handleGenerateMatches = async () => {
    if (teams.length < 2) {
      toast.error('Au moins 2 équipes validées sont nécessaires');
      return;
    }

    if (matches.length > 0) {
      if (!confirm('Des matchs existent déjà. Voulez-vous les supprimer et en générer de nouveaux ?')) {
        return;
      }
      await MatchService.deleteAllMatches(tournamentId);
    }

    setGenerating(true);
    try {
      await MatchService.generateMatches(tournamentId, tournament, teams);
      await loadData();
      toast.success('Matchs générés avec succès !');
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast.error('Erreur lors de la génération des matchs');
    } finally {
      setGenerating(false);
    }
  };

  // Générer la phase d'élimination après les groupes
  const handleGenerateEliminationPhase = async () => {
    // Vérifier si des résultats existent déjà - bloquer complètement
    const hasResults = eliminationMatches.some(m => m.status === 'completed' || m.status === 'in_progress');
    if (hasResults) {
      toast.error('Impossible de régénérer : des résultats ont déjà été enregistrés dans la phase éliminatoire');
      return;
    }

    // Vérifier si des matchs d'élimination existent déjà (sans résultats)
    if (eliminationMatches.length > 0) {
      const confirmed = confirm(
        'Des matchs d\'élimination existent déjà (sans résultats).\n\n' +
        'Voulez-vous les supprimer et régénérer la phase éliminatoire ?'
      );
      if (!confirmed) return;

      // Supprimer les matchs d'élimination existants
      await MatchService.deleteEliminationMatches(tournamentId);
    } else {
      const confirmed = confirm('Générer la phase d\'élimination avec les équipes qualifiées ?');
      if (!confirmed) return;
    }

    setGenerating(true);
    try {
      const summary = await MatchService.generateEliminationFromGroups(tournamentId, tournament);
      await loadData();

      if (summary.repechageCount > 0) {
        const repechageNames = summary.repechageTeams.map(t => `${t.teamName} (${t.groupName}, ${t.points}pts/${t.kills}kills)`).join(', ');
        toast.success(
          `Phase d'élimination générée ! ${summary.directQualified} qualifiés directs + ${summary.repechageCount} repêchés = ${summary.totalTeams} équipes`,
          { duration: 6000 }
        );
        toast(`🔄 Repêchés : ${repechageNames}`, { duration: 8000, icon: '🏆' });
      } else {
        toast.success(`Phase d'élimination générée avec ${summary.totalTeams} équipes qualifiées !`);
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast.error('Erreur lors de la génération de la phase d\'élimination');
    } finally {
      setGenerating(false);
    }
  };

  // Ouvrir le modal pour enregistrer un résultat
  const handleOpenResultModal = async (match: TournamentMatch) => {
    setSelectedMatch(match);
    setShowResultModal(true); // ✅ Ouvrir le modal immédiatement
    setSavingResult(true); // Afficher un loader pendant le chargement

    // Charger les joueurs des deux équipes
    try {
      const team1Ref = doc(db, `tournaments/${tournamentId}/teams`, match.team1Id);
      const team2Ref = doc(db, `tournaments/${tournamentId}/teams`, match.team2Id);

      const team1Snap = await getDoc(team1Ref);
      const team2Snap = await getDoc(team2Ref);

      const team1Data = team1Snap.data() as TournamentTeam;
      const team2Data = team2Snap.data() as TournamentTeam;

      const team1Players = team1Data?.players || [];
      const team2Players = team2Data?.players || [];

      setMatchResult({
        winnerId: '',
        team1Score: 0,
        team2Score: 0,
        team1Kills: 0,
        team2Kills: 0,
        team1PlayerStats: team1Players.map(p => ({ playerId: p.id, pseudo: p.pseudo, kills: 0 })),
        team2PlayerStats: team2Players.map(p => ({ playerId: p.id, pseudo: p.pseudo, kills: 0 }))
      });
    } catch (error) {
      console.error('Erreur lors du chargement des joueurs:', error);
      toast.error('Erreur lors du chargement des joueurs');
      setShowResultModal(false); // Fermer le modal en cas d'erreur
    } finally {
      setSavingResult(false); // Retirer le loader
    }
  };

  // Enregistrer le résultat d'un match (1 manche)
  const handleSaveResult = async () => {
    if (!selectedMatch || !matchResult.winnerId) {
      toast.error('Veuillez sélectionner un gagnant');
      return;
    }

    setSavingResult(true);

    const isMPMode = GameModeUtils.isMultiplayerMode(tournament.gameMode);
    const bestOf = isMPMode ? (tournament.customFormat?.bestOf || 3) : 1;
    const requiredWins = Math.ceil(bestOf / 2);

    // Récupérer le score actuel du match (s'il existe déjà des manches)
    const currentResult = selectedMatch.matchResult;
    const currentTeam1Score = currentResult?.team1Stats.roundsWon || 0;
    const currentTeam2Score = currentResult?.team2Stats.roundsWon || 0;
    const currentRounds = currentResult?.rounds || [];

    // Calculer le nouveau score après cette manche
    let newTeam1Score = currentTeam1Score;
    let newTeam2Score = currentTeam2Score;

    if (matchResult.winnerId === selectedMatch.team1Id) {
      newTeam1Score += 1; // Team 1 gagne cette manche
    } else {
      newTeam2Score += 1; // Team 2 gagne cette manche
    }

    // Vérifier si le match est terminé
    const isMatchComplete = newTeam1Score >= requiredWins || newTeam2Score >= requiredWins;

    const loserId = matchResult.winnerId === selectedMatch.team1Id
      ? selectedMatch.team2Id
      : selectedMatch.team1Id;
    const winnerName = matchResult.winnerId === selectedMatch.team1Id
      ? selectedMatch.team1Name
      : selectedMatch.team2Name;
    const loserName = matchResult.winnerId === selectedMatch.team1Id
      ? selectedMatch.team2Name
      : selectedMatch.team1Name;

    try {
      // Créer l'objet de cette manche
      const newRound = {
        roundNumber: currentRounds.length + 1,
        winnerId: matchResult.winnerId,
        winnerName,
        team1Kills: matchResult.team1Kills,
        team2Kills: matchResult.team2Kills,
        team1PlayerStats: matchResult.team1PlayerStats,
        team2PlayerStats: matchResult.team2PlayerStats
      };

      // Ajouter cette manche à l'historique
      const updatedRounds = [...currentRounds, newRound];

      // Calculer les kills totaux (somme de toutes les manches)
      const totalTeam1Kills = (currentResult?.team1Stats.totalKills || 0) + matchResult.team1Kills;
      const totalTeam2Kills = (currentResult?.team2Stats.totalKills || 0) + matchResult.team2Kills;

      // Calculer les kills totaux par joueur (somme de toutes les manches)
      const currentTeam1PlayerStats = currentResult?.team1Stats.playerStats || [];
      const currentTeam2PlayerStats = currentResult?.team2Stats.playerStats || [];

      const updatedTeam1PlayerStats = matchResult.team1PlayerStats.map(newStat => {
        const existingStat = currentTeam1PlayerStats.find(s => s.playerId === newStat.playerId);
        return {
          ...newStat,
          kills: (existingStat?.kills || 0) + newStat.kills
        };
      });

      const updatedTeam2PlayerStats = matchResult.team2PlayerStats.map(newStat => {
        const existingStat = currentTeam2PlayerStats.find(s => s.playerId === newStat.playerId);
        return {
          ...newStat,
          kills: (existingStat?.kills || 0) + newStat.kills
        };
      });

      const finalScore = isMPMode
        ? `${newTeam1Score}-${newTeam2Score}`
        : `${matchResult.team1Kills}-${matchResult.team2Kills}`;

      const result: TournamentMatch['matchResult'] = {
        bestOf: bestOf as 3 | 5,
        finalScore,
        team1Stats: {
          roundsWon: newTeam1Score,
          totalKills: totalTeam1Kills,
          playerStats: updatedTeam1PlayerStats
        },
        team2Stats: {
          roundsWon: newTeam2Score,
          totalKills: totalTeam2Kills,
          playerStats: updatedTeam2PlayerStats
        },
        rounds: updatedRounds
      };

      // Déterminer le gagnant final du match (si terminé)
      const finalWinnerId = isMatchComplete
        ? (newTeam1Score > newTeam2Score ? selectedMatch.team1Id : selectedMatch.team2Id)
        : matchResult.winnerId; // Temporaire si match en cours

      const finalWinnerName = isMatchComplete
        ? (newTeam1Score > newTeam2Score ? selectedMatch.team1Name : selectedMatch.team2Name)
        : winnerName;

      const finalLoserId = isMatchComplete
        ? (newTeam1Score > newTeam2Score ? selectedMatch.team2Id : selectedMatch.team1Id)
        : loserId;

      const finalLoserName = isMatchComplete
        ? (newTeam1Score > newTeam2Score ? selectedMatch.team2Name : selectedMatch.team1Name)
        : loserName;

      await MatchService.recordMatchResult(
        tournamentId,
        selectedMatch.id,
        finalWinnerId,
        finalWinnerName,
        finalLoserId,
        finalLoserName,
        result,
        isMatchComplete  // ✅ Passer le statut du match
      );

      // ✅ Mettre à jour le Kill Leaderboard après chaque manche/match
      try {
        // Mettre à jour pour les joueurs de l'équipe 1 (même avec 0 kill)
        for (const playerStat of matchResult.team1PlayerStats) {
          await KillLeaderboardService.updatePlayerKillStats(
            tournamentId,
            tournament.gameMode,
            playerStat.playerId,
            playerStat.pseudo,
            selectedMatch.team1Id,
            selectedMatch.team1Name,
            playerStat.kills // Peut être 0
          );
        }

        // Mettre à jour pour les joueurs de l'équipe 2 (même avec 0 kill)
        for (const playerStat of matchResult.team2PlayerStats) {
          await KillLeaderboardService.updatePlayerKillStats(
            tournamentId,
            tournament.gameMode,
            playerStat.playerId,
            playerStat.pseudo,
            selectedMatch.team2Id,
            selectedMatch.team2Name,
            playerStat.kills // Peut être 0
          );
        }

        // Recalculer le classement
        await KillLeaderboardService.recalculateLeaderboard(tournamentId, tournament.gameMode);
      } catch (leaderboardError) {
        console.error('Erreur lors de la mise à jour du Kill Leaderboard:', leaderboardError);
        // Ne pas bloquer l'enregistrement du match si le leaderboard échoue
      }

      // Vérifier si le tour est terminé et générer le suivant
      // (sauf si c'est la finale ou la petite finale)
      if (selectedMatch.phaseType === 'play_in') {
        // Vérifier si tous les matchs play-in sont terminés
        const allPlayInMatches = await MatchService.getMatchesByPhaseType(tournamentId, 'play_in');
        const allPlayInCompleted = allPlayInMatches.every(m => m.status === 'completed');

        if (allPlayInCompleted) {
          console.log('✅ Tous les matchs play-in sont terminés. Génération de l\'élimination...');
          alert('Tous les matchs play-in sont terminés. L\'élimination va être générée automatiquement.');

          // Générer l'élimination après le play-in
          await MatchService.generateEliminationAfterPlayIn(tournamentId, tournament.gameMode);
          toast.success('Élimination générée avec succès après le play-in !');
          await loadData(); // Recharger pour afficher les nouveaux matchs
        }
      } else if (selectedMatch.round) {
        const isCompleted = await MatchService.isRoundCompleted(tournamentId, selectedMatch.round);
        if (isCompleted) {
          // Vérifier si c'est le dernier tour (finale + petite finale)
          const allMatches = await MatchService.getMatchesByRound(tournamentId, selectedMatch.round);
          const hasFinale = allMatches.some(m => !m.isThirdPlaceMatch);
          const hasThirdPlace = allMatches.some(m => m.isThirdPlaceMatch);

          // Si c'est le dernier tour (finale + petite finale), ne pas proposer de générer
          if (hasFinale && hasThirdPlace) {
            console.log('🏆 Finale et petite finale terminées. Tournoi terminé !');
            toast.success('🏆 Tournoi terminé ! Félicitations aux gagnants !');
          } else {
            // Sinon, informer et générer automatiquement le tour suivant
            alert('Tous les matchs de ce tour sont terminés. Le tour suivant va être généré automatiquement.');
            await MatchService.generateNextRoundMatches(tournamentId, tournament.gameMode, selectedMatch.round);
            toast.success('Tour suivant généré avec succès !');
            await loadData(); // Recharger pour afficher les nouveaux matchs
          }
        }
      }

      if (isMatchComplete) {
        // Match terminé : recharger les données et fermer le modal
        await loadData();
        toast.success(`Match terminé ! ${finalWinnerName} remporte le match ${finalScore} 🏆`);
        setShowResultModal(false);
      } else {
        // Manche enregistrée : mettre à jour selectedMatch sans recharger tout
        setSelectedMatch({
          ...selectedMatch,
          status: 'in_progress',
          matchResult: result
        });

        toast.success(`Manche ${currentRounds.length + 1} enregistrée ! Score actuel : ${finalScore}`);

        // Réinitialiser le formulaire pour la prochaine manche
        setMatchResult({
          winnerId: '',
          team1Score: 0,
          team2Score: 0,
          team1Kills: 0,
          team2Kills: 0,
          team1PlayerStats: matchResult.team1PlayerStats.map(p => ({ ...p, kills: 0 })),
          team2PlayerStats: matchResult.team2PlayerStats.map(p => ({ ...p, kills: 0 }))
        });

        // Recharger les données en arrière-plan (sans fermer le modal)
        loadData();
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Erreur lors de l\'enregistrement du résultat');
    } finally {
      setSavingResult(false);
    }
  };

  // Charger le Kill Leaderboard
  const loadKillLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const leaderboard = await KillLeaderboardService.getKillLeaderboard(tournamentId, tournament.gameMode);
      setKillLeaderboard(leaderboard);

      // Charger aussi les records globaux
      const records = await KillLeaderboardService.getGlobalRecordsByMode(tournament.gameMode);
      setGlobalRecords(records);

      setShowKillLeaderboard(true);
    } catch (error) {
      console.error('Erreur lors du chargement du Kill Leaderboard:', error);
      toast.error('Erreur lors du chargement du classement des killeurs');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Charger le classement d'un groupe
  const loadGroupStandings = async (groupName: string) => {
    try {
      const standings = await MatchService.getGroupStandings(tournamentId, groupName);
      setGroupStandings(standings);
      setShowGroupStandings(groupName);
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
      toast.error('Erreur lors du chargement du classement');
    }
  };

  // Charger le classement d'un bloc du play-in
  const loadPlayInBlocStandings = async (blocType: 'A' | 'B') => {
    try {
      const standings = await MatchService.getPlayInBlocStandings(tournamentId, blocType);
      setGroupStandings(standings);
      setShowGroupStandings(`Bloc ${blocType}`);
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
      toast.error('Erreur lors du chargement du classement');
    }
  };

  // Grouper les matchs par phase et par groupe/tour
  const groupStageMatches = matches.filter(m => m.phaseType === 'group_stage');
  const playInMatches = matches.filter(m => m.phaseType === 'play_in');
  const eliminationMatches = matches.filter(m => m.phaseType === 'elimination');

  console.log('Filtrage matchs - Total:', matches.length, 'Groupes:', groupStageMatches.length, 'Play-in:', playInMatches.length, 'Élimination:', eliminationMatches.length);

  // Grouper les matchs de groupe par nom de groupe
  const matchesByGroup = groupStageMatches.reduce((acc, match) => {
    const groupName = match.groupName || 'Groupe';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(match);
    return acc;
  }, {} as Record<string, TournamentMatch[]>);

  // Grouper les matchs d'élimination par tour
  const matchesByRound = eliminationMatches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, TournamentMatch[]>);

  console.log('Groupes de matchs:', Object.keys(matchesByGroup), 'Tours:', Object.keys(matchesByRound));

  // Calculer le nombre total de rounds prévus basé sur le nombre d'équipes au premier round
  const firstRound = Object.keys(matchesByRound).length > 0
    ? Math.min(...Object.keys(matchesByRound).map(Number))
    : 0;
  const firstRoundMatches = firstRound > 0 ? matchesByRound[firstRound] : [];
  const initialTeamsCount = firstRoundMatches.length * 2;
  const totalRounds = initialTeamsCount > 0 ? Math.ceil(Math.log2(initialTeamsCount)) : 0;
  const hasGroupStage = groupStageMatches.length > 0;
  const groupStageCompleted = hasGroupStage && groupStageMatches.every(m => m.status === 'completed');
  const hasEliminationResults = eliminationMatches.some(m => m.status === 'completed' || m.status === 'in_progress');
  const canGenerateElimination = groupStageCompleted &&
    tournament.customFormat?.tournamentFormat === 'groups_then_elimination';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-4">
          <div className="flex items-center gap-3">
            <Swords className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion des Matchs</h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {matches.length} match{matches.length > 1 ? 's' : ''} • {teams.length} équipe{teams.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <button
              onClick={loadKillLeaderboard}
              disabled={loadingLeaderboard}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loadingLeaderboard ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Meilleurs Killeurs</span>
              <span className="sm:hidden">Killeurs</span>
            </button>
            {(() => {
              // Vérifier si des résultats ont été enregistrés
              const hasResults = matches.some(m => m.status === 'completed' || m.status === 'in_progress');

              return (
                <button
                  onClick={handleGenerateMatches}
                  disabled={generating || teams.length < 2 || hasResults}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  title={hasResults ? 'Impossible de régénérer : des résultats ont déjà été enregistrés' : ''}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{matches.length > 0 ? 'Régénérer les matchs' : 'Générer les matchs'}</span>
                  <span className="sm:hidden">{matches.length > 0 ? 'Régénérer' : 'Générer'}</span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* Badge de format du tournoi */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          {(() => {
            const format = tournament.customFormat?.tournamentFormat || 'elimination_direct';
            const isMPMode = GameModeUtils.isMultiplayerMode(tournament.gameMode);
            const bestOf = tournament.customFormat?.bestOf;

            let formatLabel = '';
            let formatColor = '';

            switch (format) {
              case 'elimination_direct':
                formatLabel = 'Élimination Directe';
                formatColor = 'bg-red-100 text-red-800 border-red-300';
                break;
              case 'groups_then_elimination':
                formatLabel = 'Groupes puis Élimination';
                formatColor = 'bg-blue-100 text-blue-800 border-blue-300';
                break;
              case 'groups_only':
                formatLabel = 'Groupes Uniquement';
                formatColor = 'bg-green-100 text-green-800 border-green-300';
                break;
            }

            return (
              <>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${formatColor}`}>
                  📋 {formatLabel}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-purple-100 text-purple-800 border-purple-300">
                  🎮 {GameModeUtils.getDisplayName(tournament.gameMode)}
                </span>
                {isMPMode && bestOf && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-orange-100 text-orange-800 border-orange-300">
                    🏆 BO{bestOf}
                  </span>
                )}
                {format === 'groups_then_elimination' && tournament.customFormat?.groupStage && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-indigo-100 text-indigo-800 border-indigo-300">
                    👥 {tournament.customFormat.groupStage.teamsPerGroup} équipes/groupe • Top {tournament.customFormat.groupStage.qualifiersPerGroup} qualifiés
                  </span>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Bouton pour générer la phase d'élimination */}
      {canGenerateElimination && (
        <div className={`border-2 rounded-xl p-6 ${eliminationMatches.length === 0
            ? 'bg-green-50 border-green-500'
            : hasEliminationResults
              ? 'bg-orange-50 border-orange-500'
              : 'bg-blue-50 border-blue-500'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-bold mb-2 ${eliminationMatches.length === 0
                  ? 'text-green-900'
                  : hasEliminationResults
                    ? 'text-orange-900'
                    : 'text-blue-900'
                }`}>
                {eliminationMatches.length === 0
                  ? 'Phase de groupes terminée !'
                  : 'Régénérer la phase éliminatoire'}
              </h3>
              <p className={`text-sm ${eliminationMatches.length === 0
                  ? 'text-green-700'
                  : hasEliminationResults
                    ? 'text-orange-700'
                    : 'text-blue-700'
                }`}>
                {eliminationMatches.length === 0
                  ? 'Tous les matchs de groupe sont terminés. Vous pouvez maintenant générer la phase d\'élimination.'
                  : hasEliminationResults
                    ? '⚠️ Attention : Des résultats existent déjà. La régénération les supprimera définitivement.'
                    : 'Vous pouvez régénérer la phase éliminatoire (aucun résultat enregistré).'}
              </p>
            </div>
            <button
              onClick={handleGenerateEliminationPhase}
              disabled={generating || hasEliminationResults}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 font-semibold text-white ${eliminationMatches.length === 0
                  ? 'bg-green-600 hover:bg-green-700'
                  : hasEliminationResults
                    ? 'bg-orange-600 hover:bg-orange-700 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              title={hasEliminationResults ? 'Impossible de régénérer : des résultats ont été enregistrés' : ''}
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trophy className="w-5 h-5" />
              )}
              {eliminationMatches.length === 0 ? 'Générer' : 'Régénérer'} la phase d&apos;élimination
            </button>
          </div>
        </div>
      )}

      {/* Liste des matchs */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Swords className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun match généré</h3>
          <p className="text-gray-600 mb-6">
            Cliquez sur &quot;Générer les matchs&quot; pour créer automatiquement {
              tournament.customFormat?.tournamentFormat === 'elimination_direct' ? 'le bracket d\'élimination' :
                tournament.customFormat?.tournamentFormat === 'groups_only' ? 'les matchs de groupes' :
                  'les matchs de groupes et la phase d\'élimination'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Affichage de la phase d'élimination EN PREMIER */}
          {eliminationMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-purple-500" />
                  Phase d&apos;Élimination
                </h2>
                <button
                  onClick={() => setShowBracket(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-semibold"
                >
                  <GitBranch className="w-5 h-5" />
                  Voir le Bracket
                </button>
              </div>
              {/* Tri DÉCROISSANT : Finale → Demi → Quarts → etc. */}
              {Object.keys(matchesByRound)
                .map(Number)
                .sort((a, b) => b - a)
                .map(round => {
                  // Séparer les matchs normaux et la petite finale
                  const regularMatches = matchesByRound[round].filter(m => !m.isThirdPlaceMatch);
                  const thirdPlaceMatch = matchesByRound[round].find(m => m.isThirdPlaceMatch);

                  return (
                    <div key={round} className="space-y-4">
                      {/* Matchs normaux du round */}
                      {regularMatches.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-purple-500" />
                            {MatchService.getRoundName(round, totalRounds)}
                          </h3>
                          <div className="space-y-3">
                            {regularMatches.map(match => (
                              <div
                                key={match.id}
                                className={`border-2 rounded-lg p-4 transition-all ${match.status === 'completed'
                                    ? 'border-green-300 bg-green-50'
                                    : match.status === 'in_progress'
                                      ? 'border-blue-300 bg-blue-50'
                                      : 'border-gray-200 bg-white'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm font-medium text-gray-500">Match {match.matchNumber}</span>
                                      {match.status === 'completed' && (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      )}
                                      {match.status === 'in_progress' && (
                                        <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                                      )}
                                    </div>
                                    <div className="mt-2 space-y-1">
                                      <div className={`flex items-center justify-between gap-2 ${match.winnerId === match.team1Id ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                        <div className="flex items-center gap-2">
                                          {match.winnerId === match.team1Id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                          {match.team1Name}
                                        </div>
                                        {match.status === 'completed' && match.matchResult && (
                                          <span className="text-lg font-bold">{match.matchResult.team1Stats.roundsWon}</span>
                                        )}
                                      </div>
                                      <div className="text-gray-400 text-sm">VS</div>
                                      <div className={`flex items-center justify-between gap-2 ${match.winnerId === match.team2Id ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                        <div className="flex items-center gap-2">
                                          {match.winnerId === match.team2Id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                          {match.team2Name}
                                        </div>
                                        {match.status === 'completed' && match.matchResult && (
                                          <span className="text-lg font-bold">{match.matchResult.team2Stats.roundsWon}</span>
                                        )}
                                      </div>
                                      {match.status === 'completed' && match.matchResult && (
                                        <div className="text-xs text-gray-500 mt-2">
                                          Score final: {match.matchResult.finalScore} • Kills: {match.matchResult.team1Stats.totalKills}-{match.matchResult.team2Stats.totalKills}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {(match.status === 'pending' || match.status === 'in_progress') && (
                                    <button
                                      onClick={() => handleOpenResultModal(match)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                      <Target className="w-4 h-4" />
                                      {match.status === 'in_progress' ? 'Continuer le match' : 'Enregistrer résultat'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Petite finale (3ème place) */}
                      {thirdPlaceMatch && (
                        <div className="bg-white rounded-xl shadow-sm border-2 border-orange-300 p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Medal className="w-5 h-5 text-orange-600" />
                            Petite Finale (3ème place)
                          </h3>
                          <div className="space-y-3">
                            <div
                              className={`border-2 rounded-lg p-4 transition-all ${thirdPlaceMatch.status === 'completed'
                                  ? 'border-green-300 bg-green-50'
                                  : thirdPlaceMatch.status === 'in_progress'
                                    ? 'border-blue-300 bg-blue-50'
                                    : 'border-gray-200 bg-white'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-500">Match {thirdPlaceMatch.matchNumber}</span>
                                    {thirdPlaceMatch.status === 'completed' && (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    )}
                                    {thirdPlaceMatch.status === 'in_progress' && (
                                      <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                                    )}
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    <div className={`flex items-center justify-between gap-2 ${thirdPlaceMatch.winnerId === thirdPlaceMatch.team1Id ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                      <div className="flex items-center gap-2">
                                        {thirdPlaceMatch.winnerId === thirdPlaceMatch.team1Id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                        {thirdPlaceMatch.team1Name}
                                      </div>
                                      {thirdPlaceMatch.status === 'completed' && thirdPlaceMatch.matchResult && (
                                        <span className="text-lg font-bold">{thirdPlaceMatch.matchResult.team1Stats.roundsWon}</span>
                                      )}
                                    </div>
                                    <div className="text-gray-400 text-sm">VS</div>
                                    <div className={`flex items-center justify-between gap-2 ${thirdPlaceMatch.winnerId === thirdPlaceMatch.team2Id ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                      <div className="flex items-center gap-2">
                                        {thirdPlaceMatch.winnerId === thirdPlaceMatch.team2Id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                        {thirdPlaceMatch.team2Name}
                                      </div>
                                      {thirdPlaceMatch.status === 'completed' && thirdPlaceMatch.matchResult && (
                                        <span className="text-lg font-bold">{thirdPlaceMatch.matchResult.team2Stats.roundsWon}</span>
                                      )}
                                    </div>
                                    {thirdPlaceMatch.status === 'completed' && thirdPlaceMatch.matchResult && (
                                      <div className="text-xs text-gray-500 mt-2">
                                        Score final: {thirdPlaceMatch.matchResult.finalScore} • Kills: {thirdPlaceMatch.matchResult.team1Stats.totalKills}-{thirdPlaceMatch.matchResult.team2Stats.totalKills}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {(thirdPlaceMatch.status === 'pending' || thirdPlaceMatch.status === 'in_progress') && (
                                  <button
                                    onClick={() => handleOpenResultModal(thirdPlaceMatch)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                  >
                                    <Target className="w-4 h-4" />
                                    {thirdPlaceMatch.status === 'in_progress' ? 'Continuer le match' : 'Enregistrer résultat'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Affichage du Play-In (après l'élimination) */}
          {playInMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-orange-500" />
                  Play-In Tournament
                </h2>
              </div>

              {/* Bloc A - Matchs simples */}
              {playInMatches.filter(m => m.blocType === 'A').length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
                  <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-500" />
                    Bloc A - Matchs Simples
                  </h3>
                  <div className="space-y-3">
                    {playInMatches.filter(m => m.blocType === 'A').map(match => (
                      <div key={match.id} className={`border-2 rounded-lg p-4 transition-all ${match.status === 'completed' ? 'border-green-300 bg-green-50' :
                          match.status === 'in_progress' ? 'border-blue-300 bg-blue-50' :
                            'border-orange-200 bg-orange-50'
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500">Match {match.matchNumber}</span>
                          {match.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {match.status === 'in_progress' && <Clock className="w-4 h-4 text-blue-600 animate-pulse" />}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="mt-2 space-y-1">
                              <div className={`flex items-center justify-between ${match.winnerId === match.team1Id ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                <div className="flex items-center gap-2">
                                  {match.winnerId === match.team1Id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                  {match.team1Name}
                                </div>
                              </div>
                              <div className="text-gray-400 text-sm">VS</div>
                              <div className={`flex items-center justify-between ${match.winnerId === match.team2Id ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                <div className="flex items-center gap-2">
                                  {match.winnerId === match.team2Id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                  {match.team2Name}
                                </div>
                              </div>
                            </div>
                          </div>
                          {(match.status === 'pending' || match.status === 'in_progress') && (
                            <button
                              onClick={() => handleOpenResultModal(match)}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ml-4 whitespace-nowrap text-sm"
                            >
                              <Target className="w-4 h-4" />
                              {match.status === 'in_progress' ? 'Continuer' : 'Résultat'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bloc B - Poule */}
              {playInMatches.filter(m => m.blocType === 'B').length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-500" />
                      Bloc B - Poule Round-Robin
                    </h3>
                    <button
                      onClick={() => loadPlayInBlocStandings('B')}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <Trophy className="w-4 h-4" />
                      Classement
                    </button>
                  </div>
                  <div className="space-y-3">
                    {playInMatches.filter(m => m.blocType === 'B').map(match => (
                      <div key={match.id} className={`border-2 rounded-lg p-4 transition-all ${match.status === 'completed' ? 'border-green-300 bg-green-50' :
                          match.status === 'in_progress' ? 'border-blue-300 bg-blue-50' :
                            'border-orange-200 bg-orange-50'
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500">Match {match.matchNumber}</span>
                          {match.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {match.status === 'in_progress' && <Clock className="w-4 h-4 text-blue-600 animate-pulse" />}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="mt-2 space-y-1">
                              <div className={`flex items-center justify-between ${match.winnerId === match.team1Id ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                <div className="flex items-center gap-2">
                                  {match.winnerId === match.team1Id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                  {match.team1Name}
                                </div>
                              </div>
                              <div className="text-gray-400 text-sm">VS</div>
                              <div className={`flex items-center justify-between ${match.winnerId === match.team2Id ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                <div className="flex items-center gap-2">
                                  {match.winnerId === match.team2Id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                  {match.team2Name}
                                </div>
                              </div>
                            </div>
                          </div>
                          {(match.status === 'pending' || match.status === 'in_progress') && (
                            <button
                              onClick={() => handleOpenResultModal(match)}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ml-4 whitespace-nowrap text-sm"
                            >
                              <Target className="w-4 h-4" />
                              {match.status === 'in_progress' ? 'Continuer' : 'Résultat'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton pour afficher les wildcards si play-in */}
              <div className="flex justify-end">
                {(() => {
                  const playInCompleted = playInMatches.every(m => m.status === 'completed');
                  return (
                    <button
                      onClick={() => setShowWildcardsModal(true)}
                      disabled={!playInCompleted}
                      title={!playInCompleted ? 'Terminez tous les matchs du play-in pour voir le classement des wildcards' : ''}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-semibold ${playInCompleted
                          ? 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer'
                          : 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-60'
                        }`}
                    >
                      <Users className="w-5 h-5" />
                      Classement Wildcards
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Affichage des groupes EN DERNIER (après l'élimination et le play-in) */}
          {hasGroupStage && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-blue-500" />
                Phase de Groupes
              </h2>
              {Object.keys(matchesByGroup).sort().map(groupName => (
                <div key={groupName} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{groupName}</h3>
                    <button
                      onClick={() => loadGroupStandings(groupName)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <Trophy className="w-4 h-4" />
                      Classement
                    </button>
                  </div>
                  <div className="space-y-3">
                    {matchesByGroup[groupName].map(match => (
                      <div
                        key={match.id}
                        className={`border-2 rounded-lg p-4 transition-all ${match.status === 'completed'
                            ? 'border-green-300 bg-green-50'
                            : match.status === 'in_progress'
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 bg-white'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-gray-500">Match {match.matchNumber}</span>
                              {match.status === 'completed' && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {match.status === 'in_progress' && (
                                <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                              )}
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className={`flex items-center justify-between gap-2 ${match.winnerId === match.team1Id ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                <div className="flex items-center gap-2">
                                  {match.winnerId === match.team1Id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                  {match.team1Name}
                                </div>
                                {match.status === 'completed' && match.matchResult && (
                                  <span className="text-lg font-bold">{match.matchResult.team1Stats.roundsWon}</span>
                                )}
                              </div>
                              <div className="text-gray-400 text-sm">VS</div>
                              <div className={`flex items-center justify-between gap-2 ${match.winnerId === match.team2Id ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                                <div className="flex items-center gap-2">
                                  {match.winnerId === match.team2Id && <Trophy className="w-4 h-4 text-yellow-500" />}
                                  {match.team2Name}
                                </div>
                                {match.status === 'completed' && match.matchResult && (
                                  <span className="text-lg font-bold">{match.matchResult.team2Stats.roundsWon}</span>
                                )}
                              </div>
                              {match.status === 'completed' && match.matchResult && (
                                <div className="text-xs text-gray-500 mt-2">
                                  Score final: {match.matchResult.finalScore} • Kills: {match.matchResult.team1Stats.totalKills}-{match.matchResult.team2Stats.totalKills}
                                </div>
                              )}
                            </div>
                          </div>
                          {(match.status === 'pending' || match.status === 'in_progress') && (
                            <button
                              onClick={() => handleOpenResultModal(match)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <Target className="w-4 h-4" />
                              {match.status === 'in_progress' ? 'Continuer le match' : 'Enregistrer résultat'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal pour enregistrer un résultat */}
      {showResultModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl my-4 sm:my-8 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            {/* Header fixe */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Enregistrer le résultat</h3>
              {(() => {
                const currentResult = selectedMatch.matchResult;
                const currentScore = currentResult
                  ? `${currentResult.team1Stats.roundsWon}-${currentResult.team2Stats.roundsWon}`
                  : '0-0';
                const roundNumber = (currentResult?.rounds?.length || 0) + 1;
                const isMPMode = GameModeUtils.isMultiplayerMode(tournament.gameMode);
                const bestOf = isMPMode ? (tournament.customFormat?.bestOf || 3) : 1;

                return isMPMode && (
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold">
                      Manche {roundNumber}/{bestOf}
                    </span>
                    <span className="text-gray-600">
                      Score actuel : <span className="font-bold text-gray-900">{currentScore}</span>
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {(() => {
                const isMPMode = GameModeUtils.isMultiplayerMode(tournament.gameMode);
                const bestOf = tournament.customFormat?.bestOf || 3;
                const requiredWins = Math.ceil(bestOf / 2);

                return (
                  <div className="space-y-4 sm:space-y-6">
                    {isMPMode && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                        <p className="text-xs sm:text-sm text-blue-800 font-medium">
                          Format: BO{bestOf} (Premier à {requiredWins} victoire{requiredWins > 1 ? 's' : ''}) - Le score sera calculé automatiquement
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Gagnant</label>
                      <select
                        value={matchResult.winnerId}
                        onChange={(e) => setMatchResult({ ...matchResult, winnerId: e.target.value })}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner le gagnant</option>
                        <option value={selectedMatch.team1Id}>{selectedMatch.team1Name}</option>
                        <option value={selectedMatch.team2Id}>{selectedMatch.team2Name}</option>
                      </select>
                    </div>

                    {/* Kills par joueur - Équipe 1 */}
                    <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                        {selectedMatch.team1Name} - Kills par joueur
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {matchResult.team1PlayerStats.map((player, index) => (
                          <div key={player.playerId} className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs sm:text-sm text-gray-700 flex-1 truncate">{player.pseudo}</span>
                            <input
                              type="number"
                              min="0"
                              value={player.kills}
                              onChange={(e) => {
                                const newStats = [...matchResult.team1PlayerStats];
                                newStats[index].kills = parseInt(e.target.value) || 0;
                                const totalKills = newStats.reduce((sum, p) => sum + p.kills, 0);
                                setMatchResult({ ...matchResult, team1PlayerStats: newStats, team1Kills: totalKills });
                              }}
                              className="w-16 sm:w-20 bg-white border border-gray-300 text-gray-900 rounded-lg px-2 sm:px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                          <span className="font-semibold text-gray-900 text-sm sm:text-base">Total</span>
                          <span className="font-bold text-blue-600 text-base sm:text-lg">{matchResult.team1Kills}</span>
                        </div>
                      </div>
                    </div>

                    {/* Kills par joueur - Équipe 2 */}
                    <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                        {selectedMatch.team2Name} - Kills par joueur
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {matchResult.team2PlayerStats.map((player, index) => (
                          <div key={player.playerId} className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs sm:text-sm text-gray-700 flex-1 truncate">{player.pseudo}</span>
                            <input
                              type="number"
                              min="0"
                              value={player.kills}
                              onChange={(e) => {
                                const newStats = [...matchResult.team2PlayerStats];
                                newStats[index].kills = parseInt(e.target.value) || 0;
                                const totalKills = newStats.reduce((sum, p) => sum + p.kills, 0);
                                setMatchResult({ ...matchResult, team2PlayerStats: newStats, team2Kills: totalKills });
                              }}
                              className="w-16 sm:w-20 bg-white border border-gray-300 text-gray-900 rounded-lg px-2 sm:px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                          <span className="font-semibold text-gray-900 text-sm sm:text-base">Total</span>
                          <span className="font-bold text-blue-600 text-base sm:text-lg">{matchResult.team2Kills}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer fixe avec boutons */}
            <div className="p-4 sm:p-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleSaveResult}
                  disabled={savingResult}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base font-medium flex items-center justify-center gap-2"
                >
                  {savingResult && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingResult ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => setShowResultModal(false)}
                  disabled={savingResult}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kill Leaderboard */}
      {showKillLeaderboard && killLeaderboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 lg:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-6 h-6 text-orange-500" />
                  Classement des Meilleurs Killeurs
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Mode: {GameModeUtils.getDisplayName(tournament.gameMode)}
                </p>
              </div>
              <button
                onClick={() => setShowKillLeaderboard(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Records Globaux (tous tournois) */}
            {globalRecords && (globalRecords.topTotalKills || globalRecords.topAverageKills || globalRecords.topSingleGame) && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-bold text-gray-900">🏆 Records de Tous les Temps</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {globalRecords.topTotalKills && (
                    <div className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center gap-1 mb-1">
                        <Flame className="w-4 h-4 text-orange-600" />
                        <p className="text-xs text-orange-600 font-medium">Plus de Kills</p>
                      </div>
                      <p className="text-xl font-bold text-orange-700">{globalRecords.topTotalKills.killStats.totalKills}</p>
                      <p className="text-xs text-gray-600 truncate">{globalRecords.topTotalKills.playerName}</p>
                    </div>
                  )}
                  {globalRecords.topAverageKills && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Meilleure Moy.</p>
                      </div>
                      <p className="text-xl font-bold text-blue-700">{globalRecords.topAverageKills.killStats.averageKillsPerGame.toFixed(1)}</p>
                      <p className="text-xs text-gray-600 truncate">{globalRecords.topAverageKills.playerName}</p>
                    </div>
                  )}
                  {globalRecords.topSingleGame && (
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center gap-1 mb-1">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-purple-600 font-medium">Meilleur Match</p>
                      </div>
                      <p className="text-xl font-bold text-purple-700">{globalRecords.topSingleGame.killStats.bestSingleGame}</p>
                      <p className="text-xs text-gray-600 truncate">{globalRecords.topSingleGame.playerName}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center text-yellow-700 mt-2">⭐ Records établis sur tous les tournois</p>
              </div>
            )}

            {/* Statistiques du tournoi actuel */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-xs text-orange-600 font-medium">Total Kills (Tournoi)</p>
                <p className="text-2xl font-bold text-orange-700">{killLeaderboard.stats.totalKills}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium">Moyenne/Partie</p>
                <p className="text-2xl font-bold text-blue-700">{killLeaderboard.stats.averageKillsPerGame.toFixed(1)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-purple-600 font-medium">Record (Tournoi)</p>
                <p className="text-2xl font-bold text-purple-700">{killLeaderboard.stats.topPlayerTotalKills.kills}</p>
                <p className="text-xs text-purple-600 truncate">{killLeaderboard.stats.topPlayerTotalKills.playerName}</p>
              </div>
            </div>

            {/* Classement */}
            <div className="space-y-2">
              {killLeaderboard.entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun killeur enregistré pour le moment</p>
                </div>
              ) : (
                killLeaderboard.entries.map((entry, index) => (
                  <div
                    key={entry.playerId}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${index === 0
                        ? 'bg-yellow-50 border-yellow-400'
                        : index === 1
                          ? 'bg-gray-50 border-gray-300'
                          : index === 2
                            ? 'bg-orange-50 border-orange-300'
                            : 'bg-white border-gray-200'
                      }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0
                            ? 'bg-yellow-500 text-white'
                            : index === 1
                              ? 'bg-gray-400 text-white'
                              : index === 2
                                ? 'bg-orange-500 text-white'
                                : 'bg-blue-600 text-white'
                          }`}
                      >
                        {entry.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{entry.playerName}</p>
                        {entry.teamName && (
                          <p className="text-sm text-gray-600 truncate">{entry.teamName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">{entry.killStats.totalKills}</p>
                        <p className="text-xs text-gray-500">kills</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-lg font-semibold text-blue-600">{entry.killStats.averageKillsPerGame.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">moy/partie</p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-lg font-semibold text-purple-600">{entry.killStats.bestSingleGame}</p>
                        <p className="text-xs text-gray-500">meilleur</p>
                      </div>
                      <div className="text-right hidden lg:block">
                        <p className="text-sm text-gray-600">{entry.killStats.gamesPlayed}</p>
                        <p className="text-xs text-gray-500">parties</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowKillLeaderboard(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Classement de Groupe */}
      {showGroupStandings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-blue-500" />
                Classement - {showGroupStandings}
              </h3>
              <button
                onClick={() => setShowGroupStandings(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {groupStandings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun match terminé dans ce groupe</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {(() => {
                    // Utiliser qualifiersPerGroup depuis la config du tournoi
                    const qualifiersPerGroup = tournament.customFormat?.groupStage?.qualifiersPerGroup || 2;

                    return groupStandings.map((team, index) => {
                      const isQualified = index < qualifiersPerGroup;

                      return (
                        <div
                          key={team.teamId}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${index === 0
                              ? 'bg-yellow-50 border-yellow-400'
                              : isQualified
                                ? 'bg-green-50 border-green-400'
                                : 'bg-white border-gray-200'
                            }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0
                                  ? 'bg-yellow-500 text-white'
                                  : isQualified
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-600 text-white'
                                }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{team.teamName}</p>
                              <p className="text-sm text-gray-600">
                                {team.wins}V - {team.losses}D
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">{team.points}</p>
                              <p className="text-xs text-gray-500">points</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-orange-600">{team.kills}</p>
                              <p className="text-xs text-gray-500">kills</p>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="mt-4 bg-green-50 border border-green-300 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    <strong>Qualifiés :</strong> Les {tournament.customFormat?.groupStage?.qualifiersPerGroup || 2} premières équipes (fond vert) se qualifient pour la phase éliminatoire
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowGroupStandings(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bracket d'Élimination */}
      {showBracket && eliminationMatches.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* En-tête du modal - Style admin avec accents verts */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <GitBranch className="w-7 h-7 text-white" />
                <h3 className="text-2xl font-bold text-white">Bracket d&apos;Élimination</h3>
              </div>
              <button
                onClick={() => setShowBracket(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenu scrollable avec fond gris clair admin */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <EliminationBracketTree rounds={matchesByRound} />
            </div>

            {/* Footer - Style admin */}
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowBracket(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Wildcards */}
      <WildcardsModal
        isOpen={showWildcardsModal}
        onClose={() => setShowWildcardsModal(false)}
        tournamentId={tournamentId}
      />
    </div>
  );
}
