'use client';

import { Trophy, Medal, Award, Sparkles, Crown } from 'lucide-react';

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
    team2Id: string;
    winnerId?: string;
    loserId?: string;
    status: 'pending' | 'in_progress' | 'completed';
    phaseType?: 'group_stage' | 'play_in' | 'elimination';
    blocType?: 'A' | 'B';
    round?: number;
    isThirdPlaceMatch?: boolean;
}

interface PodiumProps {
    teams: MPTeam[];
    tournamentFormat?: 'groups_only' | 'groups_then_elimination' | 'elimination_direct';
    matches?: MatchData[];
}

export default function Podium({ teams, tournamentFormat = 'elimination_direct', matches = [] }: PodiumProps) {
    if (teams.length === 0) return null;
    
    // Trier les équipes selon le format du tournoi
    let sortedTeams = [...teams];
    
    if (tournamentFormat === 'groups_only') {
        // Pour groupe unique : trier par points
        sortedTeams = sortedTeams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.totalKills - a.totalKills;
        });
    } else if (tournamentFormat === 'groups_then_elimination' || tournamentFormat === 'elimination_direct') {
        // Pour élimination : déterminer le classement selon les résultats de la phase éliminatoire
        const eliminationMatches = matches.filter(m => m.phaseType === 'elimination');
        
        if (eliminationMatches.length > 0) {
            const finalRanking: MPTeam[] = [];
            const rankedTeamIds = new Set<string>();
            
            // Trouver le match de la finale (round le plus élevé)
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
            
            // 3ème : Vérifier si une petite finale existe
            const thirdPlaceMatch = eliminationMatches.find(m => m.isThirdPlaceMatch && m.status === 'completed');
            
            if (thirdPlaceMatch && thirdPlaceMatch.winnerId) {
                const thirdPlace = sortedTeams.find(t => t.id === thirdPlaceMatch.winnerId);
                if (thirdPlace && !rankedTeamIds.has(thirdPlace.id)) {
                    finalRanking.push(thirdPlace);
                    rankedTeamIds.add(thirdPlace.id);
                }
            } else if (maxRound > 1) {
                // Sinon, utiliser les perdants des demi-finales
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
                    if (finalRanking.length < 3) {
                        finalRanking.push(team);
                        rankedTeamIds.add(team.id);
                    }
                });
            }
            
            // Ajouter les équipes restantes triées par points (pour compléter le top 3)
            if (finalRanking.length < 3) {
                const remainingTeams = sortedTeams
                    .filter(t => !rankedTeamIds.has(t.id))
                    .sort((a, b) => {
                        if (b.points !== a.points) return b.points - a.points;
                        if (b.wins !== a.wins) return b.wins - a.wins;
                        return b.totalKills - a.totalKills;
                    });
                
                remainingTeams.forEach(team => {
                    if (finalRanking.length < 3) {
                        finalRanking.push(team);
                    }
                });
            }
            
            sortedTeams = finalRanking.length > 0 ? finalRanking : sortedTeams;
        } else {
            // Pas de matchs d'élimination, trier par points
            sortedTeams = sortedTeams.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.wins !== a.wins) return b.wins - a.wins;
                return b.totalKills - a.totalKills;
            });
        }
    }
    
    const positions = [
        { 
            bg: 'from-yellow-300 via-yellow-400 to-amber-500', 
            icon: Trophy, 
            label: '1er',
            shadow: 'shadow-yellow-500/60',
            ring: 'ring-yellow-400/60',
            glow: 'shadow-[0_0_40px_rgba(234,179,8,0.6)]',
            height: 'min-h-[20rem] md:min-h-[22rem]',
            order: 'md:order-2',
            scale: 'md:scale-110',
            textGlow: 'drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]'
        },
        { 
            bg: 'from-slate-300 via-slate-400 to-slate-500', 
            icon: Medal, 
            label: '2ème',
            shadow: 'shadow-slate-400/60',
            ring: 'ring-slate-300/60',
            glow: 'shadow-[0_0_30px_rgba(148,163,184,0.5)]',
            height: 'min-h-[18rem] md:min-h-[20rem]',
            order: 'md:order-1',
            scale: '',
            textGlow: 'drop-shadow-[0_0_8px_rgba(148,163,184,0.8)]'
        },
        { 
            bg: 'from-orange-400 via-orange-500 to-orange-600', 
            icon: Award, 
            label: '3ème',
            shadow: 'shadow-orange-500/60',
            ring: 'ring-orange-400/60',
            glow: 'shadow-[0_0_30px_rgba(249,115,22,0.5)]',
            height: 'min-h-[16rem] md:min-h-[18rem]',
            order: 'md:order-3',
            scale: '',
            textGlow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
        }
    ];
    
    return (
        <div className="relative py-12 px-4">
            {/* Effet de fond avec particules */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Titre avec effet */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                        <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-2xl">
                            PODIUM
                        </h2>
                        <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                    </div>
                    <p className="text-gray-300 text-lg">Les champions du tournoi</p>
                </div>
                
                {/* Podium */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {sortedTeams.slice(0, 3).map((team, index) => {
                        if (index >= 3) return null;
                        
                        const pos = positions[index];
                        const Icon = pos.icon;
                        
                        return (
                            <div
                                key={team.id}
                                className={`${pos.order} ${pos.scale} transform hover:scale-105 transition-all duration-500`}
                            >
                                <div className={`relative bg-gradient-to-br ${pos.bg} rounded-3xl p-8 ${pos.height} flex flex-col justify-between ${pos.shadow} ${pos.glow} ring-4 ${pos.ring} overflow-hidden group`}>
                                    {/* Effet de brillance animé */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    
                                    {/* Particules flottantes */}
                                    <div className="absolute top-4 right-4 w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
                                    <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-500"></div>
                                    
                                    {/* Contenu */}
                                    <div className="relative z-10">
                                        {/* En-tête avec icône et position */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="relative">
                                                <Icon className={`w-16 h-16 text-white ${pos.textGlow} animate-bounce-slow`} />
                                                {index === 0 && (
                                                    <Crown className="absolute -top-2 -right-2 w-8 h-8 text-yellow-200 animate-pulse" />
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-6xl font-black text-white ${pos.textGlow}`}>
                                                    {pos.label}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Nom de l'équipe */}
                                        <div className="text-center mt-8">
                                            <h3 className={`text-3xl font-black text-white mb-3 ${pos.textGlow} leading-tight`}>
                                                {team.name}
                                            </h3>
                                        </div>
                                    </div>
                                    
                                    {/* Statistiques avec design amélioré */}
                                    <div className="relative z-10">
                                        <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-inner">
                                            {tournamentFormat === 'groups_only' ? (
                                                // Pour groupe uniquement : afficher Points
                                                <>
                                                    <div className="flex justify-center items-baseline gap-2 mb-4">
                                                        <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">Points</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className={`text-5xl font-black text-white ${pos.textGlow} mb-2`}>
                                                            {team.points}
                                                        </div>
                                                        <div className="flex justify-center gap-4 text-sm text-white/90">
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-bold text-lg">{team.wins}</span>
                                                                <span className="text-xs opacity-80">Victoires</span>
                                                            </div>
                                                            <div className="w-px bg-white/30"></div>
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-bold text-lg">{team.totalKills}</span>
                                                                <span className="text-xs opacity-80">Kills</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                // Pour élimination : afficher Victoires/Défaites
                                                <>
                                                    <div className="flex justify-center items-baseline gap-2 mb-4">
                                                        <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">Bilan</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="flex justify-center gap-6 mb-3">
                                                            <div className="flex flex-col items-center">
                                                                <div className={`text-5xl font-black text-green-400 ${pos.textGlow}`}>
                                                                    {team.wins}
                                                                </div>
                                                                <span className="text-xs text-white/80 uppercase tracking-wider mt-1">Victoires</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <div className="w-px h-16 bg-white/30"></div>
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <div className={`text-5xl font-black text-red-400 ${pos.textGlow}`}>
                                                                    {team.losses}
                                                                </div>
                                                                <span className="text-xs text-white/80 uppercase tracking-wider mt-1">Défaites</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-center gap-4 text-sm text-white/90 pt-3 border-t border-white/20">
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-bold text-lg">{team.totalKills}</span>
                                                                <span className="text-xs opacity-80">Kills</span>
                                                            </div>
                                                            <div className="w-px bg-white/30"></div>
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-bold text-lg">{team.roundsWon}</span>
                                                                <span className="text-xs opacity-80">Rounds</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Effet de lueur en bas */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Message de félicitations */}
                <div className="text-center mt-12">
                    <div className="inline-block bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl px-8 py-4 border border-yellow-500/30">
                        <p className="text-yellow-300 text-lg font-semibold">
                            🎉 Félicitations aux vainqueurs ! 🎉
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Animation CSS personnalisée */}
            <style jsx>{`
                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
                .delay-500 {
                    animation-delay: 500ms;
                }
                .delay-1000 {
                    animation-delay: 1000ms;
                }
            `}</style>
        </div>
    );
}
