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
    
    // Calculer le nombre total d'équipes au départ (depuis le premier round)
    const firstRound = sortedRounds.length > 0 ? sortedRounds[0] : null;
    const initialTeamsCount = firstRound ? firstRound[1].length * 2 : 0;
    const totalExpectedRounds = initialTeamsCount > 0 ? Math.ceil(Math.log2(initialTeamsCount)) : 0;
    
    // Trouver le gagnant de la finale (uniquement si on est au dernier round prévu)
    const isFinaleRound = maxRound === totalExpectedRounds;
    const finaleMatch = isFinaleRound ? regularRounds[maxRound]?.find(m => m.status === 'completed' && m.winnerId) : null;
    const tournamentWinner = finaleMatch ? {
        teamId: finaleMatch.winnerId,
        teamName: finaleMatch.winnerId === finaleMatch.team1Id ? finaleMatch.team1Name : finaleMatch.team2Name
    } : null;
    
    // Noms des rounds basés sur le nombre total de rounds prévus
    const getRoundName = (roundNum: number) => {
        // Calculer la position du round par rapport à la fin
        const roundsFromEnd = totalExpectedRounds - roundNum;
        
        if (roundsFromEnd === 0) return 'FINALE';
        if (roundsFromEnd === 1) return 'DEMI-FINALE';
        if (roundsFromEnd === 2) return 'QUART DE FINALE';
        if (roundsFromEnd === 3) return '8ÈME DE FINALE';
        if (roundsFromEnd === 4) return '16ÈME DE FINALE';
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
                    
                    {/* Colonne du gagnant après la finale */}
                    {tournamentWinner && sortedRounds.length > 0 && Number(sortedRounds[sortedRounds.length - 1][0]) === maxRound && (
                        <div className="flex flex-col items-center justify-center ml-8">
                            {/* Titre */}
                            <div className="mb-6 px-6 py-3 rounded-xl font-black text-lg bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-pulse">
                                🏆 CHAMPION 🏆
                            </div>
                            
                            {/* Carte du gagnant */}
                            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-2xl overflow-hidden w-72 shadow-[0_0_40px_rgba(234,179,8,0.8)] border-4 border-yellow-300 relative group">
                                {/* Effet de brillance animé */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
                                
                                {/* Particules flottantes */}
                                <div className="absolute top-4 right-4 w-3 h-3 bg-white rounded-full animate-ping"></div>
                                <div className="absolute top-8 left-6 w-2 h-2 bg-white/70 rounded-full animate-pulse"></div>
                                <div className="absolute bottom-8 right-8 w-2.5 h-2.5 bg-white/60 rounded-full animate-bounce"></div>
                                
                                {/* Contenu */}
                                <div className="relative z-10 p-8">
                                    {/* Icône trophée */}
                                    <div className="flex justify-center mb-6">
                                        <div className="bg-white/30 backdrop-blur-sm p-4 rounded-full">
                                            <Trophy className="w-16 h-16 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                        </div>
                                    </div>
                                    
                                    {/* Nom de l'équipe gagnante */}
                                    <div className="text-center">
                                        <h3 className="text-3xl font-black text-white mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-tight">
                                            {tournamentWinner.teamName}
                                        </h3>
                                        <div className="inline-block bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full">
                                            <p className="text-sm font-bold text-white uppercase tracking-wider">
                                                Vainqueur du Tournoi
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Barre de lueur en bas */}
                                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                            </div>
                            
                            {/* Confettis décoratifs */}
                            <div className="mt-6 flex gap-2">
                                <span className="text-3xl animate-bounce">🎉</span>
                                <span className="text-3xl animate-bounce delay-100">🎊</span>
                                <span className="text-3xl animate-bounce delay-200">🏆</span>
                                <span className="text-3xl animate-bounce delay-100">🎊</span>
                                <span className="text-3xl animate-bounce">🎉</span>
                            </div>
                        </div>
                    )}
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
            
            {/* Animations CSS personnalisées */}
            <style jsx>{`
                .delay-100 {
                    animation-delay: 100ms;
                }
                .delay-200 {
                    animation-delay: 200ms;
                }
            `}</style>
        </div>
    );
}
