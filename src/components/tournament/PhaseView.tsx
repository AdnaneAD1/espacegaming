'use client';

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
    phaseType?: 'group_stage' | 'elimination';
    groupName?: string;
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
    
    // Fonction pour calculer le classement d'un groupe
    const getGroupStandings = (groupName: string, teamIds: Set<string>) => {
        const groupTeams = teams.filter(t => teamIds.has(t.id));
        return groupTeams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.totalKills - a.totalKills;
        });
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
    
    // Rendu pour le format "Groupe uniquement"
    if (tournamentFormat === 'groups_only') {
        const sortedTeams = [...teams].sort((a, b) => {
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
                
                {/* Phase éliminatoire */}
                {hasEliminationPhase && (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Phase Éliminatoire</h2>
                        <EliminationBracketTree rounds={eliminationRounds} />
                    </div>
                )}
            </div>
        );
    }
    
    // Rendu pour "Élimination directe"
    if (tournamentFormat === 'elimination_direct') {
        const eliminationRounds = getEliminationRounds();
        
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">Bracket Éliminatoire</h2>
                <EliminationBracketTree rounds={eliminationRounds} />
            </div>
        );
    }
    
    return null;
}
