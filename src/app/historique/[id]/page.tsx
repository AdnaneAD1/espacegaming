'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tournament, TournamentTeam, TournamentResult } from '@/types/tournament-multi';
import { Trophy, Medal, Users, Target, ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import console from 'console';

interface TeamStats {
  teamId: string;
  teamName: string;
  totalPoints: number;
  totalKills: number;
  gamesPlayed: number;
  averagePoints: number;
  bestPlacement: number;
  position: number;
}

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [rankings, setRankings] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Déclarer calculateRankings avant le useEffect pour éviter la référence circulaire
  const calculateRankings = useCallback((teamsData: TournamentTeam[], resultsData: TournamentResult[]) => {
    console.log('calculateRankings called with:', { teamsCount: teamsData.length, resultsCount: resultsData.length });
    
    if (teamsData.length === 0) return;

    const teamStats: { [key: string]: TeamStats } = {};

    // Initialiser les stats pour chaque équipe validée uniquement
    teamsData.filter(team => team.status === 'validated').forEach(team => {
      teamStats[team.id] = {
        teamId: team.id,
        teamName: team.name,
        totalPoints: 0,
        totalKills: 0,
        gamesPlayed: 0,
        averagePoints: 0,
        bestPlacement: 25, // Valeur par défaut comme dans l'original
        position: 0
      };
    });

    // Calculer les stats à partir des résultats (maximum 3 parties par équipe)
    // Logique identique à classement-final
    resultsData.forEach(result => {
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

    // Créer le classement final (logique identique à classement-final)
    const finalRankings = Object.values(teamStats)
      .map(team => ({
        ...team,
        averagePoints: team.gamesPlayed > 0 ? team.totalPoints / team.gamesPlayed : 0
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints) // Tri simple par points totaux
      .map((team, index) => ({ ...team, position: index + 1 }));

    console.log('Final rankings:', finalRankings);
    setRankings(finalRankings);
  }, []);

  useEffect(() => {
    const fetchTournamentData = async () => {
      if (!tournamentId) return;
      
      setLoading(true);
      try {
        // Récupérer le tournoi
        const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
        if (!tournamentDoc.exists()) {
          setTournament(null);
          return;
        }
        
        const tournamentData = { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament;
        setTournament(tournamentData);

        // Récupérer les équipes
        const teamsQuery = query(
          collection(db, 'tournaments', tournamentId, 'teams'),
          orderBy('name')
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TournamentTeam[];
        setTeams(teamsData);

        // Récupérer les résultats
        const resultsQuery = query(
          collection(db, 'tournaments', tournamentId, 'results'),
          orderBy('timestamp', 'desc')
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsData = resultsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convertir le timestamp comme dans classement-final
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
          };
        }) as TournamentResult[];

        // Debug: Afficher les données récupérées
        console.log('Teams data:', teamsData);
        console.log('Results data:', resultsData);
        
        // Calculer les classements
        calculateRankings(teamsData, resultsData);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [tournamentId, calculateRankings]);

  const formatDate = (date: Date | { toDate: () => Date } | string | number | null | undefined) => {
    if (!date) return 'Date inconnue';
    
    let dateObj: Date;
    if (typeof date === 'object' && date !== null && 'toDate' in date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date as string | number);
    }
    
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-400">#{position}</span>;
    }
  };

  const getPodiumBg = (position: number) => {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400/30';
      case 2: return 'bg-gradient-to-r from-gray-300/20 to-gray-500/20 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-amber-400/20 to-amber-600/20 border-amber-500/30';
      default: return 'bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement du tournoi...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Tournoi introuvable</h1>
          <Link href="/historique" className="text-blue-300 hover:text-blue-200">
            ← Retour à l&apos;historique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/historique"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;historique
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-10 h-10 text-yellow-400" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {tournament.name}
              </h1>
            </div>
            
            {tournament.description && (
              <p className="text-xl text-gray-300 mb-4">
                {tournament.description}
              </p>
            )}
            
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(tournament.startDate)}</span>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{teams.length}</div>
                <div className="text-gray-300">Équipes</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">3</div>
                <div className="text-gray-300">Parties jouées</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {rankings.length > 0 ? rankings[0].teamName : 'N/A'}
                </div>
                <div className="text-gray-300">Champion</div>
              </div>
            </div>
          </div>
        </div>

        {/* Classement */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Classement Final
          </h2>
          
          {rankings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-6">Découvrez les résultats et classements de ce tournoi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((team) => (
                <div
                  key={team.teamId}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${getPodiumBg(team.position)}`}
                >
                  <div className="flex items-center gap-4">
                    {getPodiumIcon(team.position)}
                    <div>
                      <div className="font-semibold text-white text-lg">
                        {team.teamName}
                      </div>
                      <div className="text-sm text-gray-300">
                        {team.gamesPlayed} partie{team.gamesPlayed > 1 ? 's' : ''} • 
                        Meilleur: {team.bestPlacement === 25 ? '-' : `#${team.bestPlacement}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      {team.totalPoints} pts
                    </div>
                    <div className="text-sm text-gray-300">
                      {team.totalKills} kills • 
                      {team.averagePoints.toFixed(1)} pts/partie
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
