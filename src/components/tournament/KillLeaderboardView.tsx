'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Target, Crosshair, Crown, Zap, Flame } from 'lucide-react';
import { TournamentKillLeaderboard, KillLeaderboardEntry } from '@/types/tournament-multi';
import { KillLeaderboardService } from '@/services/killLeaderboardService';

interface KillLeaderboardViewProps {
    leaderboard: TournamentKillLeaderboard | null;
}

export default function KillLeaderboardView({ leaderboard }: KillLeaderboardViewProps) {
    const [globalRecords, setGlobalRecords] = useState<{
        topTotalKills: KillLeaderboardEntry | null;
        topAverageKills: KillLeaderboardEntry | null;
        topSingleGame: KillLeaderboardEntry | null;
    } | null>(null);

    // Charger les records globaux
    useEffect(() => {
        if (leaderboard?.gameMode) {
            loadGlobalRecords();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leaderboard?.gameMode]);

    const loadGlobalRecords = async () => {
        if (!leaderboard?.gameMode) return;
        
        try {
            const records = await KillLeaderboardService.getGlobalRecordsByMode(leaderboard.gameMode);
            setGlobalRecords(records);
        } catch (error) {
            console.error('Erreur lors du chargement des records globaux:', error);
        }
    };
    if (!leaderboard || leaderboard.entries.length === 0) {
        return (
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 border border-gray-700 text-center">
                <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 text-xl">Aucune donnée de kills disponible pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Records Globaux (tous tournois) */}
            {globalRecords && (globalRecords.topTotalKills || globalRecords.topAverageKills || globalRecords.topSingleGame) && (
                <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-2 border-yellow-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Crown className="w-8 h-8 text-yellow-400" />
                        <h2 className="text-2xl font-bold text-white">🏆 Records de Tous les Temps</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Record Total Kills */}
                        {globalRecords.topTotalKills && (
                            <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-xl p-4 text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <Flame className="w-5 h-5" />
                                    <span className="text-sm font-semibold opacity-90">Plus de Kills Totaux</span>
                                </div>
                                <div className="text-3xl font-bold mb-1">{globalRecords.topTotalKills.killStats.totalKills}</div>
                                <div className="text-sm opacity-90 truncate">{globalRecords.topTotalKills.playerName}</div>
                                <div className="text-xs opacity-75 truncate">{globalRecords.topTotalKills.teamName}</div>
                            </div>
                        )}
                        
                        {/* Record Moyenne */}
                        {globalRecords.topAverageKills && (
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-5 h-5" />
                                    <span className="text-sm font-semibold opacity-90">Meilleure Moyenne</span>
                                </div>
                                <div className="text-3xl font-bold mb-1">{globalRecords.topAverageKills.killStats.averageKillsPerGame.toFixed(1)}</div>
                                <div className="text-sm opacity-90 truncate">{globalRecords.topAverageKills.playerName}</div>
                                <div className="text-xs opacity-75 truncate">{globalRecords.topAverageKills.teamName}</div>
                            </div>
                        )}
                        
                        {/* Record Single Game */}
                        {globalRecords.topSingleGame && (
                            <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl p-4 text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-5 h-5" />
                                    <span className="text-sm font-semibold opacity-90">Meilleur Match</span>
                                </div>
                                <div className="text-3xl font-bold mb-1">{globalRecords.topSingleGame.killStats.bestSingleGame}</div>
                                <div className="text-sm opacity-90 truncate">{globalRecords.topSingleGame.playerName}</div>
                                <div className="text-xs opacity-75 truncate">{globalRecords.topSingleGame.teamName}</div>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-center text-sm text-yellow-300/80">
                        ⭐ Records établis sur l&apos;ensemble des tournois pour ce mode de jeu
                    </div>
                </div>
            )}

            {/* Statistiques du tournoi actuel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Target className="w-8 h-8" />
                        <span className="text-sm font-semibold opacity-90">Total</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{leaderboard.stats.totalKills}</div>
                    <div className="text-sm opacity-90">Kills totaux</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="w-8 h-8" />
                        <span className="text-sm font-semibold opacity-90">Moyenne</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{leaderboard.stats.averageKillsPerGame.toFixed(1)}</div>
                    <div className="text-sm opacity-90">Kills par match</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Crosshair className="w-8 h-8" />
                        <span className="text-sm font-semibold opacity-90">Record</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{leaderboard.stats.topPlayerTotalKills.kills}</div>
                    <div className="text-sm opacity-90 truncate">{leaderboard.stats.topPlayerTotalKills.playerName}</div>
                </div>
            </div>

            {/* Podium Top 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {leaderboard.entries.slice(0, 3).map((entry, index) => {
                    const positions = [
                        { bg: 'from-yellow-500 to-yellow-600', icon: Trophy, label: '1er', border: 'border-yellow-400' },
                        { bg: 'from-gray-400 to-gray-500', icon: Medal, label: '2ème', border: 'border-gray-400' },
                        { bg: 'from-orange-600 to-orange-700', icon: Award, label: '3ème', border: 'border-orange-600' }
                    ];
                    const pos = positions[index];
                    const Icon = pos.icon;

                    return (
                        <div
                            key={entry.playerId}
                            className={`bg-gradient-to-br ${pos.bg} rounded-2xl p-6 text-white transform hover:scale-105 transition-transform duration-200 border-2 ${pos.border} ${
                                index === 0 ? 'md:order-2 md:scale-110' : index === 1 ? 'md:order-1' : 'md:order-3'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <Icon className="w-10 h-10" />
                                <span className="text-3xl font-bold">{pos.label}</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-1">{entry.playerName}</h3>
                            <p className="text-sm opacity-90 mb-4">{entry.teamName}</p>
                            <div className="space-y-2 text-sm opacity-90">
                                <div className="flex justify-between">
                                    <span>Total Kills:</span>
                                    <span className="font-bold text-lg">{entry.killStats.totalKills}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Matchs joués:</span>
                                    <span className="font-bold">{entry.killStats.gamesPlayed}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Moyenne:</span>
                                    <span className="font-bold">{entry.killStats.averageKillsPerGame.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Meilleur match:</span>
                                    <span className="font-bold">{entry.killStats.bestSingleGame}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Classement complet */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Target className="w-6 h-6" />
                        Classement des Kills
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Position</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Joueur</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Équipe</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Total Kills</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Matchs</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Moyenne</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Meilleur</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {leaderboard.entries.map((entry, index) => (
                                <tr
                                    key={entry.playerId}
                                    className={`hover:bg-gray-700/30 transition-colors ${
                                        index < 3 ? 'bg-yellow-500/5' : ''
                                    }`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-bold text-white">
                                                #{entry.position}
                                            </span>
                                            {index === 0 && <Trophy className="w-5 h-5 text-yellow-400" />}
                                            {index === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                                            {index === 2 && <Award className="w-5 h-5 text-orange-600" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-white">{entry.playerName}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-300">{entry.teamName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Target className="w-4 h-4 text-orange-400" />
                                            <span className="text-xl font-bold text-orange-400">
                                                {entry.killStats.totalKills}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-gray-300">{entry.killStats.gamesPlayed}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-blue-400 font-semibold">
                                            {entry.killStats.averageKillsPerGame.toFixed(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-purple-400 font-semibold">
                                            {entry.killStats.bestSingleGame}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Note explicative */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-orange-300 mb-3">À propos du Kill Leaderboard</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                        <p className="mb-2">
                            <strong className="text-white">Total Kills</strong> : Nombre total de kills cumulés sur tous les matchs
                        </p>
                        <p className="mb-2">
                            <strong className="text-white">Moyenne</strong> : Kills moyens par match joué
                        </p>
                    </div>
                    <div>
                        <p className="mb-2">
                            <strong className="text-white">Meilleur</strong> : Plus grand nombre de kills en un seul match
                        </p>
                        <p>
                            <strong className="text-white">Classement</strong> : Basé sur le total de kills cumulés
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
