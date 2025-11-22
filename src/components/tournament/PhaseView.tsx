'use client';

import { useState } from 'react';
import { Trophy, Medal, Award, Users, Target } from 'lucide-react';
import EliminationBracketTree from './EliminationBracketTree';

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
    phaseType?: 'group_stage' | 'play_in' | 'elimination';
    groupName?: string;
    blocType?: 'A' | 'B';
    round?: number;
    matchNumber: number;
    isThirdPlaceMatch?: boolean;
}

interface PhaseViewProps {
    teams: MPTeam[];
    matches: MatchData[];
    tournamentFormat: 'groups_only' | 'groups_then_elimination' | 'elimination_direct';
    playersPerTeam?: number; // Pour savoir si c'est 1v1, 2v2, 5v5
    qualifiersPerGroup?: number; // Nombre d'équipes qualifiées par groupe (depuis la config du tournoi)
}

export default function PhaseView({ teams, matches, tournamentFormat, playersPerTeam = 5, qualifiersPerGroup }: PhaseViewProps) {
    const [showBlocBStandings, setShowBlocBStandings] = useState(false);
    
    // Fonction pour regrouper les équipes par groupe
    const getTeamsByGroup = () => {
        const groupMatches = matches.filter(m => m.phaseType === 'group_stage');
        const groups: Record<string, Set<string>> = {};
        
        groupMatches.forEach(match => {
            if (match.groupName) {
                if (!groups[match.groupName]) {
                    groups[match.groupName] = new Set();
                }
                groups[match.groupName].add(match.team1Id);
                groups[match.groupName].add(match.team2Id);
            }
        });
        
        return groups;
    };
    
    // Fonction pour calculer les statistiques d'un groupe (uniquement matchs de groupe)
    const getGroupStandings = (groupName: string, teamIds: Set<string>) => {
        // Récupérer uniquement les matchs de ce groupe
        const groupMatches = matches.filter(m => 
            m.phaseType === 'group_stage' && 
            m.groupName === groupName &&
            m.status === 'completed'
        );
        
        // Calculer les stats uniquement pour les matchs du groupe
        const teamStats: Record<string, { wins: number; losses: number; points: number; totalKills: number; roundsWon: number }> = {};
        
        // Initialiser les stats pour toutes les équipes du groupe
        teamIds.forEach(teamId => {
            teamStats[teamId] = {
                wins: 0,
                losses: 0,
                points: 0,
                totalKills: 0,
                roundsWon: 0
            };
        });
        
        // Calculer les stats depuis les matchs du groupe
        groupMatches.forEach(match => {
            if (match.winnerId && match.winnerId in teamStats) {
                teamStats[match.winnerId].wins += 1;
                teamStats[match.winnerId].points += 3;
            }
            
            const loserId = match.winnerId === match.team1Id ? match.team2Id : match.team1Id;
            if (loserId && loserId in teamStats) {
                teamStats[loserId].losses += 1;
            }
        });
        
        // Créer le classement avec les stats du groupe
        const groupTeams = teams.filter(t => teamIds.has(t.id)).map(team => ({
            ...team,
            wins: teamStats[team.id]?.wins || 0,
            losses: teamStats[team.id]?.losses || 0,
            points: teamStats[team.id]?.points || 0,
            // On garde totalKills et roundsWon globaux car ils ne sont pas affichés dans les groupes
        }));
        
        return groupTeams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.totalKills - a.totalKills;
        });
    };
    
    // Fonction pour obtenir les matchs play-in par bloc
    const getPlayInMatches = () => {
        const playInMatches = matches.filter(m => m.phaseType === 'play_in');
        const blocs: Record<string, MatchData[]> = {
            'A': [],
            'B': []
        };
        
        playInMatches.forEach(match => {
            const blocType = match.blocType || 'A';
            blocs[blocType].push(match);
        });
        
        // Trier les matchs de chaque bloc par matchNumber en ordre croissant
        blocs['A'].sort((a, b) => a.matchNumber - b.matchNumber);
        blocs['B'].sort((a, b) => a.matchNumber - b.matchNumber);
        
        return blocs;
    };
    
    // Fonction pour obtenir les matchs d'élimination par round
    const getEliminationRounds = () => {
        const eliminationMatches = matches.filter(m => m.phaseType === 'elimination');
        const rounds: Record<number, MatchData[]> = {};
        
        eliminationMatches.forEach(match => {
            const round = match.round || 1;
            if (!rounds[round]) {
                rounds[round] = [];
            }
            rounds[round].push(match);
        });
        
        return rounds;
    };

    // Fonction pour calculer les statistiques du Bloc B (Play-In)
    const getPlayInBlocStandings = (blocType: 'A' | 'B') => {
        const blocMatches = matches.filter(m => 
            m.phaseType === 'play_in' && 
            m.blocType === blocType &&
            m.status === 'completed'
        );
        
        // Calculer les stats
        const teamStats: Record<string, { wins: number; losses: number; points: number; totalKills: number }> = {};
        
        // Initialiser les stats pour toutes les équipes du bloc
        blocMatches.forEach(match => {
            if (!teamStats[match.team1Id]) {
                teamStats[match.team1Id] = { wins: 0, losses: 0, points: 0, totalKills: 0 };
            }
            if (!teamStats[match.team2Id]) {
                teamStats[match.team2Id] = { wins: 0, losses: 0, points: 0, totalKills: 0 };
            }
        });
        
        // Calculer les stats depuis les matchs
        blocMatches.forEach(match => {
            if (match.winnerId === match.team1Id) {
                teamStats[match.team1Id].wins += 1;
                teamStats[match.team1Id].points += 3;
                teamStats[match.team2Id].losses += 1;
            } else {
                teamStats[match.team2Id].wins += 1;
                teamStats[match.team2Id].points += 3;
                teamStats[match.team1Id].losses += 1;
            }
        });
        
        // Créer le classement avec les équipes
        const blocTeams = teams.filter(t => t.id in teamStats).map(team => ({
            ...team,
            wins: teamStats[team.id]?.wins || 0,
            losses: teamStats[team.id]?.losses || 0,
            points: teamStats[team.id]?.points || 0,
        }));
        
        return blocTeams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.totalKills - a.totalKills;
        });
    };
    
    // Rendu pour le format "Groupe uniquement"
    if (tournamentFormat === 'groups_only') {
        // Récupérer uniquement les matchs de la phase de groupes
        const groupMatches = matches.filter(m => 
            m.phaseType === 'group_stage' &&
            m.status === 'completed'
        );
        
        // Calculer les stats uniquement pour les matchs de groupe
        const teamStats: Record<string, { wins: number; losses: number; points: number; matchesPlayed: number }> = {};
        
        // Initialiser les stats pour toutes les équipes
        teams.forEach(team => {
            teamStats[team.id] = {
                wins: 0,
                losses: 0,
                points: 0,
                matchesPlayed: 0
            };
        });
        
        // Calculer les stats depuis les matchs de groupe
        groupMatches.forEach(match => {
            if (match.winnerId && match.winnerId in teamStats) {
                teamStats[match.winnerId].wins += 1;
                teamStats[match.winnerId].points += 3;
                teamStats[match.winnerId].matchesPlayed += 1;
            }
            
            const loserId = match.winnerId === match.team1Id ? match.team2Id : match.team1Id;
            if (loserId && loserId in teamStats) {
                teamStats[loserId].losses += 1;
                teamStats[loserId].matchesPlayed += 1;
            }
        });
        
        // Créer le classement avec les stats de groupe
        const sortedTeams = teams.map(team => ({
            ...team,
            wins: teamStats[team.id]?.wins || 0,
            losses: teamStats[team.id]?.losses || 0,
            points: teamStats[team.id]?.points || 0,
            matchesPlayed: teamStats[team.id]?.matchesPlayed || 0,
            // On garde totalKills et roundsWon globaux
        })).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.totalKills - a.totalKills;
        });
        
        // Utiliser qualifiersPerGroup si défini, sinon fallback sur l'ancienne logique
        const qualifiedCount = qualifiersPerGroup || (playersPerTeam === 1 ? 1 : 3);
        
        return (
            <div className="space-y-6">
                <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                        <h2 className="text-2xl font-bold text-white">Classement Unique (Round-Robin)</h2>
                        <p className="text-sm text-blue-100 mt-1">Toutes les équipes dans un seul groupe</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Position</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Équipe</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">V-D</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Matchs</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Rounds</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Kills</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {sortedTeams.map((team, index) => (
                                    <tr
                                        key={team.id}
                                        className={`hover:bg-gray-700/30 transition-colors ${
                                            index < qualifiedCount ? 'bg-green-500/10' : ''
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-white">
                                                    #{index + 1}
                                                </span>
                                                {index === 0 && <Trophy className="w-5 h-5 text-yellow-400" />}
                                                {index === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                                                {index === 2 && <Award className="w-5 h-5 text-orange-600" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Users className="w-5 h-5 text-blue-400" />
                                                <div>
                                                    <div className="font-semibold text-white">{team.name}</div>
                                                    <div className="text-sm text-gray-400">
                                                        {team.players.map(p => p.pseudo).join(', ')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-white font-semibold">
                                                {team.wins}-{team.losses}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-gray-300">{team.matchesPlayed}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-blue-400 font-semibold">{team.roundsWon}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-orange-400 font-semibold">{team.totalKills}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Target className="w-4 h-4 text-green-400" />
                                                <span className="text-xl font-bold text-green-400">{team.points}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <p className="text-sm text-green-300">
                        <strong>Qualifié{qualifiedCount === 1 ? '' : 's'}</strong> : {qualifiedCount === 1 ? 'Le premier est mis en évidence (fond vert)' : `Les ${qualifiedCount} premiers sont mis en évidence (fond vert)`}
                    </p>
                </div>
            </div>
        );
    }
    
    // Rendu pour "Groupes puis élimination"
    if (tournamentFormat === 'groups_then_elimination') {
        const groups = getTeamsByGroup();
        const eliminationRounds = getEliminationRounds();
        const hasEliminationPhase = Object.keys(eliminationRounds).length > 0;
        
        // Utiliser qualifiersPerGroup si défini, sinon fallback sur l'ancienne logique
        const qualifiedCount = qualifiersPerGroup || (playersPerTeam === 1 ? 1 : 2);
        
        return (
            <>
            <div className="space-y-8">
                {/* Phase de groupes */}
                <div>
                    <h2 className="text-3xl font-bold text-white mb-6">Phase de Groupes</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, teamIds]) => {
                            const standings = getGroupStandings(groupName, teamIds);
                            
                            return (
                                <div key={groupName} className="bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden">
                                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                                        <h3 className="text-xl font-bold text-white">{groupName}</h3>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-700/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">#</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Équipe</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">V-D</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">Pts</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {standings.map((team, index) => (
                                                    <tr
                                                        key={team.id}
                                                        className={`hover:bg-gray-700/30 transition-colors ${
                                                            index < qualifiedCount ? 'bg-green-500/10' : ''
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <span className="text-lg font-bold text-white">
                                                                {index + 1}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-white text-sm">{team.name}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-white text-sm">
                                                                {team.wins}-{team.losses}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-green-400 font-bold">{team.points}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <p className="text-sm text-green-300">
                            <strong>Qualifié{qualifiedCount === 1 ? '' : 's'}</strong> : {qualifiedCount === 1 ? 'Le premier de chaque groupe (fond vert) se qualifie pour la phase éliminatoire' : `Les ${qualifiedCount} premiers de chaque groupe (fond vert) se qualifient pour la phase éliminatoire`}
                        </p>
                    </div>
                </div>
                
                {/* Play-In si présent */}
                {(() => {
                    const playInBlocs = getPlayInMatches();
                    const hasPlayIn = playInBlocs['A'].length > 0 || playInBlocs['B'].length > 0;
                    
                    if (!hasPlayIn) return null;
                    
                    return (
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="text-orange-400">⚡</span> Play-In Tournament
                            </h2>
                            
                            {/* Bloc A */}
                            {playInBlocs['A'].length > 0 && (
                                <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-orange-500/30 p-6">
                                    <h3 className="text-xl font-bold text-orange-300 mb-4">Bloc A - Matchs Simples</h3>
                                    <div className="space-y-3">
                                        {playInBlocs['A'].map(match => (
                                            <div key={match.id} className={`border rounded-lg p-3 ${
                                                match.status === 'completed' ? 'border-green-500/50 bg-green-500/10' :
                                                match.status === 'in_progress' ? 'border-blue-500/50 bg-blue-500/10' :
                                                'border-orange-500/30 bg-orange-500/5'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-400">Match {match.matchNumber}</span>
                                                    {match.status === 'completed' && <span className="text-xs text-green-400">✓ Terminé</span>}
                                                </div>
                                                <div className="mt-2 space-y-1 text-sm">
                                                    <div className={match.winnerId === match.team1Id ? 'text-green-300 font-bold' : 'text-gray-400'}>
                                                        {match.team1Name}
                                                    </div>
                                                    <div className="text-gray-500 text-xs">VS</div>
                                                    <div className={match.winnerId === match.team2Id ? 'text-green-300 font-bold' : 'text-gray-400'}>
                                                        {match.team2Name}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Bloc B */}
                            {playInBlocs['B'].length > 0 && (
                                <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-orange-500/30 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-orange-300">Bloc B - Poule Round-Robin</h3>
                                        <button
                                            onClick={() => setShowBlocBStandings(true)}
                                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Trophy className="w-4 h-4" />
                                            Classement
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {playInBlocs['B'].map(match => (
                                            <div key={match.id} className={`border rounded-lg p-3 ${
                                                match.status === 'completed' ? 'border-green-500/50 bg-green-500/10' :
                                                match.status === 'in_progress' ? 'border-blue-500/50 bg-blue-500/10' :
                                                'border-orange-500/30 bg-orange-500/5'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-400">Match {match.matchNumber}</span>
                                                    {match.status === 'completed' && <span className="text-xs text-green-400">✓ Terminé</span>}
                                                </div>
                                                <div className="mt-2 space-y-1 text-sm">
                                                    <div className={match.winnerId === match.team1Id ? 'text-green-300 font-bold' : 'text-gray-400'}>
                                                        {match.team1Name}
                                                    </div>
                                                    <div className="text-gray-500 text-xs">VS</div>
                                                    <div className={match.winnerId === match.team2Id ? 'text-green-300 font-bold' : 'text-gray-400'}>
                                                        {match.team2Name}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Phase éliminatoire */}
                {hasEliminationPhase && (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Phase Éliminatoire</h2>
                        <EliminationBracketTree rounds={eliminationRounds} />
                    </div>
                )}
            </div>
            
            {/* Modal Bloc B */}
            <BlocBStandingsModal 
                isOpen={showBlocBStandings}
                onClose={() => setShowBlocBStandings(false)}
                getPlayInBlocStandings={getPlayInBlocStandings}
                qualifiersPerGroup={qualifiersPerGroup}
            />
        </>
        );
    }
    
    // Rendu pour "Élimination directe"
    if (tournamentFormat === 'elimination_direct') {
        const eliminationRounds = getEliminationRounds();
        const playInBlocs = getPlayInMatches();
        const hasPlayIn = playInBlocs['A'].length > 0 || playInBlocs['B'].length > 0;
        
        return (
            <>
            <div className="space-y-6">
                {/* Affichage du Play-In si présent */}
                {hasPlayIn && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-orange-400">⚡</span> Play-In Tournament
                        </h2>
                        
                        {/* Bloc A */}
                        {playInBlocs['A'].length > 0 && (
                            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-orange-500/30 p-6">
                                <h3 className="text-xl font-bold text-orange-300 mb-4">Bloc A - Matchs Simples</h3>
                                <div className="space-y-3">
                                    {playInBlocs['A'].map(match => (
                                        <div key={match.id} className={`border rounded-lg p-3 ${
                                            match.status === 'completed' ? 'border-green-500/50 bg-green-500/10' :
                                            match.status === 'in_progress' ? 'border-blue-500/50 bg-blue-500/10' :
                                            'border-orange-500/30 bg-orange-500/5'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Match {match.matchNumber}</span>
                                                {match.status === 'completed' && <span className="text-xs text-green-400">✓ Terminé</span>}
                                            </div>
                                            <div className="mt-2 space-y-1 text-sm">
                                                <div className={match.winnerId === match.team1Id ? 'text-green-300 font-bold' : 'text-gray-400'}>
                                                    {match.team1Name}
                                                </div>
                                                <div className="text-gray-500 text-xs">VS</div>
                                                <div className={match.winnerId === match.team2Id ? 'text-green-300 font-bold' : 'text-gray-400'}>
                                                    {match.team2Name}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Bloc B */}
                        {playInBlocs['B'].length > 0 && (
                            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-orange-500/30 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-orange-300">Bloc B - Poule Round-Robin</h3>
                                    <button
                                        onClick={() => setShowBlocBStandings(true)}
                                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                                    >
                                        <Trophy className="w-4 h-4" />
                                        Classement
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {playInBlocs['B'].map(match => (
                                        <div key={match.id} className={`border rounded-lg p-3 ${
                                            match.status === 'completed' ? 'border-green-500/50 bg-green-500/10' :
                                            match.status === 'in_progress' ? 'border-blue-500/50 bg-blue-500/10' :
                                            'border-orange-500/30 bg-orange-500/5'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Match {match.matchNumber}</span>
                                                {match.status === 'completed' && <span className="text-xs text-green-400">✓ Terminé</span>}
                                            </div>
                                            <div className="mt-2 space-y-1 text-sm">
                                                <div className={match.winnerId === match.team1Id ? 'text-green-300 font-bold' : 'text-gray-400'}>
                                                    {match.team1Name}
                                                </div>
                                                <div className="text-gray-500 text-xs">VS</div>
                                                <div className={match.winnerId === match.team2Id ? 'text-green-300 font-bold' : 'text-gray-400'}>
                                                    {match.team2Name}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Bracket d'élimination */}
                {Object.keys(eliminationRounds).length > 0 && (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Bracket Éliminatoire</h2>
                        <EliminationBracketTree rounds={eliminationRounds} />
                    </div>
                )}
            </div>
            
            {/* Modal Bloc B */}
            <BlocBStandingsModal 
                isOpen={showBlocBStandings}
                onClose={() => setShowBlocBStandings(false)}
                getPlayInBlocStandings={getPlayInBlocStandings}
                qualifiersPerGroup={qualifiersPerGroup}
            />
        </>
        );
    }
    
    return null;
}

// Composant séparé pour le modal du Bloc B
function BlocBStandingsModal({ isOpen, onClose, getPlayInBlocStandings, qualifiersPerGroup }: {
    isOpen: boolean;
    onClose: () => void;
    getPlayInBlocStandings: (blocType: 'A' | 'B') => (MPTeam & { wins: number; losses: number; points: number })[];
    qualifiersPerGroup?: number;
}) {
    if (!isOpen) return null;
    
    const blocBStandings = getPlayInBlocStandings('B');
    const qualifiersFromBlocB = qualifiersPerGroup || 1;
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-orange-500" />
                            Classement Bloc B
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Top {qualifiersFromBlocB} qualifié{qualifiersFromBlocB > 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6">
                    {blocBStandings.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600">Aucun match complété</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">#</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Équipe</th>
                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">V-D</th>
                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Points</th>
                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Kills</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {blocBStandings.map((team, index) => (
                                        <tr
                                            key={team.id}
                                            className={`hover:bg-gray-50 transition-colors ${
                                                index < qualifiersFromBlocB ? 'bg-green-50' : ''
                                            }`}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-lg font-bold text-gray-900">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{team.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-gray-700 font-semibold">
                                                    {team.wins}-{team.losses}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-green-600 font-bold">{team.points}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-orange-600 font-semibold">{team.totalKills}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="border-t border-gray-200 p-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
