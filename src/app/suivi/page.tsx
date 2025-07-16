'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Users, CheckCircle, Clock, XCircle, AlertCircle, Copy, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatRelativeTime } from '@/lib/utils';

interface Player {
    id: string;
    pseudo: string;
    country: string;
    whatsapp: string;
    status: 'pending' | 'validated' | 'rejected';
    joinedAt: string;
    validatedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    isCaptain: boolean;
    deviceCheckVideo?: string;
}

interface Team {
    id: string;
    name: string;
    code: string;
    captain: Player;
    players: Player[];
    status: 'incomplete' | 'complete' | 'validated' | 'rejected';
    createdAt: string;
    updatedAt: string;
    validatedAt?: string;
}

function SuiviPageContent() {
    const searchParams = useSearchParams();
    const prefilledCode = searchParams.get('code') || '';

    const [teamCode, setTeamCode] = useState(prefilledCode);
    const [team, setTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    

    useEffect(() => {
        if (prefilledCode) {
            searchTeam(prefilledCode);
        }
    }, [prefilledCode]);

    const searchTeam = async (code: string) => {
        if (!code || code.length !== 6) {
            setError('Le code d\'équipe doit contenir 6 caractères');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/teams/search?code=${code}`);

            if (response.ok) {
                const teamData = await response.json();
                setTeam(teamData);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Équipe introuvable');
                setTeam(null);
            }
        } catch {
            setError('Erreur lors de la recherche');
            setTeam(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchTeam(teamCode);
    };

    const copyToClipboard = async () => {
        if (team?.code) {
            try {
                await navigator.clipboard.writeText(team.code);
                toast.success('Code copié dans le presse-papiers !');
            } catch {
                toast.error('Erreur lors de la copie');
            }
        }
    };

    const shareTeam = async () => {
        if (team?.code && navigator.share) {
            try {
                await navigator.share({
                    title: `Rejoindre l'équipe ${team.name} - Tournoi COD Mobile`,
                    text: `Rejoignez l'équipe "${team.name}" avec le code: ${team.code}`,
                    url: `${window.location.origin}/rejoindre?code=${team.code}`,
                });
            } catch {
                const shareUrl = `${window.location.origin}/rejoindre?code=${team.code}`;
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success('Lien de partage copié !');
                } catch {
                    toast.error('Erreur lors du partage');
                }
            }
        } else if (team?.code) {
            const shareUrl = `${window.location.origin}/rejoindre?code=${team.code}`;
            try {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Lien de partage copié !');
            } catch {
                toast.error('Erreur lors du partage');
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'validated': return 'text-green-400';
            case 'rejected': return 'text-red-400';
            case 'pending': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'validated': return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-400" />;
            case 'pending': return <Clock className="w-5 h-5 text-yellow-400" />;
            default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'validated': return 'Validé';
            case 'rejected': return 'Refusé';
            case 'pending': return 'En attente';
            default: return 'Inconnu';
        }
    };

    const getTeamStatusColor = (status: string) => {
        switch (status) {
            case 'validated': return 'from-green-500 to-emerald-500';
            case 'rejected': return 'from-red-500 to-pink-500';
            case 'complete': return 'from-blue-500 to-purple-500';
            case 'incomplete': return 'from-yellow-500 to-orange-500';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const getTeamStatusText = (status: string) => {
        switch (status) {
            case 'validated': return 'Équipe validée ✅';
            case 'rejected': return 'Équipe refusée ❌';
            case 'complete': return 'Équipe complète (en attente de validation)';
            case 'incomplete': return 'Équipe incomplète';
            default: return 'Statut inconnu';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
                            <Search className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                        Suivi d&apos;équipe
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Entrez votre code d&apos;équipe pour suivre le statut de validation
                    </p>
                </div>

                {/* Formulaire de recherche */}
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={teamCode}
                                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-widest font-mono"
                                placeholder="ABC123"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Recherche...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        <span>Rechercher</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Erreur */}
                {error && (
                    <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                        <div className="flex items-center text-red-400">
                            <XCircle className="w-6 h-6 mr-3" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Informations de l'équipe */}
                {team && (
                    <div className="space-y-8">
                        {/* Status global */}
                        <div className={`bg-gradient-to-r ${getTeamStatusColor(team.status)} p-1 rounded-2xl`}>
                            <div className="bg-gray-900 rounded-xl p-6">
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold text-white mb-2">{team.name}</h2>
                                    <p className="text-xl text-gray-300 mb-4">{getTeamStatusText(team.status)}</p>
                                    <div className="flex items-center justify-center space-x-4">
                                        <div className="bg-gray-800 rounded-lg px-4 py-2">
                                            <span className="text-gray-400 text-sm">Code d&apos;équipe :</span>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-2xl font-bold text-white tracking-widest">{team.code}</span>
                                                <button
                                                    onClick={copyToClipboard}
                                                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                                                    title="Copier le code"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={shareTeam}
                                                    className="text-green-400 hover:text-green-300 transition-colors duration-200"
                                                    title="Partager l'équipe"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statistiques */}
                        <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-6">Statistiques de l&apos;équipe</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-400">{team.players.length}/4</div>
                                    <div className="text-gray-400 text-sm">Joueurs</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-400">
                                        {team.players.filter(p => p.status === 'validated').length}
                                    </div>
                                    <div className="text-gray-400 text-sm">Validés</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-400">
                                        {team.players.filter(p => p.status === 'pending').length}
                                    </div>
                                    <div className="text-gray-400 text-sm">En attente</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-400">
                                        {team.players.filter(p => p.status === 'rejected').length}
                                    </div>
                                    <div className="text-gray-400 text-sm">Refusés</div>
                                </div>
                            </div>
                        </div>

                        {/* Liste des joueurs */}
                        <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                <Users className="w-6 h-6 mr-3 text-blue-400" />
                                Membres de l&apos;équipe
                            </h3>

                            <div className="space-y-4">
                                {team.players.map((player) => (
                                    <div
                                        key={player.id}
                                        className="bg-gray-700/50 rounded-lg p-6 border border-gray-600"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(player.status)}
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-lg font-semibold text-white">
                                                                {player.pseudo}
                                                            </span>
                                                            {player.isCaptain && (
                                                                <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                                                                    CAPITAINE
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-400 text-sm">{player.country}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className={`font-semibold ${getStatusColor(player.status)}`}>
                                                    {getStatusText(player.status)}
                                                </div>
                                                <p className="text-gray-500 text-xs">
                                                    Rejoint {formatRelativeTime(new Date(player.joinedAt))}
                                                </p>
                                                {player.validatedAt && (
                                                    <p className="text-green-500 text-xs">
                                                        Validé {formatRelativeTime(new Date(player.validatedAt))}
                                                    </p>
                                                )}
                                                {player.rejectedAt && (
                                                    <p className="text-red-500 text-xs">
                                                        Refusé {formatRelativeTime(new Date(player.rejectedAt))}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {player.rejectionReason && (
                                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                                <p className="text-red-400 text-sm">
                                                    <strong>Raison du refus :</strong> {player.rejectionReason}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Slots vides */}
                                {Array.from({ length: 4 - team.players.length }).map((_, index) => (
                                    <div
                                        key={`empty-${index}`}
                                        className="bg-gray-700/30 rounded-lg p-6 border border-gray-600 border-dashed"
                                    >
                                        <div className="text-center text-gray-500">
                                            <Users className="w-8 h-8 mx-auto mb-2" />
                                            <p className="text-sm">Slot libre</p>
                                            <p className="text-xs">
                                                Partagez le code d&apos;équipe pour recruter ce joueur
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Informations importantes */}
                        <div className="bg-blue-500/10 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                            <h3 className="text-lg font-semibold text-blue-400 mb-3">📋 Informations importantes</h3>
                            <div className="space-y-2 text-gray-300 text-sm">
                                <p>• Une équipe est considérée comme valide avec au moins 3 joueurs validés</p>
                                <p>• La validation des vidéos peut prendre jusqu&apos;à 48 heures</p>
                                <p>• En cas de refus, vous pouvez contacter les administrateurs pour plus d&apos;informations</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

import { Suspense } from 'react';

export default function SuiviPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <SuiviPageContent />
        </Suspense>
    );
}
