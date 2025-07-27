'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GameResult, TeamRanking, calculatePoints } from '@/types/tournament';
import { Team } from '@/types';
import { Trophy, Plus, Eye, Target, Award, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TournamentManagerProps {
  teams: Team[];
}

export default function TournamentManager({ teams }: TournamentManagerProps) {
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [showAddResult, setShowAddResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newResult, setNewResult] = useState({
    teamId: '',
    placement: 1,
    kills: 0
  });

  // Calculer le classement
  const updateRankings = useCallback((results: GameResult[]) => {
    const teamStats: Record<string, TeamRanking> = {};

    // Initialiser les stats pour toutes les équipes validées
    teams.filter(team => team.status === 'validated').forEach(team => {
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

    // Calculer les stats à partir des résultats
    results.forEach(result => {
      if (teamStats[result.teamId]) {
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
    const rankingArray = Object.values(teamStats)
      .map(team => ({
        ...team,
        averagePoints: team.gamesPlayed > 0 ? team.totalPoints / team.gamesPlayed : 0
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((team, index) => ({ ...team, position: index + 1 }));

    setRankings(rankingArray);
  }, [teams]);

  // Charger les résultats du tournoi
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'tournament-results'), orderBy('timestamp', 'desc')),
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
  }, [updateRankings]);

  // Ajouter un résultat de partie
  const handleAddResult = async () => {
    if (!newResult.teamId) {
      toast.error('Veuillez sélectionner une équipe');
      return;
    }

    const team = teams.find(t => t.id === newResult.teamId);
    if (!team) {
      toast.error('Équipe introuvable');
      return;
    }

    const points = calculatePoints(newResult.placement, newResult.kills);

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'tournament-results'), {
        gameNumber: gameResults.length + 1,
        teamId: newResult.teamId,
        teamName: team.name,
        placement: newResult.placement,
        kills: newResult.kills,
        points: points,
        timestamp: new Date()
      });

      toast.success('Résultat ajouté avec succès');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Gestion du Tournoi</h2>
          </div>
          <button
            onClick={() => setShowAddResult(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un résultat</span>
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-gray-600">Parties jouées</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.max(...gameResults.map(r => r.gameNumber), 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-600">Équipes actives</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{teams.filter(t => t.status === 'validated').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-green-500" />
            <span className="text-gray-600">Total résultats</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{gameResults.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-purple-500" />
            <span className="text-gray-600">Leader</span>
          </div>
          <p className="text-lg font-bold text-gray-900 truncate">
            {rankings[0]?.teamName || 'Aucun'}
          </p>
        </div>
      </div>

      {/* Classement */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <span>Classement Général</span>
        </h3>
        <div className="overflow-x-auto">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Résultats Récents</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {gameResults.slice(0, 10).map((result) => (
            <div key={result.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
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
          ))}
        </div>
      </div>

      {/* Modal d'ajout de résultat */}
      {showAddResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter un Résultat</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Équipe</label>
                <select
                  value={newResult.teamId}
                  onChange={(e) => setNewResult({ ...newResult, teamId: e.target.value })}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une équipe</option>
                  {teams.filter(t => t.status === 'validated').map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
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
