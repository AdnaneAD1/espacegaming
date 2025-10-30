'use client';

import { useState, useEffect } from 'react';
import { Trophy, Grid3x3, List, Clock, Target } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tournament } from '@/types/tournament-multi';
import { TournamentService } from '@/services/tournamentService';
import { GameModeUtils } from '@/types/game-modes';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PhaseView from '@/components/tournament/PhaseView';
import MatchesView from '@/components/tournament/MatchesView';
import KillLeaderboardView from '@/components/tournament/KillLeaderboardView';
import Podium from '@/components/tournament/Podium';
import { KillLeaderboardService } from '@/services/killLeaderboardService';
import { TournamentKillLeaderboard } from '@/types/tournament-multi';

interface MPTeam {
    id: string;
    name: string;
    players: Array<{ pseudo: string }>;
    wins: number;
    losses: number;
    matchesPlayed: number;
    points: number;
    totalKills: number;
    roundsWon: number;
}

interface MatchData {
    id: string;
    team1Id: string;
    team1Name: string;
    team2Id: string;
    team2Name: string;
    winnerId?: string;
    status: 'pending' | 'in_progress' | 'completed';
    phaseType?: 'group_stage' | 'elimination';
    groupName?: string;
    round?: number;
    matchNumber: number;
}

export default function ClassementFinalMP() {
    const [teams, setTeams] = useState<MPTeam[]>([]);
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isResultsAvailable, setIsResultsAvailable] = useState(false);
    const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
    const [tournamentLoading, setTournamentLoading] = useState(true);
    const [gameModeName, setGameModeName] = useState<string>('Multijoueur 5v5');
    const [activeTab, setActiveTab] = useState<'phases' | 'matches' | 'kills'>('phases');
    const [killLeaderboard, setKillLeaderboard] = useState<TournamentKillLeaderboard | null>(null);
    const [playersPerTeam, setPlayersPerTeam] = useState<number>(5);
    const [isTournamentComplete, setIsTournamentComplete] = useState(false);

    // Charger le tournoi MP actif et vérifier la disponibilité des résultats
    useEffect(() => {
        const loadActiveTournament = async () => {
            try {
                const tournament = await TournamentService.getActiveMPTournament();
                setActiveTournament(tournament);
                
                if (tournament) {
                    const modeName = GameModeUtils.getDisplayName(tournament.gameMode);
                    setGameModeName(modeName);
                    
                    // Déterminer le nombre de joueurs par équipe
                    if (tournament.gameMode === 'mp_1v1') setPlayersPerTeam(1);
                    else if (tournament.gameMode === 'mp_2v2') setPlayersPerTeam(2);
                    else if (tournament.gameMode === 'mp_5v5') setPlayersPerTeam(5);
                }
                
                // Vérifier si les résultats sont disponibles
                if (tournament?.date_result) {
                    const now = new Date();
                    setIsResultsAvailable(now >= tournament.date_result);
                } else {
                    setIsResultsAvailable(false);
                }
            } catch (error) {
                console.error('Erreur lors du chargement du tournoi:', error);
            } finally {
                setTournamentLoading(false);
            }
        };

        loadActiveTournament();
        
        // Vérifier toutes les minutes
        const interval = setInterval(loadActiveTournament, 60000);
        return () => clearInterval(interval);
    }, []);

    // Charger les équipes et résultats du tournoi MP actif
    useEffect(() => {
        if (!activeTournament) {
            setLoading(false);
            return;
        }

        const loadTeamsAndResults = async () => {
            try {
                // Charger les équipes validées
                const teamsSnapshot = await getDocs(
                    query(
                        collection(db, `tournaments/${activeTournament.id}/teams`),
                        where('status', '==', 'validated')
                    )
                );

                // Charger TOUS les matchs (pas seulement terminés)
                const matchesSnapshot = await getDocs(
                    collection(db, `tournaments/${activeTournament.id}/matches`)
                );
                
                // Stocker les matchs pour l'affichage
                const matchesData: MatchData[] = matchesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as MatchData[];
                setMatches(matchesData);

                // Calculer les statistiques pour chaque équipe
                const teamStats: Record<string, MPTeam> = {};

                teamsSnapshot.docs.forEach(doc => {
                    const teamData = doc.data();
                    teamStats[doc.id] = {
                        id: doc.id,
                        name: teamData.name,
                        players: teamData.players || [],
                        wins: 0,
                        losses: 0,
                        matchesPlayed: 0,
                        points: 0,
                        totalKills: 0,
                        roundsWon: 0
                    };
                });

                // Calculer les victoires/défaites depuis les matchs
                matchesSnapshot.docs.forEach(doc => {
                    const matchData = doc.data();
                    const winnerId = matchData.winnerId;
                    const loserId = matchData.loserId;
                    const matchResult = matchData.matchResult;

                    if (winnerId && teamStats[winnerId]) {
                        teamStats[winnerId].wins += 1;
                        teamStats[winnerId].matchesPlayed += 1;
                        teamStats[winnerId].points += 3;
                        
                        if (matchResult) {
                            const isTeam1Winner = winnerId === matchData.team1Id;
                            const winnerStats = isTeam1Winner ? matchResult.team1Stats : matchResult.team2Stats;
                            teamStats[winnerId].totalKills += winnerStats?.totalKills || 0;
                            teamStats[winnerId].roundsWon += winnerStats?.roundsWon || 0;
                        }
                    }

                    if (loserId && teamStats[loserId]) {
                        teamStats[loserId].losses += 1;
                        teamStats[loserId].matchesPlayed += 1;
                        
                        if (matchResult) {
                            const isTeam1Loser = loserId === matchData.team1Id;
                            const loserStats = isTeam1Loser ? matchResult.team1Stats : matchResult.team2Stats;
                            teamStats[loserId].totalKills += loserStats?.totalKills || 0;
                            teamStats[loserId].roundsWon += loserStats?.roundsWon || 0;
                        }
                    }
                });

                // Convertir en tableau et trier selon le format du tournoi
                let sortedTeams = Object.values(teamStats);
                
                const tournamentFormat = activeTournament?.customFormat?.tournamentFormat || 'elimination_direct';
                
                if (tournamentFormat === 'groups_only') {
                    // Pour groupe unique : trier par points
                    sortedTeams = sortedTeams.sort((a, b) => {
                        if (b.points !== a.points) return b.points - a.points;
                        if (b.wins !== a.wins) return b.wins - a.wins;
                        return b.totalKills - a.totalKills;
                    });
                } else if (tournamentFormat === 'groups_then_elimination' || tournamentFormat === 'elimination_direct') {
                    // Pour élimination : déterminer le classement selon les résultats de la phase éliminatoire
                    const eliminationMatches = matchesSnapshot.docs
                        .map(doc => doc.data())
                        .filter(m => m.phaseType === 'elimination')
                        .sort((a, b) => (b.round || 0) - (a.round || 0));
                    
                    const finalRanking: MPTeam[] = [];
                    const rankedTeamIds = new Set<string>();
                    
                    // Trouver le match de la finale (round le plus élevé)
                    if (eliminationMatches.length > 0) {
                        const maxRound = Math.max(...eliminationMatches.map(m => m.round || 0));
                        const finaleMatch = eliminationMatches.find(m => m.round === maxRound && m.status === 'completed');
                        
                        if (finaleMatch && finaleMatch.winnerId && finaleMatch.loserId) {
                            // 1er : Gagnant de la finale
                            const winner = sortedTeams.find(t => t.id === finaleMatch.winnerId);
                            if (winner) {
                                finalRanking.push(winner);
                                rankedTeamIds.add(winner.id);
                            }
                            
                            // 2ème : Perdant de la finale
                            const runnerUp = sortedTeams.find(t => t.id === finaleMatch.loserId);
                            if (runnerUp) {
                                finalRanking.push(runnerUp);
                                rankedTeamIds.add(runnerUp.id);
                            }
                        }
                        
                        // 3ème et 4ème : Vérifier si une petite finale existe
                        const thirdPlaceMatch = eliminationMatches.find(m => m.isThirdPlaceMatch && m.status === 'completed');
                        
                        if (thirdPlaceMatch && thirdPlaceMatch.winnerId && thirdPlaceMatch.loserId) {
                            // Si la petite finale est jouée, utiliser ses résultats
                            // 3ème : Gagnant de la petite finale
                            const thirdPlace = sortedTeams.find(t => t.id === thirdPlaceMatch.winnerId);
                            if (thirdPlace && !rankedTeamIds.has(thirdPlace.id)) {
                                finalRanking.push(thirdPlace);
                                rankedTeamIds.add(thirdPlace.id);
                            }
                            
                            // 4ème : Perdant de la petite finale
                            const fourthPlace = sortedTeams.find(t => t.id === thirdPlaceMatch.loserId);
                            if (fourthPlace && !rankedTeamIds.has(fourthPlace.id)) {
                                finalRanking.push(fourthPlace);
                                rankedTeamIds.add(fourthPlace.id);
                            }
                        } else if (maxRound > 1) {
                            // Sinon, utiliser les perdants des demi-finales (ancien système)
                            const semiMatches = eliminationMatches.filter(m => m.round === maxRound - 1 && m.status === 'completed' && !m.isThirdPlaceMatch);
                            const semiLosers = semiMatches
                                .map(m => sortedTeams.find(t => t.id === m.loserId))
                                .filter(t => t && !rankedTeamIds.has(t.id)) as MPTeam[];
                            
                            semiLosers.sort((a, b) => {
                                if (b.points !== a.points) return b.points - a.points;
                                if (b.wins !== a.wins) return b.wins - a.wins;
                                return b.totalKills - a.totalKills;
                            });
                            
                            semiLosers.forEach(team => {
                                finalRanking.push(team);
                                rankedTeamIds.add(team.id);
                            });
                        }
                    }
                    
                    // Ajouter les équipes restantes triées par points
                    const remainingTeams = sortedTeams
                        .filter(t => !rankedTeamIds.has(t.id))
                        .sort((a, b) => {
                            if (b.points !== a.points) return b.points - a.points;
                            if (b.wins !== a.wins) return b.wins - a.wins;
                            return b.totalKills - a.totalKills;
                        });
                    
                    sortedTeams = [...finalRanking, ...remainingTeams];
                } else {
                    // Fallback : trier par points
                    sortedTeams = sortedTeams.sort((a, b) => {
                        if (b.points !== a.points) return b.points - a.points;
                        if (b.wins !== a.wins) return b.wins - a.wins;
                        return b.totalKills - a.totalKills;
                    });
                }
                
                setTeams(sortedTeams);
                
                // Vérifier si le tournoi est terminé (tous les matchs sont completed)
                const allMatchesCompleted = matchesSnapshot.docs.every(doc => {
                    const matchData = doc.data();
                    return matchData.status === 'completed';
                });
                setIsTournamentComplete(allMatchesCompleted && matchesSnapshot.docs.length > 0);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTeamsAndResults();
    }, [activeTournament]);
    
    // Charger le Kill Leaderboard
    useEffect(() => {
        if (!activeTournament) return;
        
        const unsubscribe = KillLeaderboardService.subscribeToKillLeaderboard(
            activeTournament.id,
            activeTournament.gameMode,
            (leaderboard) => {
                setKillLeaderboard(leaderboard);
            }
        );
        
        return () => unsubscribe();
    }, [activeTournament]);

    if (tournamentLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-white text-xl">Chargement du tournoi...</div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!activeTournament) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 border border-gray-700 text-center">
                        <h1 className="text-3xl font-bold text-white mb-4">Aucun tournoi Multijoueur actif</h1>
                        <p className="text-gray-300 mb-6">
                            Il n&apos;y a actuellement aucun tournoi Multijoueur actif.
                        </p>
                        <Link
                            href="/"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            Retour à l&apos;accueil
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!isResultsAvailable) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 border border-gray-700 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <Clock className="w-10 h-10 text-blue-400" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4">Résultats non disponibles</h1>
                        <p className="text-xl text-gray-300 mb-8">
                            Les résultats du tournoi {gameModeName} seront disponibles après la date prévue.
                            <br />
                            Revenez plus tard pour découvrir le classement final !
                        </p>
                        <Link
                            href="/"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            Retour à l&apos;accueil
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center animate-pulse">
                            <Trophy className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            Classement Final
                        </span>
                        <br />
                        <span className="text-white">{gameModeName}</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Découvrez les résultats officiels du tournoi
                    </p>
                </div>

                {/* Onglets */}
                <div className="flex justify-center mb-8">
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-1 border border-gray-700 inline-flex">
                        <button
                            onClick={() => setActiveTab('phases')}
                            className={`px-6 py-3 rounded-md font-semibold transition-all flex items-center gap-2 ${
                                activeTab === 'phases'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Grid3x3 className="w-5 h-5" />
                            Vue des Phases
                        </button>
                        <button
                            onClick={() => setActiveTab('matches')}
                            className={`px-6 py-3 rounded-md font-semibold transition-all flex items-center gap-2 ${
                                activeTab === 'matches'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <List className="w-5 h-5" />
                            Matchs
                        </button>
                        <button
                            onClick={() => setActiveTab('kills')}
                            className={`px-6 py-3 rounded-md font-semibold transition-all flex items-center gap-2 ${
                                activeTab === 'kills'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Target className="w-5 h-5" />
                            Kill Leaderboard
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-white text-xl">Chargement des résultats...</div>
                ) : teams.length === 0 ? (
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 border border-gray-700 text-center">
                        <p className="text-gray-300 text-xl">Aucun résultat disponible pour le moment.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Podium en haut si le tournoi est terminé */}
                        {isTournamentComplete && teams.length >= 3 && (
                            <Podium 
                                teams={teams} 
                                tournamentFormat={activeTournament?.customFormat?.tournamentFormat || 'elimination_direct'}
                                matches={matches}
                            />
                        )}
                        
                        {/* Contenu des onglets */}
                        <div>
                            {activeTab === 'phases' ? (
                                <PhaseView 
                                    teams={teams} 
                                    matches={matches}
                                    tournamentFormat={activeTournament?.customFormat?.tournamentFormat || 'elimination_direct'}
                                    playersPerTeam={playersPerTeam}
                                    qualifiersPerGroup={activeTournament?.customFormat?.groupStage?.qualifiersPerGroup}
                                />
                            ) : activeTab === 'matches' ? (
                                <MatchesView matches={matches} />
                            ) : (
                                <KillLeaderboardView leaderboard={killLeaderboard} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
