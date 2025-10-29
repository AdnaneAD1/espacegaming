'use client';

import { Trophy, Medal, Users } from 'lucide-react';

interface MatchData {
    id: string;
    team1Id: string;
    team1Name: string;
    team2Id: string;
    team2Name: string;
    winnerId?: string;
    status: 'pending' | 'in_progress' | 'completed';
    phaseType?: 'group_stage' | 'elimination' | 'round_robin';
    groupName?: string;
    round?: number;
    matchNumber: number;
    isThirdPlaceMatch?: boolean;
    team1Score?: number;
    team2Score?: number;
}

interface EliminationBracketTreeProps {
    rounds: Record<number, MatchData[]>;
}

export default function EliminationBracketTree({ rounds }: EliminationBracketTreeProps) {
    // Séparer la petite finale des autres matchs
    const thirdPlaceMatches: MatchData[] = [];
    const regularRounds: Record<number, MatchData[]> = {};
    
    Object.entries(rounds).forEach(([round, matches]) => {
        const roundNum = Number(round);
        regularRounds[roundNum] = [];
        
        matches.forEach(match => {
            if (match.isThirdPlaceMatch) {
                thirdPlaceMatches.push(match);
            } else {
                regularRounds[roundNum].push(match);
            }
        });
        
        // Trier les matchs par matchNumber dans chaque round
        if (regularRounds[roundNum].length > 0) {
            regularRounds[roundNum].sort((a, b) => a.matchNumber - b.matchNumber);
        } else {
            delete regularRounds[roundNum];
        }
    });

    const sortedRounds = Object.entries(regularRounds).sort(([a], [b]) => Number(a) - Number(b));
    const maxRound = Math.max(...Object.keys(regularRounds).map(Number));
    
    // Noms des rounds
    const getRoundName = (roundNum: number) => {
        const roundsCount = sortedRounds.length;
        const roundIndex = roundsCount - roundNum + 1;
        
        if (roundIndex === 0) return 'FINALE';
        if (roundIndex === 1) return 'DEMI-FINALE';
        if (roundIndex === 2) return 'QUART DE FINALE';
        if (roundIndex === 3) return '8ÈME DE FINALE';
        if (roundIndex === 4) return '16ÈME DE FINALE';
        return `ROUND ${roundNum}`;
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-max p-6">
                {/* Bracket horizontal */}
                <div className="flex gap-8 items-start">
                    {sortedRounds.map(([round, matches], roundIndex) => {
                        const roundNum = Number(round);
                        const isFirstRound = roundIndex === 0;
                        const isLastRound = roundNum === maxRound;
                        
                        return (
                            <div key={round} className="flex flex-col items-center">
                                {/* Titre du round */}
                                <div className={`mb-6 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${
                                    isLastRound 
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                }`}>
                                    {getRoundName(roundNum)}
                                </div>
                                
                                {/* Matchs du round */}
                                <div className="flex flex-col gap-8" style={{ 
                                    marginTop: isFirstRound ? '0' : `${Math.pow(2, roundIndex - 1) * 4}rem` 
                                }}>
                                    {matches.map((match) => (
                                        <div 
                                            key={match.id} 
                                            className="relative"
                                            style={{ 
                                                marginBottom: isFirstRound ? '0' : `${Math.pow(2, roundIndex) * 4}rem` 
                                            }}
                                        >
                                            {/* Carte du match */}
                                            <div className="bg-gray-800/90 backdrop-blur-sm border-2 border-gray-700 rounded-lg overflow-hidden w-64 shadow-xl hover:shadow-2xl transition-shadow">
                                                {/* En-tête du match */}
                                                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-3 py-1.5 flex items-center justify-between">
                                                    <span className="text-xs text-gray-300 font-semibold">
                                                        Match #{match.matchNumber}
                                                    </span>
                                                    {match.status === 'completed' && (
                                                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded">
                                                            Terminé
                                                        </span>
                                                    )}
                                                    {match.status === 'in_progress' && (
                                                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                                                            En cours
                                                        </span>
                                                    )}
                                                    {match.status === 'pending' && (
                                                        <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                                                            À venir
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Équipe 1 */}
                                                <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-700/50 ${
                                                    match.winnerId === match.team1Id 
                                                        ? 'bg-green-500/10 border-l-4 border-l-green-500' 
                                                        : match.status === 'completed'
                                                        ? 'bg-red-500/5 opacity-60'
                                                        : 'bg-gray-800/50'
                                                }`}>
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                        <span className={`font-semibold truncate ${
                                                            match.winnerId === match.team1Id ? 'text-white' : 'text-gray-300'
                                                        }`}>
                                                            {match.team1Name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-2">
                                                        {match.team1Score !== undefined && (
                                                            <span className={`text-lg font-bold ${
                                                                match.winnerId === match.team1Id ? 'text-green-400' : 'text-gray-500'
                                                            }`}>
                                                                {match.team1Score}
                                                            </span>
                                                        )}
                                                        {match.winnerId === match.team1Id && (
                                                            <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Équipe 2 */}
                                                <div className={`flex items-center justify-between px-4 py-3 ${
                                                    match.winnerId === match.team2Id 
                                                        ? 'bg-green-500/10 border-l-4 border-l-green-500' 
                                                        : match.status === 'completed'
                                                        ? 'bg-red-500/5 opacity-60'
                                                        : 'bg-gray-800/50'
                                                }`}>
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                        <span className={`font-semibold truncate ${
                                                            match.winnerId === match.team2Id ? 'text-white' : 'text-gray-300'
                                                        }`}>
                                                            {match.team2Name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-2">
                                                        {match.team2Score !== undefined && (
                                                            <span className={`text-lg font-bold ${
                                                                match.winnerId === match.team2Id ? 'text-green-400' : 'text-gray-500'
                                                            }`}>
                                                                {match.team2Score}
                                                            </span>
                                                        )}
                                                        {match.winnerId === match.team2Id && (
                                                            <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Ligne de connexion vers le prochain round */}
                                            {!isLastRound && (
                                                <div className="absolute left-full top-1/2 w-8 h-0.5 bg-gradient-to-r from-gray-600 to-transparent"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Petite finale (3ème place) */}
                {thirdPlaceMatches.length > 0 && (
                    <div className="mt-12 pt-8 border-t-2 border-gray-700">
                        <div className="flex flex-col items-center">
                            <div className="mb-6 px-4 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                                🥉 PETITE FINALE (3ÈME PLACE)
                            </div>
                            
                            {thirdPlaceMatches.map((match) => (
                                <div key={match.id} className="bg-gray-800/90 backdrop-blur-sm border-2 border-orange-500/50 rounded-lg overflow-hidden w-64 shadow-xl">
                                    {/* En-tête du match */}
                                    <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-3 py-1.5 flex items-center justify-between">
                                        <span className="text-xs text-white font-semibold">
                                            Match pour la 3ème place
                                        </span>
                                        {match.status === 'completed' && (
                                            <span className="text-xs px-2 py-0.5 bg-white/20 text-white rounded">
                                                Terminé
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Équipe 1 */}
                                    <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-700/50 ${
                                        match.winnerId === match.team1Id 
                                            ? 'bg-orange-500/10 border-l-4 border-l-orange-500' 
                                            : 'bg-gray-800/50'
                                    }`}>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Users className="w-4 h-4 text-orange-400 flex-shrink-0" />
                                            <span className={`font-semibold truncate ${
                                                match.winnerId === match.team1Id ? 'text-white' : 'text-gray-300'
                                            }`}>
                                                {match.team1Name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-2">
                                            {match.team1Score !== undefined && (
                                                <span className={`text-lg font-bold ${
                                                    match.winnerId === match.team1Id ? 'text-orange-400' : 'text-gray-500'
                                                }`}>
                                                    {match.team1Score}
                                                </span>
                                            )}
                                            {match.winnerId === match.team1Id && (
                                                <Medal className="w-4 h-4 text-orange-400 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Équipe 2 */}
                                    <div className={`flex items-center justify-between px-4 py-3 ${
                                        match.winnerId === match.team2Id 
                                            ? 'bg-orange-500/10 border-l-4 border-l-orange-500' 
                                            : 'bg-gray-800/50'
                                    }`}>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Users className="w-4 h-4 text-orange-400 flex-shrink-0" />
                                            <span className={`font-semibold truncate ${
                                                match.winnerId === match.team2Id ? 'text-white' : 'text-gray-300'
                                            }`}>
                                                {match.team2Name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-2">
                                            {match.team2Score !== undefined && (
                                                <span className={`text-lg font-bold ${
                                                    match.winnerId === match.team2Id ? 'text-orange-400' : 'text-gray-500'
                                                }`}>
                                                    {match.team2Score}
                                                </span>
                                            )}
                                            {match.winnerId === match.team2Id && (
                                                <Medal className="w-4 h-4 text-orange-400 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
