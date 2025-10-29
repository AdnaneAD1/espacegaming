'use client';

import { Users, Trophy, Clock, CheckCircle, PlayCircle } from 'lucide-react';

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

interface MatchesViewProps {
    matches: MatchData[];
}

export default function MatchesView({ matches }: MatchesViewProps) {
    // Calculer le nombre total de rounds d'élimination
    const eliminationMatches = matches.filter(m => m.phaseType === 'elimination');
    const maxRound = eliminationMatches.length > 0 
        ? Math.max(...eliminationMatches.map(m => m.round || 0))
        : 0;
    
    // Fonction pour obtenir le nom du round dynamiquement
    const getRoundName = (round: number, totalRounds: number): string => {
        const roundsFromEnd = totalRounds - round + 1;
        
        switch (roundsFromEnd) {
            case 1:
                return 'Finale';
            case 2:
                return 'Demi-finales';
            case 3:
                return 'Quarts de finale';
            case 4:
                return 'Huitièmes de finale';
            case 5:
                return '16èmes de finale';
            default:
                return `Tour ${round}`;
        }
    };
    
    // Grouper les matchs par phase et groupe/round
    const groupedMatches: Record<string, MatchData[]> = {};
    const groupKeys: Record<string, { type: 'group' | 'elimination', order: number }> = {};
    
    matches.forEach(match => {
        let key = 'Autres';
        
        if (match.phaseType === 'group_stage' && match.groupName) {
            key = `Phase de Groupes - ${match.groupName}`;
            groupKeys[key] = { type: 'group', order: 0 };
        } else if (match.phaseType === 'elimination' && match.round) {
            const roundName = getRoundName(match.round, maxRound);
            key = `Phase Éliminatoire - ${roundName}`;
            // Utiliser le numéro de round pour le tri (ordre croissant)
            groupKeys[key] = { type: 'elimination', order: match.round };
        }
        
        if (!groupedMatches[key]) {
            groupedMatches[key] = [];
        }
        groupedMatches[key].push(match);
    });
    
    // Trier les matchs par numéro dans chaque groupe
    Object.keys(groupedMatches).forEach(key => {
        groupedMatches[key].sort((a, b) => a.matchNumber - b.matchNumber);
    });
    
    // Trier les clés : d'abord les groupes (alphabétique), puis les phases éliminatoires (par round)
    const sortedKeys = Object.keys(groupedMatches).sort((a, b) => {
        const keyA = groupKeys[a];
        const keyB = groupKeys[b];
        
        // Si les deux sont des groupes, tri alphabétique
        if (keyA.type === 'group' && keyB.type === 'group') {
            return a.localeCompare(b);
        }
        
        // Si les deux sont des phases éliminatoires, tri par numéro de round
        if (keyA.type === 'elimination' && keyB.type === 'elimination') {
            return keyA.order - keyB.order;
        }
        
        // Les groupes avant les phases éliminatoires
        return keyA.type === 'group' ? -1 : 1;
    });
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="flex items-center gap-1 text-xs px-3 py-1 bg-green-500/20 text-green-300 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Terminé
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="flex items-center gap-1 text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                        <PlayCircle className="w-3 h-3" />
                        En cours
                    </span>
                );
            case 'pending':
                return (
                    <span className="flex items-center gap-1 text-xs px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full">
                        <Clock className="w-3 h-3" />
                        À venir
                    </span>
                );
            default:
                return null;
        }
    };
    
    if (matches.length === 0) {
        return (
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 border border-gray-700 text-center">
                <p className="text-gray-300 text-xl">Aucun match disponible pour le moment.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            {sortedKeys.map((groupName) => {
                const groupMatches = groupedMatches[groupName];
                return (
                <div key={groupName} className="bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                        <h3 className="text-xl font-bold text-white">{groupName}</h3>
                        <p className="text-sm text-indigo-100 mt-1">{groupMatches.length} match(s)</p>
                    </div>
                    
                    <div className="p-6">
                        <div className="space-y-4">
                            {groupMatches.map((match) => (
                                <div
                                    key={match.id}
                                    className="bg-gray-700/50 rounded-lg p-5 border border-gray-600 hover:border-gray-500 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-sm font-semibold text-gray-400">
                                            Match #{match.matchNumber}
                                        </div>
                                        {getStatusBadge(match.status)}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        {/* Équipe 1 */}
                                        <div className={`p-4 rounded-lg ${
                                            match.winnerId === match.team1Id 
                                                ? 'bg-green-500/20 border-2 border-green-500/50' 
                                                : 'bg-gray-800/50 border-2 border-transparent'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Users className="w-5 h-5 text-blue-400" />
                                                    <span className="font-bold text-white text-lg">
                                                        {match.team1Name}
                                                    </span>
                                                </div>
                                                {match.winnerId === match.team1Id && (
                                                    <Trophy className="w-6 h-6 text-yellow-400" />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* VS */}
                                        <div className="text-center">
                                            <span className="text-2xl font-bold text-gray-400">VS</span>
                                        </div>
                                        
                                        {/* Équipe 2 */}
                                        <div className={`p-4 rounded-lg ${
                                            match.winnerId === match.team2Id 
                                                ? 'bg-green-500/20 border-2 border-green-500/50' 
                                                : 'bg-gray-800/50 border-2 border-transparent'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Users className="w-5 h-5 text-blue-400" />
                                                    <span className="font-bold text-white text-lg">
                                                        {match.team2Name}
                                                    </span>
                                                </div>
                                                {match.winnerId === match.team2Id && (
                                                    <Trophy className="w-6 h-6 text-yellow-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                );
            })}
        </div>
    );
}
