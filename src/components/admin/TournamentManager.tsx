'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GameResult, TeamRanking, calculatePoints } from '@/types/tournament';
import { Team } from '@/types';
import { Tournament } from '@/types/tournament-multi';
import { TournamentService } from '@/services/tournamentService';
import { Trophy, Plus, Eye, Target, Award, Save, Loader2, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TournamentManagerProps {
  teams: Team[];
  tournamentId?: string | null;
  onBackToList?: () => void;
}

export default function TournamentManager({ teams, tournamentId, onBackToList }: TournamentManagerProps) {
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [showAddResult, setShowAddResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
  const [newResult, setNewResult] = useState({
    teamId: '',
    placement: 1,
    kills: 0
  });

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
          setTournament({ id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament);
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

    // Calculer la moyenne et trier par points
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

    const points = calculatePoints(newResult.placement, newResult.kills);

    // Utiliser la nouvelle structure multi-tournois ou l'ancienne pour rétrocompatibilité
    const collectionPath = tournamentId 
      ? `tournaments/${tournamentId}/results`
      : 'tournament-results';

    setIsLoading(true);
    try {
      await addDoc(collection(db, collectionPath), {
        gameNumber: gameResults.length + 1,
        teamId: newResult.teamId,
        teamName: team.name,
        placement: newResult.placement,
        kills: newResult.kills,
        points: points,
        timestamp: new Date()
      });

      // Mettre à jour automatiquement les statistiques du tournoi (kills et moyenne de points)
      if (tournamentId) {
        await TournamentService.updateTournamentStats(tournamentId);
        console.log('Statistiques du tournoi mises à jour automatiquement');
      }

      toast.success('Résultat ajouté avec succès ! Statistiques du tournoi mises à jour.');
      setNewResult({ teamId: '', placement: 1, kills: 0 });
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
            <div className="min-w-0 flex-1">
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
                <p className="text-xs lg:text-sm text-gray-500 truncate">{tournament.description}</p>
              )}
              {tournamentId && (
                <p className="text-xs text-gray-400 truncate">ID: {tournamentId}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddResult(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base w-full lg:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter un résultat</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>
      </div>

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
                  onChange={(e) => setNewResult({ ...newResult, teamId: e.target.value })}
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-gray-700 text-sm font-medium">Points calculés:</p>
                <p className="text-blue-600 font-bold text-lg">
                  {calculatePoints(newResult.placement, newResult.kills)} points
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
    </div>
  );
}
