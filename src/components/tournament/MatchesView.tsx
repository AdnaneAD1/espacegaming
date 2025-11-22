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
    phaseType?: 'group_stage' | 'play_in' | 'elimination';
    groupName?: string;
    blocType?: 'A' | 'B';
    round?: number;
    matchNumber: number;
    isThirdPlaceMatch?: boolean;
}

interface MatchesViewProps {
    matches: MatchData[];
}

export default function MatchesView({ matches }: MatchesViewProps) {
    // Calculer le nombre total de rounds prévus basé sur le nombre d'équipes au premier round
    const eliminationMatches = matches.filter(m => m.phaseType === 'elimination');
    
    // Trouver le premier round et calculer le nombre d'équipes initiales
    const rounds = eliminationMatches.map(m => m.round || 0).filter(r => r > 0);
    const firstRound = rounds.length > 0 ? Math.min(...rounds) : 0;
    const firstRoundMatches = eliminationMatches.filter(m => m.round === firstRound);
    const initialTeamsCount = firstRoundMatches.length * 2;
    const totalExpectedRounds = initialTeamsCount > 0 ? Math.ceil(Math.log2(initialTeamsCount)) : 0;
    
    // Fonction pour obtenir le nom du round basé sur le nombre total prévu
    const getRoundName = (round: number): string => {
        const roundsFromEnd = totalExpectedRounds - round;
        
        switch (roundsFromEnd) {
            case 0:
                return 'Finale';
            case 1:
                return 'Demi-finales';
            case 2:
                return 'Quarts de finale';
            case 3:
                return 'Huitièmes de finale';
            case 4:
                return '16èmes de finale';
            default:
                return `Tour ${round}`;
        }
    };
    
    // Grouper les matchs par phase et groupe/round
    const groupedMatches: Record<string, MatchData[]> = {};
    const groupKeys: Record<string, { type: 'group' | 'play_in' | 'elimination', order: number, subOrder: number }> = {};
    
    matches.forEach(match => {
        let key = 'Autres';
        
        if (match.phaseType === 'group_stage' && match.groupName) {
            key = `Phase de Groupes - ${match.groupName}`;
            groupKeys[key] = { type: 'group', order: 0, subOrder: 0 };
        } else if (match.phaseType === 'play_in') {
            // Distinguer Bloc A et Bloc B
            const blocName = match.blocType === 'B' ? 'Bloc B - Poule' : 'Bloc A - Matchs Simples';
            key = `Play-In - ${blocName}`;
            // order: 1 pour play-in (après groupes), subOrder: 0 pour Bloc A, 1 pour Bloc B
            groupKeys[key] = { type: 'play_in', order: 1, subOrder: match.blocType === 'B' ? 1 : 0 };
        } else if (match.phaseType === 'elimination' && match.round) {
            // Différencier la petite finale de la finale
            const roundName = match.isThirdPlaceMatch ? 'Petite Finale (3ème place)' : getRoundName(match.round);
            key = `Phase Éliminatoire - ${roundName}`;
            // Utiliser le numéro de round pour le tri, et subOrder pour séparer finale et petite finale
            // subOrder: 0 = finale, 1 = petite finale (pour qu'elle apparaisse juste après)
            groupKeys[key] = { type: 'elimination', order: match.round, subOrder: match.isThirdPlaceMatch ? 1 : 0 };
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
    
    // Trier les clés : groupes → play-in → élimination
    const sortedKeys = Object.keys(groupedMatches).sort((a, b) => {
        const keyA = groupKeys[a];
        const keyB = groupKeys[b];
        
        // Ordre de priorité : group (0) → play_in (1) → elimination (2+)
        const typeOrder = { 'group': 0, 'play_in': 1, 'elimination': 2 };
        const orderA = typeOrder[keyA.type] || 999;
        const orderB = typeOrder[keyB.type] || 999;
        
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        
        // Si même type, tri par order puis subOrder
        if (keyA.order !== keyB.order) {
            return keyA.order - keyB.order;
        }
        
        if (keyA.subOrder !== keyB.subOrder) {
            return keyA.subOrder - keyB.subOrder;
        }
        
        // Dernier recours : tri alphabétique
        return a.localeCompare(b);
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
                const isThirdPlace = groupName.includes('Petite Finale');
                const isPlayIn = groupName.includes('Play-In');
                
                return (
                <div key={groupName} className={`bg-gray-800/60 backdrop-blur-lg rounded-2xl overflow-hidden ${
                    isThirdPlace ? 'border-2 border-orange-500' : 
                    isPlayIn ? 'border-2 border-orange-500' :
                    'border border-gray-700'
                }`}>
                    <div className={`px-6 py-4 ${
                        isThirdPlace 
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600' 
                            : isPlayIn
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                    }`}>
                        <h3 className="text-xl font-bold text-white">{groupName}</h3>
                        <p className={`text-sm mt-1 ${
                            isThirdPlace || isPlayIn ? 'text-orange-100' : 'text-indigo-100'
                        }`}>{groupMatches.length} match(s)</p>
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
