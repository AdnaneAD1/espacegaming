'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Medal, Award, Crown, Star, Users, Target, TrendingUp } from 'lucide-react';
import { Team } from '@/types/index';
import { GameResult, TeamRanking } from '@/types/tournament';
import { Tournament } from '@/types/tournament-multi';
import { TournamentService } from '@/services/tournamentService';

export default function ClassementFinal() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResultsAvailable, setIsResultsAvailable] = useState(false);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [tournamentLoading, setTournamentLoading] = useState(true);

  // Calculer les classements
  const updateRankings = useCallback((results: GameResult[]) => {
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

    // Créer le classement final
    const rankingArray = Object.values(teamStats)
      .map(team => ({
        ...team,
        averagePoints: team.gamesPlayed > 0 ? team.totalPoints / team.gamesPlayed : 0
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((team, index) => ({ ...team, position: index + 1 }));

    setRankings(rankingArray);
  }, [teams]);

  // Charger le tournoi actif et vérifier la disponibilité des résultats
  useEffect(() => {
    const loadActiveTournament = async () => {
      try {
        const tournament = await TournamentService.getActiveTournament();
        setActiveTournament(tournament);
        
        // Vérifier si les résultats sont disponibles
        if (tournament?.date_result) {
          const now = new Date();
          setIsResultsAvailable(now >= tournament.date_result);
        } else {
          // Fallback sur l'ancienne méthode si pas de date_result
          const revealDate = process.env.NEXT_PUBLIC_RESULTS_REVEAL_DATE;
          if (revealDate) {
            const now = new Date();
            const targetDate = new Date(revealDate);
            setIsResultsAvailable(now >= targetDate);
          } else {
            setIsResultsAvailable(false);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du tournoi actif:', error);
        // Fallback sur l'ancienne méthode
        const revealDate = process.env.NEXT_PUBLIC_RESULTS_REVEAL_DATE;
        if (revealDate) {
          const now = new Date();
          const targetDate = new Date(revealDate);
          setIsResultsAvailable(now >= targetDate);
        } else {
          setIsResultsAvailable(false);
        }
      } finally {
        setTournamentLoading(false);
      }
    };

    loadActiveTournament();
    
    // Vérifier périodiquement la disponibilité des résultats
    const interval = setInterval(() => {
      if (activeTournament?.date_result) {
        const now = new Date();
        setIsResultsAvailable(now >= activeTournament.date_result);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeTournament?.date_result]);

  // Charger les équipes du tournoi actif
  useEffect(() => {
    if (!activeTournament || tournamentLoading) return;

    const unsubscribe = onSnapshot(
      query(collection(db, `tournaments/${activeTournament.id}/teams`), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const teamsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Team));
        setTeams(teamsData);
      },
      (error) => {
        console.error('Erreur lors du chargement des équipes:', error);
        // Fallback sur l'ancien système si erreur
        const fallbackUnsubscribe = onSnapshot(
          query(collection(db, 'teams'), orderBy('createdAt', 'desc')),
          (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Team));
            setTeams(teamsData);
          }
        );
        return fallbackUnsubscribe;
      }
    );

    return () => unsubscribe();
  }, [activeTournament, tournamentLoading]);

  // Charger les résultats du tournoi actif
  useEffect(() => {
    if (!activeTournament || tournamentLoading) return;

    const unsubscribe = onSnapshot(
      query(collection(db, `tournaments/${activeTournament.id}/results`), orderBy('timestamp', 'desc')),
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
        setLoading(false);
      },
      (error) => {
        console.error('Erreur lors du chargement des résultats:', error);
        // Fallback sur l'ancien système si erreur
        const fallbackUnsubscribe = onSnapshot(
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
            setLoading(false);
          }
        );
        return fallbackUnsubscribe;
      }
    );

    return () => unsubscribe();
  }, [activeTournament, tournamentLoading, updateRankings]);

  // Mettre à jour les classements quand les résultats changent
  useEffect(() => {
    updateRankings(gameResults);
  }, [gameResults, updateRankings]);

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
                <p className="text-2xl font-bold text-white">3</p>
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
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3">
                <Trophy className="w-10 h-10 text-yellow-400 animate-pulse" />
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  PODIUM DES CHAMPIONS
                </span>
                <Trophy className="w-10 h-10 text-yellow-400 animate-pulse" />
              </h2>
              <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>
            </div>

            {/* Podium avec perspective 3D */}
            <div className="relative max-w-5xl mx-auto">
              {/* Effets de particules améliorés en arrière-plan */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Particules principales */}
                <div className="absolute top-10 left-10 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                <div className="absolute top-20 right-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="absolute bottom-10 right-10 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-50"></div>
                
                {/* Particules secondaires */}
                <div className="absolute top-32 left-32 w-1 h-1 bg-pink-400 rounded-full animate-pulse opacity-60" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-40 right-40 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce opacity-70" style={{animationDelay: '1.5s'}}></div>
                <div className="absolute bottom-32 left-40 w-1 h-1 bg-orange-400 rounded-full animate-ping opacity-50" style={{animationDelay: '2s'}}></div>
                <div className="absolute bottom-40 right-32 w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse opacity-60" style={{animationDelay: '0.5s'}}></div>
                
                {/* Rayons de lumière */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-20 bg-gradient-to-b from-yellow-400/30 to-transparent animate-pulse"></div>
                <div className="absolute top-0 left-1/4 transform -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-blue-400/20 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-0 right-1/4 transform translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-purple-400/20 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
              </div>
              
              {/* Effet de sol réfléchissant */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/5 to-transparent rounded-full blur-2xl"></div>

              {/* Version mobile : podium empilé verticalement */}
              <div className="block md:hidden space-y-8">
                {/* 1ère place en haut */}
                <div className="text-center transform hover:scale-105 transition-all duration-700 relative group">
                  {/* Aura dorée */}
                  <div className="absolute inset-0 animate-pulse">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-yellow-400/30 rounded-full blur-2xl"></div>
                  </div>
                  
                  {/* Carte équipe 1ère - mobile */}
                  <div className="relative mb-4 group/card">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="relative bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 rounded-xl p-4 border-2 border-yellow-300">
                      <div className="absolute -top-3 -right-3 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full p-2">
                        <Crown className="w-6 h-6 text-yellow-800" />
                      </div>
                      
                      <div className="text-center relative z-10">
                        <div className="bg-white/40 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <Crown className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-2">{rankings[0].teamName}</h3>
                        <div className="bg-white/40 rounded-lg p-2 mb-2">
                          <p className="text-2xl font-black text-white">{rankings[0].totalPoints}</p>
                          <p className="text-white/95 text-xs font-bold">POINTS</p>
                        </div>
                        <div className="flex justify-center space-x-2 text-xs">
                          <span className="bg-red-600/90 px-2 py-1 rounded text-white font-bold">{rankings[0].totalKills} K</span>
                          <span className="bg-blue-600/90 px-2 py-1 rounded text-white font-bold">{rankings[0].gamesPlayed} G</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Socle 1ère - mobile */}
                  <div className="relative">
                    <div className="bg-gradient-to-t from-yellow-700 via-yellow-500 to-yellow-400 h-16 w-24 rounded-t-2xl mx-auto border-2 border-yellow-300 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                      <span className="text-2xl font-black text-white relative z-10">1</span>
                    </div>
                    <div className="bg-gradient-to-b from-yellow-500 to-yellow-600 h-2 w-24 mx-auto rounded-b-lg"></div>
                  </div>
                </div>

                {/* 2ème place */}
                {rankings[1] && (
                  <div className="text-center transform hover:scale-105 transition-all duration-700 group">
                    <div className="relative mb-4 group/card">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-600 rounded-xl blur-lg opacity-50 group-hover:opacity-90 transition-all duration-500"></div>
                      <div className="relative bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600 rounded-xl p-4 border-2 border-slate-300">
                        <div className="absolute -top-3 -right-3 bg-gradient-to-br from-slate-200 to-slate-400 rounded-full p-2">
                          <Medal className="w-5 h-5 text-slate-700" />
                        </div>
                        
                        <div className="text-center relative z-10">
                          <div className="bg-white/30 rounded-full p-3 w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                            <Medal className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-base font-black text-white mb-2 truncate">{rankings[1].teamName}</h3>
                          <div className="bg-white/30 rounded-lg p-2 mb-2">
                            <p className="text-xl font-black text-white">{rankings[1].totalPoints}</p>
                            <p className="text-white/95 text-xs font-bold">POINTS</p>
                          </div>
                          <div className="flex justify-center space-x-2 text-xs">
                            <span className="bg-red-500/90 px-2 py-1 rounded text-white font-bold">{rankings[1].totalKills} K</span>
                            <span className="bg-blue-500/90 px-2 py-1 rounded text-white font-bold">{rankings[1].gamesPlayed} G</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="bg-gradient-to-t from-slate-700 via-slate-500 to-slate-400 h-14 w-20 rounded-t-2xl mx-auto border-2 border-slate-300 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                        <span className="text-xl font-black text-white relative z-10">2</span>
                      </div>
                      <div className="bg-gradient-to-b from-slate-500 to-slate-600 h-2 w-20 mx-auto rounded-b-lg"></div>
                    </div>
                  </div>
                )}

                {/* 3ème place */}
                {rankings[2] && (
                  <div className="text-center transform hover:scale-105 transition-all duration-700 group">
                    <div className="relative mb-4 group/card">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-700 rounded-xl blur-lg opacity-50 group-hover:opacity-90 transition-all duration-500"></div>
                      <div className="relative bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 rounded-xl p-4 border-2 border-amber-400">
                        <div className="absolute -top-3 -right-3 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full p-2">
                          <Award className="w-5 h-5 text-amber-800" />
                        </div>
                        
                        <div className="text-center relative z-10">
                          <div className="bg-white/30 rounded-full p-3 w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                            <Award className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-base font-black text-white mb-2 truncate">{rankings[2].teamName}</h3>
                          <div className="bg-white/30 rounded-lg p-2 mb-2">
                            <p className="text-xl font-black text-white">{rankings[2].totalPoints}</p>
                            <p className="text-white/95 text-xs font-bold">POINTS</p>
                          </div>
                          <div className="flex justify-center space-x-2 text-xs">
                            <span className="bg-red-500/90 px-2 py-1 rounded text-white font-bold">{rankings[2].totalKills} K</span>
                            <span className="bg-blue-500/90 px-2 py-1 rounded text-white font-bold">{rankings[2].gamesPlayed} G</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="bg-gradient-to-t from-amber-800 via-amber-600 to-amber-500 h-12 w-18 rounded-t-2xl mx-auto border-2 border-amber-400 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                        <span className="text-lg font-black text-white relative z-10">3</span>
                      </div>
                      <div className="bg-gradient-to-b from-amber-600 to-amber-700 h-2 w-18 mx-auto rounded-b-lg"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Version desktop : podium en ligne */}
              <div className="hidden md:flex justify-center items-end space-x-4 lg:space-x-8">
                {/* 2ème place */}
                {rankings[1] && (
                  <div className="text-center transform hover:scale-110 transition-all duration-700 hover:-translate-y-4 group">
                    {/* Confettis argent pour le 2ème */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                    
                    {/* Carte équipe 2ème */}
                    <div className="relative mb-6 group/card">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-90 transition-all duration-500 group-hover:scale-110"></div>
                      <div className="relative bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600 rounded-2xl p-6 border-2 border-slate-300 transition-all duration-500">
                        {/* Badge médaille flottant */}
                        <div className="absolute -top-4 -right-4 bg-gradient-to-br from-slate-200 to-slate-400 rounded-full p-3 animate-pulse group-hover:animate-bounce">
                          <Medal className="w-7 h-7 text-slate-700" />
                        </div>
                        

                        
                        <div className="text-center relative z-10">
                          <div className="bg-white/30 rounded-full p-4 w-18 h-18 mx-auto mb-4 flex items-center justify-center group-hover:bg-white/40 transition-colors">
                            <Medal className="w-10 h-10 text-white" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-black text-white mb-3 truncate group-hover:scale-105 transition-transform">{rankings[1].teamName}</h3>
                          <div className="bg-white/30 rounded-xl p-3 mb-3 group-hover:bg-white/40 transition-colors">
                            <p className="text-2xl sm:text-3xl font-black text-white">{rankings[1].totalPoints}</p>
                            <p className="text-white/95 text-xs font-bold tracking-wider">POINTS</p>
                          </div>
                          <div className="flex justify-center space-x-2 text-xs">
                            <span className="bg-red-500/90 px-3 py-1.5 rounded-lg text-white font-bold hover:bg-red-400 transition-colors">{rankings[1].totalKills} K</span>
                            <span className="bg-blue-500/90 px-3 py-1.5 rounded-lg text-white font-bold hover:bg-blue-400 transition-colors">{rankings[1].gamesPlayed} G</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Socle 2ème amélioré */}
                    <div className="relative">
                      <div className="bg-gradient-to-t from-slate-700 via-slate-500 to-slate-400 h-20 sm:h-24 w-26 sm:w-32 lg:w-36 rounded-t-3xl mx-auto border-3 border-slate-300 flex items-center justify-center relative overflow-hidden transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-600/50 to-transparent"></div>
                        {/* Étoiles tournantes autour du socle */}
                        <div className="absolute -top-2 -left-2 w-3 h-3 bg-slate-300 rounded-full animate-spin opacity-75" style={{animationDuration: '3s'}}></div>
                        <div className="absolute -top-2 -right-2 w-2 h-2 bg-slate-400 rounded-full animate-spin opacity-60" style={{animationDuration: '4s', animationDirection: 'reverse'}}></div>
                        <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-slate-300 rounded-full animate-spin opacity-70" style={{animationDuration: '5s'}}></div>
                        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-slate-400 rounded-full animate-spin opacity-50" style={{animationDuration: '3.5s', animationDirection: 'reverse'}}></div>
                        
                        <span className="text-2xl sm:text-3xl font-black text-white relative z-10 group-hover:scale-110 transition-transform">2</span>
                      </div>
                      <div className="bg-gradient-to-b from-slate-500 to-slate-600 h-3 w-26 sm:w-32 lg:w-36 mx-auto rounded-b-xl"></div>
                      
                      {/* Reflet sous le socle */}
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-2 bg-slate-400/20 rounded-full blur-sm"></div>
                    </div>
                  </div>
                )}

                {/* 1ère place - Champion */}
                <div className="text-center transform hover:scale-115 transition-all duration-700 hover:-translate-y-6 relative group">
                  {/* Aura dorée multi-couches */}
                  <div className="absolute inset-0 animate-pulse">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-yellow-400/30 rounded-full blur-3xl"></div>
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl animate-ping"></div>
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-yellow-500/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  </div>
                  
                  {/* Confettis dorés pour le champion */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-yellow-300 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2.5 h-2.5 bg-yellow-600 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                      <div className="w-2 h-2 bg-yellow-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                  
                  {/* Carte équipe 1ère */}
                  <div className="relative mb-6 group/card">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-115 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 rounded-2xl p-8 border-4 border-yellow-300 transition-all duration-700">
                      {/* Badge couronne flottant amélioré */}
                      <div className="absolute -top-6 -right-6 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full p-4 animate-pulse group-hover:animate-bounce">
                        <Crown className="w-10 h-10 text-yellow-800" />
                      </div>
                      

                      
                      {/* Particules dorées flottantes */}
                      <div className="absolute top-2 left-2 w-1 h-1 bg-yellow-200 rounded-full animate-ping opacity-70"></div>
                      <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse opacity-80" style={{animationDelay: '1s'}}></div>
                      <div className="absolute bottom-4 left-4 w-1 h-1 bg-yellow-400 rounded-full animate-bounce opacity-60" style={{animationDelay: '1.5s'}}></div>
                      
                      <div className="text-center relative z-10">
                        <div className="bg-white/40 rounded-full p-5 w-24 h-24 mx-auto mb-5 flex items-center justify-center group-hover:bg-white/50 transition-colors group-hover:scale-110 duration-500">
                          <Crown className="w-14 h-14 text-white" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-4 group-hover:scale-110 transition-transform duration-500">{rankings[0].teamName}</h3>
                        <div className="bg-white/40 rounded-xl p-4 mb-4 group-hover:bg-white/50 transition-colors">
                          <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-white group-hover:scale-105 transition-transform">{rankings[0].totalPoints}</p>
                          <p className="text-white/95 text-sm font-bold tracking-wider">POINTS</p>
                        </div>
                        <div className="flex justify-center space-x-2 text-sm">
                          <span className="bg-red-600/90 px-4 py-2 rounded-lg text-white font-bold hover:bg-red-500 transition-colors hover:scale-105">{rankings[0].totalKills} K</span>
                          <span className="bg-blue-600/90 px-4 py-2 rounded-lg text-white font-bold hover:bg-blue-500 transition-colors hover:scale-105">{rankings[0].gamesPlayed} G</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Socle 1ère - Le plus haut amélioré */}
                  <div className="relative">
                    <div className="bg-gradient-to-t from-yellow-700 via-yellow-500 to-yellow-400 h-28 sm:h-32 lg:h-36 w-32 sm:w-36 lg:w-40 rounded-t-3xl mx-auto border-4 border-yellow-300 flex items-center justify-center relative overflow-hidden transition-all duration-700">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-yellow-600/60 to-transparent"></div>
                      
                      {/* Étoiles tournantes dorées autour du socle */}
                      <div className="absolute -top-3 -left-3 w-4 h-4 bg-yellow-300 rounded-full animate-spin opacity-90" style={{animationDuration: '2s'}}></div>
                      <div className="absolute -top-3 -right-3 w-3 h-3 bg-yellow-400 rounded-full animate-spin opacity-80" style={{animationDuration: '3s', animationDirection: 'reverse'}}></div>
                      <div className="absolute -bottom-3 -left-3 w-3 h-3 bg-yellow-300 rounded-full animate-spin opacity-85" style={{animationDuration: '4s'}}></div>
                      <div className="absolute -bottom-3 -right-3 w-4 h-4 bg-yellow-400 rounded-full animate-spin opacity-75" style={{animationDuration: '2.5s', animationDirection: 'reverse'}}></div>
                      
                      {/* Étoiles supplémentaires */}
                      <div className="absolute top-1/2 -left-4 w-2 h-2 bg-yellow-200 rounded-full animate-pulse opacity-70" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute top-1/2 -right-4 w-2 h-2 bg-yellow-200 rounded-full animate-pulse opacity-70" style={{animationDelay: '1s'}}></div>
                      
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white relative z-10 group-hover:scale-125 transition-transform duration-500">1</span>
                    </div>
                    <div className="bg-gradient-to-b from-yellow-500 to-yellow-600 h-4 w-32 sm:w-36 lg:w-40 mx-auto rounded-b-xl"></div>
                    
                    {/* Reflet doré sous le socle */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-28 h-3 bg-yellow-400/30 rounded-full blur-lg"></div>
                    
                    {/* Rayons de lumière dorés */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-yellow-300/50 to-transparent animate-pulse"></div>
                    <div className="absolute top-0 left-1/4 w-0.5 h-6 bg-gradient-to-b from-yellow-400/40 to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <div className="absolute top-0 right-1/4 w-0.5 h-6 bg-gradient-to-b from-yellow-400/40 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
                  </div>
                </div>

                {/* 3ème place */}
                {rankings[2] && (
                  <div className="text-center transform hover:scale-110 transition-all duration-700 hover:-translate-y-4 group">
                    {/* Confettis bronze pour le 3ème */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                    
                    {/* Carte équipe 3ème */}
                    <div className="relative mb-6 group/card">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-700 rounded-2xl blur-xl opacity-50 group-hover:opacity-90 transition-all duration-500 group-hover:scale-110"></div>
                      <div className="relative bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 rounded-2xl p-6 border-2 border-amber-400 transition-all duration-500">
                        {/* Badge trophée flottant */}
                        <div className="absolute -top-4 -right-4 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full p-3 animate-pulse group-hover:animate-bounce">
                          <Award className="w-7 h-7 text-amber-800" />
                        </div>
                        

                        
                        <div className="text-center relative z-10">
                          <div className="bg-white/30 rounded-full p-4 w-18 h-18 mx-auto mb-4 flex items-center justify-center group-hover:bg-white/40 transition-colors">
                            <Award className="w-10 h-10 text-white" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-black text-white mb-3 truncate group-hover:scale-105 transition-transform">{rankings[2].teamName}</h3>
                          <div className="bg-white/30 rounded-xl p-3 mb-3 group-hover:bg-white/40 transition-colors">
                            <p className="text-2xl sm:text-3xl font-black text-white">{rankings[2].totalPoints}</p>
                            <p className="text-white/95 text-xs font-bold tracking-wider">POINTS</p>
                          </div>
                          <div className="flex justify-center space-x-2 text-xs">
                            <span className="bg-red-500/90 px-3 py-1.5 rounded-lg text-white font-bold hover:bg-red-400 transition-colors">{rankings[2].totalKills} K</span>
                            <span className="bg-blue-500/90 px-3 py-1.5 rounded-lg text-white font-bold hover:bg-blue-400 transition-colors">{rankings[2].gamesPlayed} G</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Socle 3ème amélioré */}
                    <div className="relative">
                      <div className="bg-gradient-to-t from-amber-800 via-amber-600 to-amber-500 h-16 sm:h-20 w-26 sm:w-34 lg:w-38 rounded-t-3xl mx-auto border-3 border-amber-400 flex items-center justify-center relative overflow-hidden transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-700/50 to-transparent"></div>
                        {/* Reflets bronze */}
                        <div className="absolute top-2 left-2 right-2 h-1 bg-white/40 rounded-full"></div>
                        <div className="absolute top-4 left-3 right-3 h-0.5 bg-white/20 rounded-full"></div>
                        <span className="text-2xl sm:text-3xl font-black text-white relative z-10 group-hover:scale-110 transition-transform">3</span>
                      </div>
                      <div className="bg-gradient-to-b from-amber-600 to-amber-700 h-3 w-26 sm:w-34 lg:w-38 mx-auto rounded-b-xl"></div>
                      {/* Ombre réfléchie */}
                      <div className="bg-amber-500/20 h-1 w-20 sm:w-28 lg:w-32 mx-auto rounded-full blur-sm mt-1"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message de félicitations pour le podium */}
              <div className="text-center mt-12">
                <div className="relative bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/30 max-w-3xl mx-auto overflow-hidden group">
                  {/* Effet de brillance qui traverse */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:-translate-x-full transition-transform duration-2000"></div>
                  
                  {/* Constellation d'étoiles */}
                  <div className="flex justify-center space-x-3 mb-4">
                    <Star className="w-8 h-8 text-yellow-400 animate-pulse transform hover:scale-125 transition-transform" />
                    <Star className="w-10 h-10 text-yellow-300 animate-pulse transform hover:scale-125 transition-transform" style={{animationDelay: '0.2s'}} />
                    <Star className="w-8 h-8 text-yellow-400 animate-pulse transform hover:scale-125 transition-transform" style={{animationDelay: '0.4s'}} />
                  </div>
                  
                  {/* Titre avec effet arc-en-ciel */}
                  <h3 className="text-2xl font-black mb-4 relative">
                    <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                      🎉 Félicitations aux Champions ! 🎉
                    </span>
                  </h3>
                  
                  <p className="text-white/90 text-base font-medium relative z-10">
                    Un niveau de jeu exceptionnel et une compétition acharnée jusqu&apos;au bout !
                  </p>
                  
                  {/* Particules flottantes dans le message */}
                  <div className="absolute top-2 left-4 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-60"></div>
                  <div className="absolute top-6 right-6 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-70"></div>
                  <div className="absolute bottom-4 left-8 w-1 h-1 bg-blue-400 rounded-full animate-bounce opacity-50"></div>
                  <div className="absolute bottom-2 right-4 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-60"></div>
                </div>
              </div>
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
