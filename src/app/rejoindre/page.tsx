'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Search, Users, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoUpload from '@/components/VideoUpload';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { joinTeamSchema, JoinTeamFormData } from '@/lib/validations';

const countries = [
    'France', 'Algérie', 'Bénin', 'Maroc', 'Tunisie', 'Belgique', 'Suisse', 'Canada',
    'Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso', 'Niger', 'Madagascar',
    'Cameroun', 'Gabon', 'République démocratique du Congo', 'Autre'
];

interface Player {
    pseudo: string;
    country: string;
    whatsapp: string;
    deviceCheckVideo: string;
}

interface Team {
    id: string;
    name: string;
    code: string;
    captain: {
        pseudo: string;
        country: string;
    };
    players: Player[];
    status: string;
}

function RejoindreEquipePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledCode = searchParams.get('code') || '';

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [teamInfo, setTeamInfo] = useState<Team | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    interface UploadState {
    isUploading?: boolean;
    uploadedUrl?: string;
    error?: string | null;
}

const [uploadState, setUploadState] = useState<UploadState>({});
    const { upload } = useCloudinaryUpload(); // Déplacer le hook ici

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<JoinTeamFormData>({
        resolver: zodResolver(joinTeamSchema),
        defaultValues: {
            teamCode: prefilledCode,
            player: {
                pseudo: '',
                country: '',
                whatsapp: '',
            },
        },
    });

    const teamCode = watch('teamCode');

    // Rechercher l'équipe automatiquement quand le code change
    useEffect(() => {
        if (teamCode && teamCode.length === 6) {
            searchTeam(teamCode);
        } else {
            setTeamInfo(null);
        }
    }, [teamCode]);

    const searchTeam = async (code: string) => {
        if (!code || code.length !== 6) return;

        setIsSearching(true);
        try {
            const response = await fetch(`/api/teams/search?code=${code}`);

            if (response.ok) {
                const team = await response.json();
                setTeamInfo(team);
            } else {
                setTeamInfo(null);
                if (response.status === 404) {
                    toast.error('Équipe introuvable avec ce code');
                }
            }
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            setTeamInfo(null);
        } finally {
            setIsSearching(false);
        }
    };

    const handleVideoUpload = async (file: File) => {
        try {
            setUploadState({ isUploading: true, error: null });

            console.log('Démarrage upload pour:', file.name);
            const result = await upload(file, 'device-checks');
            console.log('Upload terminé:', result.secure_url);

            setUploadState({
                isUploading: false,
                uploadedUrl: result.secure_url,
                error: null
            });

            setValue('player.deviceCheckVideo', result.secure_url as string);
            toast.success('Vidéo uploadée avec succès !');

        } catch (error) {
            console.error('Erreur upload:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload de la vidéo';

            setUploadState({
                isUploading: false,
                error: errorMessage
            });

            toast.error(errorMessage);
        }
    };

    const onSubmit = async (data: JoinTeamFormData) => {
        if (!teamInfo) {
            toast.error('Veuillez d\'abord rechercher une équipe valide');
            return;
        }

        if (teamInfo.players.length >= 4) {
            toast.error('Cette équipe est déjà complète');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/teams/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    teamId: teamInfo.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'ajout à l\'équipe');
            }

            toast.success('Vous avez rejoint l\'équipe avec succès !');
            router.push(`/suivi?code=${data.teamCode}`);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'inscription');
            console.error('Erreur inscription:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                        Rejoindre une équipe
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Entrez le code d&apos;équipe pour rejoindre une équipe existante
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Recherche d'équipe */}
                    <section className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <Search className="w-6 h-6 mr-3 text-blue-400" />
                            Code d&apos;équipe
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Entrez le code à 6 caractères *
                                </label>
                                <input
                                    {...register('teamCode')}
                                    type="text"
                                    maxLength={6}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono uppercase"
                                    placeholder="ABC123"
                                    onChange={(e) => {
                                        e.target.value = e.target.value.toUpperCase();
                                        register('teamCode').onChange(e);
                                    }}
                                />
                                {errors.teamCode && (
                                    <p className="mt-1 text-sm text-red-400">{errors.teamCode.message}</p>
                                )}
                            </div>

                            {/* Résultat de la recherche */}
                            {isSearching && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                                    <span className="ml-3 text-gray-300">Recherche en cours...</span>
                                </div>
                            )}

                            {teamInfo && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <Users className="w-6 h-6 text-green-400 mr-3" />
                                        <h3 className="text-xl font-semibold text-white">Équipe trouvée !</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                                        <div>
                                            <p><span className="font-medium">Nom :</span> {teamInfo.name}</p>
                                            <p><span className="font-medium">Capitaine :</span> {teamInfo.captain.pseudo}</p>
                                        </div>
                                        <div>
                                            <p><span className="font-medium">Pays du capitaine :</span> {teamInfo.captain.country}</p>
                                            <p><span className="font-medium">Joueurs :</span> {teamInfo.players.length}/4</p>
                                        </div>
                                    </div>

                                    {teamInfo.players.length >= 4 && (
                                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                            <div className="flex items-center text-red-400">
                                                <AlertCircle className="w-5 h-5 mr-2" />
                                                <span className="font-medium">Cette équipe est complète (4/4 joueurs)</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {teamCode && teamCode.length === 6 && !isSearching && !teamInfo && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                                    <div className="flex items-center text-red-400">
                                        <AlertCircle className="w-6 h-6 mr-3" />
                                        <div>
                                            <h3 className="font-semibold">Équipe introuvable</h3>
                                            <p className="text-sm">Aucune équipe trouvée avec ce code. Vérifiez le code et réessayez.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Informations du joueur */}
                    {teamInfo && teamInfo.players.length < 4 && (
                        <section className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <UserPlus className="w-6 h-6 mr-3 text-green-400" />
                                Vos informations
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Pseudo en jeu *
                                    </label>
                                    <input
                                        {...register('player.pseudo')}
                                        type="text"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Votre pseudo COD Mobile"
                                    />
                                    {errors.player?.pseudo && (
                                        <p className="mt-1 text-sm text-red-400">{errors.player.pseudo.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Pays *
                                    </label>
                                    <select
                                        {...register('player.country')}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Sélectionnez votre pays</option>
                                        {countries.map((country) => (
                                            <option key={country} value={country}>
                                                {country}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.player?.country && (
                                        <p className="mt-1 text-sm text-red-400">{errors.player.country.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Numéro WhatsApp *
                                    </label>
                                    <input
                                        {...register('player.whatsapp')}
                                        type="tel"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                    {errors.player?.whatsapp && (
                                        <p className="mt-1 text-sm text-red-400">{errors.player.whatsapp.message}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <VideoUpload
                                        onUpload={handleVideoUpload}
                                        isUploading={uploadState?.isUploading}
                                        uploadedUrl={uploadState?.uploadedUrl}
                                        error={uploadState?.error ?? undefined}
                                        required
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Bouton de soumission */}
                    {teamInfo && teamInfo.players.length < 4 && (
                        <div className="text-center">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Rejoindre l&apos;équipe...</span>
                                    </div>
                                ) : (
                                    `Rejoindre l'équipe "${teamInfo.name}"`
                                )}
                            </button>

                            <p className="mt-4 text-gray-400 text-sm">
                                En rejoignant cette équipe, vous acceptez les règles du tournoi.
                            </p>
                        </div>
                    )}
                </form>

                {/* Informations */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-blue-500/10 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                        <h3 className="text-lg font-semibold text-blue-400 mb-3">💡 Comment rejoindre une équipe ?</h3>
                        <div className="space-y-2 text-gray-300 text-sm">
                            <p>1. Demandez le code d&apos;équipe à 6 caractères au capitaine</p>
                            <p>2. Entrez le code dans le champ ci-dessus</p>
                            <p>3. Remplissez vos informations et uploadez votre vidéo de device check</p>
                            <p>4. Attendez la validation de votre profil par les administrateurs</p>
                        </div>
                    </div>

                    <div className="bg-green-500/10 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
                        <h3 className="text-lg font-semibold text-green-400 mb-3">🚀 Pas de code d&apos;équipe ?</h3>
                        <p className="text-gray-300 text-sm mb-4">
                            Si vous n&apos;avez pas encore d&apos;équipe, vous pouvez créer la vôtre et inviter vos amis !
                        </p>
                        <Link
                            href="/inscription"
                            className="inline-flex items-center bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Créer une équipe
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

import { Suspense } from 'react';

export default function RejoindreEquipePage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <RejoindreEquipePageContent />
        </Suspense>
    );
}
