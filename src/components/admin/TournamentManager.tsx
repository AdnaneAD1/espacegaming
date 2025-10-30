'use client';
import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GameResult, TeamRanking, calculatePoints } from '@/types/tournament';
import { Team } from '@/types';
import { Tournament, TournamentResult, TournamentKillLeaderboard, KillLeaderboardEntry } from '@/types/tournament-multi';
import { TournamentService } from '@/services/tournamentService';
import { KillLeaderboardService } from '@/services/killLeaderboardService';
import { GameMode, GameModeUtils, GAME_MODES_CONFIG } from '@/types/game-modes';
import { toast } from 'react-hot-toast';
import { Trophy, Plus, Eye, Target, Award, Save, Loader2, Clock, Crown, Flame, Zap, TrendingUp } from 'lucide-react';
import MatchManagement from './MatchManagement';

interface TournamentManagerProps {
  teams: Team[];
  tournamentId?: string | null;
  onBackToList?: () => void;
}

export default function TournamentManager({ teams, tournamentId, onBackToList }: TournamentManagerProps) {
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [showAddResult, setShowAddResult] = useState(false);
  const [showKillLeaderboard, setShowKillLeaderboard] = useState(false);
  const [killLeaderboard, setKillLeaderboard] = useState<TournamentKillLeaderboard | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [globalRecords, setGlobalRecords] = useState<{
    topTotalKills: KillLeaderboardEntry | null;
    topAverageKills: KillLeaderboardEntry | null;
    topSingleGame: KillLeaderboardEntry | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
  const [newResult, setNewResult] = useState({
    teamId: '',
    placement: 1,
    kills: 0,
    // Pour les modes multijoueur BO3/BO5
    isMultiplayer: false,
    bestOf: 3 as 3 | 5,
    roundsWon: 0,
    roundsLost: 0,
    rounds: [] as {
      roundNumber: number;
      won: boolean;
      playerKills: { playerId: string; pseudo: string; kills: number }[];
    }[],
    // Stats individuelles des joueurs
    playerStats: [] as { playerId: string; pseudo: string; kills: number }[]
  });
  const [selectedTeamPlayers, setSelectedTeamPlayers] = useState<{ id: string; pseudo: string }[]>([]);

  // Charger les informations du tournoi
  useEffect(() => {
    if (!tournamentId) {
      // Si pas de tournamentId, utiliser les équipes globales pour rétrocompatibilité
      setTournamentTeams(teams);
      return;
    }

    // Charger les informations du tournoi
    const loadTournamentInfo = async () => {
      try {
        const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
        if (tournamentDoc.exists()) {
          const tournamentData = { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament;
          setTournament(tournamentData);
          
          // Adapter le formulaire selon le mode de jeu
          if (tournamentData.gameMode && GameModeUtils.isBestOfMode(tournamentData.gameMode)) {
            const bestOf = GameModeUtils.getBestOf(tournamentData.gameMode);
            setNewResult(prev => ({
              ...prev,
              isMultiplayer: true,
              bestOf: bestOf || 3,
              rounds: Array.from({ length: bestOf || 3 }, (_, i) => ({
                roundNumber: i + 1,
                won: false,
                playerKills: []
              }))
            }));
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du tournoi:', error);
        toast.error('Erreur lors du chargement du tournoi');
      }
    };

    // Charger les équipes du tournoi avec onSnapshot
    const unsubscribeTeams = onSnapshot(
      collection(db, `tournaments/${tournamentId}/teams`),
      (snapshot) => {
        const tournamentTeamsData = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as Team[];
        setTournamentTeams(tournamentTeamsData);
      }
    );

    loadTournamentInfo();

    return () => unsubscribeTeams();
  }, [tournamentId, teams]);

  // Calculer le classement
  const updateRankings = useCallback((results: GameResult[]) => {
    const teamStats: Record<string, TeamRanking> = {};

    // Initialiser les stats pour toutes les équipes validées
    tournamentTeams.filter(team => team.status === 'validated').forEach(team => {
      teamStats[team.id!] = {
        teamId: team.id!,
        teamName: team.name,
        totalPoints: 0,
        totalKills: 0,
        gamesPlayed: 0,
        averagePoints: 0,
        bestPlacement: 25,
        position: 0
      };
    });

    // Calculer les stats à partir des résultats (maximum 3 parties par équipe)
    results.forEach(result => {
      if (teamStats[result.teamId] && teamStats[result.teamId].gamesPlayed < 3) {
        teamStats[result.teamId].totalPoints += result.points;
        teamStats[result.teamId].totalKills += result.kills;
        teamStats[result.teamId].gamesPlayed += 1;
        teamStats[result.teamId].bestPlacement = Math.min(
          teamStats[result.teamId].bestPlacement,
          result.placement
        );
      }
    });

    // Calculer la moyenne des points pour chaque équipe
    Object.values(teamStats).forEach(team => {
      if (team.gamesPlayed > 0) {
        team.averagePoints = team.totalPoints / team.gamesPlayed;
      }
    });

    // Trier par points totaux, puis kills, puis moyenne
    setRankings(Object.values(teamStats).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
      return b.averagePoints - a.averagePoints;
    }).map((team, index) => ({ ...team, position: index + 1 })));
  }, [tournamentTeams]);

  // Charger les résultats du tournoi
  useEffect(() => {
    // Si pas de tournamentId spécifique, utiliser l'ancienne collection pour rétrocompatibilité
    const collectionPath = tournamentId 
      ? `tournaments/${tournamentId}/results`
      : 'tournament-results';
    
    const unsubscribe = onSnapshot(
      query(collection(db, collectionPath), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const results: GameResult[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          results.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          } as GameResult);
        });
        setGameResults(results);
        updateRankings(results);
      }
    );

    return () => unsubscribe();
  }, [updateRankings, tournamentId]);

  // Charger les joueurs de l'équipe sélectionnée
  const handleTeamSelection = (teamId: string) => {
    const team = tournamentTeams.find(t => t.id === teamId);
    if (team) {
      // Récupérer tous les joueurs (capitaine + joueurs non-capitaines uniquement)
      // Le capitaine est déjà dans team.players avec isCaptain: true, donc on filtre pour éviter les doublons
      const players = team.players.map(p => ({ id: p.id, pseudo: p.pseudo }));
      setSelectedTeamPlayers(players);
      
      // Initialiser playerStats avec 0 kills pour chaque joueur
      const initialPlayerStats = players.map(p => ({
        playerId: p.id,
        pseudo: p.pseudo,
        kills: 0
      }));
      
      setNewResult(prev => ({
        ...prev,
        teamId,
        playerStats: initialPlayerStats,
        kills: 0 // Réinitialiser le total
      }));
    } else {
      setNewResult(prev => ({ ...prev, teamId }));
      setSelectedTeamPlayers([]);
    }
  };

  // Mettre à jour les kills d'un joueur et recalculer le total
  const handlePlayerKillsChange = (playerId: string, kills: number) => {
    const updatedPlayerStats = newResult.playerStats.map(ps =>
      ps.playerId === playerId ? { ...ps, kills } : ps
    );
    
    // Calculer le total des kills
    const totalKills = updatedPlayerStats.reduce((sum, ps) => sum + ps.kills, 0);
    
    setNewResult(prev => ({
      ...prev,
      playerStats: updatedPlayerStats,
      kills: totalKills
    }));
  };

  // Ajouter un résultat de partie
  const handleAddResult = async () => {
    if (!newResult.teamId) {
      toast.error('Veuillez sélectionner une équipe');
      return;
    }

    const team = tournamentTeams.find(t => t.id === newResult.teamId);
    if (!team) {
      toast.error('Équipe introuvable');
      return;
    }

    // Vérifier si l'équipe a déjà joué 3 parties
    const teamRanking = rankings.find(r => r.teamId === newResult.teamId);
    if (teamRanking && teamRanking.gamesPlayed >= 3) {
      toast.error('Cette équipe a déjà joué le maximum de 3 parties');
      return;
    }

    // Calculer les points selon le mode de jeu du tournoi
    const gameMode = tournament?.gameMode || GameMode.BR_SQUAD;
    // Utiliser l'ancien système pour BR, nouveau pour MP
    const points = GameModeUtils.isMultiplayerMode(gameMode)
      ? GameModeUtils.calculatePoints(gameMode, newResult.placement, newResult.kills)
      : calculatePoints(newResult.placement, newResult.kills);

    // Utiliser la nouvelle structure multi-tournois ou l'ancienne pour rétrocompatibilité
    const collectionPath = tournamentId 
      ? `tournaments/${tournamentId}/results`
      : 'tournament-results';

    setIsLoading(true);
    try {
      const resultData: Partial<TournamentResult> = {
        gameNumber: gameResults.length + 1,
        teamId: newResult.teamId,
        teamName: team.name,
        placement: newResult.placement,
        kills: newResult.kills,
        points: points,
        timestamp: new Date(),
        ...(tournamentId && { tournamentId }),
        ...(tournament?.gameMode && { gameMode: tournament.gameMode }),
        // Ajouter les stats individuelles si elles existent
        ...(newResult.playerStats.length > 0 && { playerStats: newResult.playerStats })
      };

      const docRef = await addDoc(collection(db, collectionPath), resultData);

      // Mettre à jour le Kill Leaderboard
      if (tournamentId && tournament?.gameMode) {
        try {
          await KillLeaderboardService.updateKillLeaderboard(
            tournamentId,
            tournament.gameMode,
            { ...resultData, id: docRef.id } as TournamentResult
          );
          console.log('Kill Leaderboard mis à jour');
        } catch (error) {
          console.error('Erreur lors de la mise à jour du Kill Leaderboard:', error);
          // Ne pas bloquer si le leaderboard échoue
        }
      }

      // Mettre à jour automatiquement les statistiques du tournoi (kills et moyenne de points)
      if (tournamentId) {
        await TournamentService.updateTournamentStats(tournamentId);
        console.log('Statistiques du tournoi mises à jour automatiquement');
      }

      toast.success('Résultat ajouté avec succès ! Statistiques et Kill Leaderboard mis à jour.');
      setNewResult({ 
        teamId: '', 
        placement: 1, 
        kills: 0,
        isMultiplayer: false,
        bestOf: 3,
        roundsWon: 0,
        roundsLost: 0,
        rounds: [],
        playerStats: []
      });
      setSelectedTeamPlayers([]);
      setShowAddResult(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du résultat:', error);
      toast.error('Erreur lors de l\'ajout du résultat');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlacementColor = (placement: number) => {
    if (placement === 1) return 'text-yellow-400';
    if (placement === 2) return 'text-gray-300';
    if (placement === 3) return 'text-orange-400';
    if (placement <= 10) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return 'bg-yellow-500 text-black';
    if (position === 2) return 'bg-gray-400 text-black';
    if (position === 3) return 'bg-orange-500 text-white';
    return 'bg-blue-600 text-white';
  };

  // Charger le Kill Leaderboard
  const loadKillLeaderboard = async () => {
    if (!tournamentId || !tournament?.gameMode) {
      toast.error('Informations du tournoi manquantes');
      return;
    }

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

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-3">
            {onBackToList && (
              <button
                onClick={onBackToList}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm lg:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Retour</span>
              </button>
            )}
            <Trophy className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-500 flex-shrink-0" />
            <div className="min-w-0 flex-1 max-w-full overflow-hidden">
              <h2 className="text-lg lg:text-2xl font-bold text-gray-900 truncate">
                {tournament ? (
                  <>
                    <span className="hidden sm:inline">Gestion du Tournoi: </span>
                    <span className="sm:hidden">Tournoi: </span>
                    {tournament.name}
                  </>
                ) : 'Gestion du Tournoi'}
              </h2>
              {tournament && (
                <p className="text-xs lg:text-sm text-gray-500 line-clamp-2 break-words max-w-full">
                  {tournament.description}
                </p>
              )}
              {tournamentId && (
                <p className="text-xs text-gray-400 truncate">ID: {tournamentId}</p>
              )}
            </div>
          </div>
          {/* Boutons - Afficher uniquement pour les modes Battle Royale */}
          {tournament?.gameMode && !GameModeUtils.isMultiplayerMode(tournament.gameMode) && (
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <button
                onClick={loadKillLeaderboard}
                disabled={loadingLeaderboard}
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base disabled:opacity-50"
              >
                {loadingLeaderboard ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Meilleurs Killeurs</span>
                <span className="sm:hidden">Killeurs</span>
              </button>
              <button
                onClick={() => setShowAddResult(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter un résultat</span>
                <span className="sm:hidden">Ajouter</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Affichage conditionnel selon le mode de jeu */}
      {tournament?.gameMode && GameModeUtils.isMultiplayerMode(tournament.gameMode) ? (
        // Mode Multijoueur : Afficher uniquement MatchManagement
        tournamentId && tournament ? (
          <MatchManagement tournamentId={tournamentId} tournament={tournament} />
        ) : null
      ) : (
        // Mode Battle Royale : Afficher l'interface classique
        <>
          {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500 flex-shrink-0" />
            <span className="text-gray-600 text-xs lg:text-sm truncate">Parties jouées</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-gray-900">3</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-500 flex-shrink-0" />
            <span className="text-gray-600 text-xs lg:text-sm truncate">Équipes actives</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-gray-900">{tournamentTeams.filter(t => t.status === 'validated').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-4 h-4 lg:w-5 lg:h-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-600 text-xs lg:text-sm truncate">Total résultats</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-gray-900">{gameResults.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500 flex-shrink-0" />
            <span className="text-gray-600 text-xs lg:text-sm truncate">Leader</span>
          </div>
          <p className="text-base lg:text-lg font-bold text-gray-900 truncate">
            {rankings[0]?.teamName || 'Aucun'}
          </p>
        </div>
      </div>

      {/* Classement */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-500" />
          <span>Classement Général</span>
        </h3>
        
        {/* Version mobile - Cards */}
        <div className="block lg:hidden space-y-3">
          {rankings.map((team) => (
            <div key={team.teamId} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`inline-block px-2 py-1 rounded-full text-sm font-bold ${getPositionBadge(team.position)}`}>
                    #{team.position}
                  </span>
                  <span className="text-gray-900 font-medium truncate">{team.teamName}</span>
                </div>
                <span className="text-yellow-600 font-bold text-lg">{team.totalPoints} pts</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-gray-500 text-xs">Kills</div>
                  <div className="text-red-600 font-semibold">{team.totalKills}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Parties</div>
                  <div className="text-gray-700 font-semibold">{team.gamesPlayed}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Meilleur</div>
                  <div className={`font-semibold ${getPlacementColor(team.bestPlacement)}`}>
                    {team.bestPlacement === 20 ? '-' : `#${team.bestPlacement}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Version desktop - Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Rang</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Équipe</th>
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Points</th>
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Kills</th>
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Parties</th>
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Moyenne</th>
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Meilleur rang</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((team) => (
                <tr key={team.teamId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-sm font-bold ${getPositionBadge(team.position)}`}>
                      #{team.position}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{team.teamName}</td>
                  <td className="py-3 px-4 text-center text-yellow-600 font-bold">{team.totalPoints}</td>
                  <td className="py-3 px-4 text-center text-red-600">{team.totalKills}</td>
                  <td className="py-3 px-4 text-center text-gray-700">{team.gamesPlayed}</td>
                  <td className="py-3 px-4 text-center text-blue-600">{team.averagePoints.toFixed(1)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${getPlacementColor(team.bestPlacement)}`}>
                      {team.bestPlacement === 20 ? '-' : `#${team.bestPlacement}`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Résultats récents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />
          <span>Résultats Récents</span>
        </h3>
        <div className="space-y-2 lg:space-y-3 max-h-64 lg:max-h-80 overflow-y-auto">
          {gameResults.slice(0, 10).map((result) => (
            <div key={result.id} className="bg-gray-50 rounded-lg p-3 lg:p-4 border border-gray-100">
              {/* Version mobile - Layout vertical */}
              <div className="block lg:hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      Partie {result.gameNumber}
                    </span>
                    <span className="text-gray-900 font-medium text-sm truncate">{result.teamName}</span>
                  </div>
                  <span className="text-yellow-600 font-bold text-sm">{result.points} pts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-bold ${getPlacementColor(result.placement)}`}>
                    #{result.placement}
                  </span>
                  <span className="text-red-600">{result.kills} kills</span>
                </div>
              </div>
              
              {/* Version desktop - Layout horizontal */}
              <div className="hidden lg:flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Partie {result.gameNumber}</span>
                  <span className="text-gray-900 font-medium">{result.teamName}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`font-bold ${getPlacementColor(result.placement)}`}>
                    #{result.placement}
                  </span>
                  <span className="text-red-600">{result.kills} kills</span>
                  <span className="text-yellow-600 font-bold">{result.points} pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal d'ajout de résultat */}
      {showAddResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 lg:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Ajouter un Résultat</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Équipe</label>
                <select
                  value={newResult.teamId}
                  onChange={(e) => handleTeamSelection(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une équipe</option>
                  {tournamentTeams.filter(t => t.status === 'validated').map(team => {
                    const teamRanking = rankings.find(r => r.teamId === team.id);
                    const gamesPlayed = teamRanking?.gamesPlayed || 0;
                    const isMaxGames = gamesPlayed >= 3;
                    
                    return (
                      <option 
                        key={team.id} 
                        value={team.id}
                        disabled={isMaxGames}
                        style={{ color: isMaxGames ? '#9CA3AF' : 'inherit' }}
                      >
                        {team.name} ({gamesPlayed}/3 parties{isMaxGames ? ' - COMPLET' : ''})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Saisie des kills par joueur */}
              {selectedTeamPlayers.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Kills par joueur
                  </h4>
                  <div className="space-y-2">
                    {selectedTeamPlayers.map((player) => {
                      const playerStat = newResult.playerStats.find(ps => ps.playerId === player.id);
                      return (
                        <div key={player.id} className="flex items-center gap-3 bg-white rounded-lg p-2 border border-green-300">
                          <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                            {player.pseudo}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={playerStat?.kills || 0}
                            onChange={(e) => handlePlayerKillsChange(player.id, parseInt(e.target.value) || 0)}
                            className="w-20 bg-white text-gray-900 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="0"
                          />
                          <span className="text-xs text-gray-500">kills</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-300 flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-800">Total:</span>
                    <span className="text-lg font-bold text-green-700">{newResult.kills} kills</span>
                  </div>
                </div>
              )}

              {/* Affichage conditionnel selon le mode de jeu */}
              {tournament?.gameMode && GameModeUtils.isBestOfMode(tournament.gameMode) ? (
                // Formulaire Multijoueur BO3/BO5
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <h4 className="font-semibold text-purple-800 mb-2">
                      Mode {GAME_MODES_CONFIG[tournament.gameMode]?.displayName} - BO{GameModeUtils.getBestOf(tournament.gameMode)}
                    </h4>
                    <p className="text-sm text-purple-600">
                      Saisissez le résultat de chaque manche pour déterminer le gagnant
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Résultat du match</label>
                    <select
                      value={newResult.placement}
                      onChange={(e) => setNewResult({ ...newResult, placement: parseInt(e.target.value) })}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={1}>Victoire</option>
                      <option value={2}>Défaite</option>
                    </select>
                  </div>
                </div>
              ) : (
                // Formulaire Battle Royale classique
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <h4 className="font-semibold text-orange-800 mb-2">
                      Mode {tournament?.gameMode ? GAME_MODES_CONFIG[tournament.gameMode]?.displayName : 'Battle Royale'}
                    </h4>
                    <p className="text-sm text-orange-600">
                      Saisissez le placement final et les kills de l&apos;équipe
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Placement</label>
                    <select
                      value={newResult.placement}
                      onChange={(e) => setNewResult({ ...newResult, placement: parseInt(e.target.value) })}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: 25 }, (_, i) => i + 1).map(rank => (
                        <option key={rank} value={rank}>
                          {rank === 1 ? '1er' : rank === 2 ? '2ème' : rank === 3 ? '3ème' : `${rank}ème`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Nombre de kills</label>
                    <input
                      type="number"
                      min="0"
                      value={newResult.kills}
                      onChange={(e) => setNewResult({ ...newResult, kills: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-gray-700 text-sm font-medium">Points calculés:</p>
                <p className="text-blue-600 font-bold text-lg">
                  {tournament?.gameMode 
                    ? (GameModeUtils.isMultiplayerMode(tournament.gameMode)
                        ? GameModeUtils.calculatePoints(tournament.gameMode, newResult.placement, newResult.kills)
                        : calculatePoints(newResult.placement, newResult.kills))
                    : calculatePoints(newResult.placement, newResult.kills)
                  } points
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddResult}
                disabled={isLoading}
                className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-white ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
              <button
                onClick={() => setShowAddResult(false)}
                disabled={isLoading}
                className={`flex-1 py-2 rounded-lg transition-colors text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                Annuler
              </button>
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
                  Mode: {tournament?.gameMode && GAME_MODES_CONFIG[tournament.gameMode]?.displayName}
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
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      index === 0
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
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0
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
        </>
      )}
    </div>
  );
}
