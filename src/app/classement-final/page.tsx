'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Medal, Award, Crown, Star, Users, Target, TrendingUp } from 'lucide-react';
import { Team } from '@/types/index';
import { GameResult, TeamRanking } from '@/types/tournament';

export default function ClassementFinal() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResultsAvailable, setIsResultsAvailable] = useState(false);

  // Vérifier si les résultats sont disponibles
  useEffect(() => {
    const checkResultsAvailability = () => {
      const revealDate = process.env.NEXT_PUBLIC_RESULTS_REVEAL_DATE;
      if (!revealDate) {
        setIsResultsAvailable(false);
        return;
      }

      const now = new Date();
      const targetDate = new Date(revealDate);
      setIsResultsAvailable(now >= targetDate);
    };

    checkResultsAvailability();
    const interval = setInterval(checkResultsAvailability, 1000);
    return () => clearInterval(interval);
  }, []);

  // Charger les équipes
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'teams'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const teamsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Team));
        setTeams(teamsData);
      }
    );

    return () => unsubscribe();
  }, []);

  // Charger les résultats du tournoi
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'tournament-results'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as GameResult));
        setGameResults(results);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Calculer les classements
  useEffect(() => {
    if (teams.length === 0) return;

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
    gameResults.forEach(result => {
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

    // Créer le classement final
    const rankingArray = Object.values(teamStats)
      .map(team => ({
        ...team,
        averagePoints: team.gamesPlayed > 0 ? team.totalPoints / team.gamesPlayed : 0
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((team, index) => ({ ...team, position: index + 1 }));

    setRankings(rankingArray);
  }, [teams, gameResults]);

  // Fonction pour obtenir l'icône du podium
  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return <Trophy className="w-6 h-6 text-gray-500" />;
    }
  };


  // Si les résultats ne sont pas encore disponibles
  if (!isResultsAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Classement Final</h1>
          <p className="text-xl text-gray-300 mb-8">
            Les résultats ne sont pas encore disponibles
          </p>
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
            <p className="text-gray-400">
              Revenez le <span className="text-yellow-400 font-bold">27 janvier à 00h00</span> pour découvrir le classement final !
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Chargement du classement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-yellow-600 to-yellow-800 py-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Crown className="w-16 h-16 text-yellow-200 mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-white mb-4">
            🏆 Classement Final du Tournoi
          </h1>
          <p className="text-xl text-yellow-100 max-w-2xl mx-auto">
            Félicitations à tous les participants ! Voici les résultats officiels du tournoi.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-white/70 text-sm">Équipes participantes</p>
                <p className="text-2xl font-bold text-white">{rankings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-white/70 text-sm">Total des kills</p>
                <p className="text-2xl font-bold text-white">
                  {rankings.reduce((sum, team) => sum + team.totalKills, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-white/70 text-sm">Parties jouées</p>
                <p className="text-2xl font-bold text-white">{gameResults.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <Star className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-white/70 text-sm">Points max</p>
                <p className="text-2xl font-bold text-white">
                  {rankings.length > 0 ? rankings[0].totalPoints : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Podium Top 3 */}
        {rankings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white text-center mb-8">🏆 Podium</h2>
            <div className="flex justify-center items-end space-x-4 mb-8">
              {/* 2ème place */}
              {rankings[1] && (
                <div className="text-center">
                  <div className="bg-gradient-to-r from-gray-300 to-gray-500 rounded-xl p-6 mb-4 transform hover:scale-105 transition-transform">
                    <Medal className="w-12 h-12 text-white mx-auto mb-2" />
                    <h3 className="text-xl font-bold text-white mb-2">{rankings[1].teamName}</h3>
                    <p className="text-3xl font-bold text-white">{rankings[1].totalPoints}</p>
                    <p className="text-white/80 text-sm">points</p>
                  </div>
                  <div className="bg-gray-400 h-24 w-32 rounded-t-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                </div>
              )}

              {/* 1ère place */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl p-8 mb-4 transform hover:scale-105 transition-transform">
                  <Crown className="w-16 h-16 text-white mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-white mb-2">{rankings[0].teamName}</h3>
                  <p className="text-4xl font-bold text-white">{rankings[0].totalPoints}</p>
                  <p className="text-white/80">points</p>
                </div>
                <div className="bg-yellow-500 h-32 w-36 rounded-t-lg flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
              </div>

              {/* 3ème place */}
              {rankings[2] && (
                <div className="text-center">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-700 rounded-xl p-6 mb-4 transform hover:scale-105 transition-transform">
                    <Award className="w-12 h-12 text-white mx-auto mb-2" />
                    <h3 className="text-xl font-bold text-white mb-2">{rankings[2].teamName}</h3>
                    <p className="text-3xl font-bold text-white">{rankings[2].totalPoints}</p>
                    <p className="text-white/80 text-sm">points</p>
                  </div>
                  <div className="bg-amber-600 h-20 w-32 rounded-t-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Classement complet */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span>Classement Complet</span>
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-4 px-6 text-white/80 font-medium">Rang</th>
                  <th className="text-left py-4 px-6 text-white/80 font-medium">Équipe</th>
                  <th className="text-center py-4 px-6 text-white/80 font-medium">Points</th>
                  <th className="text-center py-4 px-6 text-white/80 font-medium">Kills</th>
                  <th className="text-center py-4 px-6 text-white/80 font-medium">Parties</th>
                  <th className="text-center py-4 px-6 text-white/80 font-medium">Moyenne</th>
                  <th className="text-center py-4 px-6 text-white/80 font-medium">Meilleur rang</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((team, index) => (
                  <tr 
                    key={team.teamId} 
                    className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                      index < 3 ? 'bg-white/5' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {getPodiumIcon(team.position)}
                        <span className="text-white font-bold text-lg">#{team.position}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white font-medium text-lg">{team.teamName}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-yellow-400 font-bold text-xl">{team.totalPoints}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-red-400 font-medium">{team.totalKills}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-white/80">{team.gamesPlayed}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-blue-400 font-medium">{team.averagePoints.toFixed(1)}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-green-400 font-bold">
                        {team.bestPlacement === 25 ? '-' : `#${team.bestPlacement}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message de félicitations */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 border border-purple-500/30">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-4">
              Félicitations à tous les participants !
            </h3>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Merci pour votre participation à ce tournoi exceptionnel. 
              Chaque équipe a montré un excellent niveau de jeu et un esprit sportif remarquable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
