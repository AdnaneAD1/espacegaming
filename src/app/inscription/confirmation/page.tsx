'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Copy, Share2, Users, Clock } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function ConfirmationPageContent() {
    const searchParams = useSearchParams();
    const teamCode = searchParams.get('code');
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        if (teamCode) {
            try {
                await navigator.clipboard.writeText(teamCode);
                setCopied(true);
                toast.success('Code copié dans le presse-papiers !');
                setTimeout(() => setCopied(false), 2000);
            } catch {
                toast.error('Erreur lors de la copie');
            }
        }
    };

    const shareTeam = async () => {
        if (teamCode && navigator.share) {
            try {
                await navigator.share({
                    title: 'Rejoindre mon équipe - Tournoi COD Mobile',
                    text: `Rejoignez mon équipe avec le code: ${teamCode}`,
                    url: `${window.location.origin}/rejoindre?code=${teamCode}`,
                });
            } catch {
                // Fallback: copier le lien
                const shareUrl = `${window.location.origin}/rejoindre?code=${teamCode}`;
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success('Lien de partage copié !');
                } catch {
                    toast.error('Erreur lors du partage');
                }
            }
        } else {
            // Fallback pour navigateurs qui ne supportent pas Web Share API
            const shareUrl = `${window.location.origin}/rejoindre?code=${teamCode}`;
            try {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Lien de partage copié !');
            } catch {
                toast.error('Erreur lors du partage');
            }
        }
    };

    if (!teamCode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
                <Navbar />
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <div className="bg-red-500/20 rounded-2xl p-8 border border-red-700">
                        <h1 className="text-2xl font-bold text-white mb-4">Code d&apos;équipe manquant</h1>
                        <p className="text-gray-300 mb-6">
                            Il semble qu&apos;il y ait un problème avec votre inscription.
                        </p>
                        <Link
                            href="/inscription"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                        >
                            Retour à l&apos;inscription
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                        Équipe créée avec succès !
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Votre équipe a été enregistrée pour le tournoi Battle Royale Squad
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Code d&apos;équipe */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <Users className="w-6 h-6 mr-3 text-blue-400" />
                            Code d&apos;équipe
                        </h2>

                        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30 mb-6">
                            <div className="text-center">
                                <p className="text-gray-300 mb-2">Votre code d&apos;équipe unique :</p>
                                <div className="text-4xl font-bold text-white tracking-widest mb-4">
                                    {teamCode}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
                                    >
                                        <Copy className="w-4 h-4" />
                                        <span>{copied ? 'Copié !' : 'Copier'}</span>
                                    </button>
                                    <button
                                        onClick={shareTeam}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span>Partager</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 text-gray-300">
                            <p className="flex items-center">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                                Partagez ce code avec d&apos;autres joueurs pour qu&apos;ils rejoignent votre équipe
                            </p>
                            <p className="flex items-center">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                                Maximum 4 joueurs par équipe (capitaine inclus)
                            </p>
                            <p className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                                Les nouveaux membres peuvent rejoindre via la page &ldquo;Rejoindre&rdquo;
                            </p>
                        </div>
                    </div>

                    {/* Prochaines étapes */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <Clock className="w-6 h-6 mr-3 text-yellow-400" />
                            Prochaines étapes
                        </h2>

                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    1
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Validation des vidéos</h3>
                                    <p className="text-gray-400">
                                        Nos administrateurs vont vérifier les vidéos de device check de tous les joueurs.
                                        Vous recevrez une notification du résultat.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    2
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Compléter l&apos;équipe</h3>
                                    <p className="text-gray-400">
                                        Si votre équipe n&apos;est pas complète, invitez d&apos;autres joueurs à rejoindre
                                        avec le code d&apos;équipe. Minimum 3 joueurs validés requis.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    3
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Participation au tournoi</h3>
                                    <p className="text-gray-400">
                                        Une fois votre équipe validée, vous recevrez les informations de connexion
                                        pour le tournoi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-12 text-center space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={`/suivi?code=${teamCode}`}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Suivre mon équipe
                        </Link>
                        <Link
                            href="/"
                            className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 border border-gray-700"
                        >
                            Retour à l&apos;accueil
                        </Link>
                    </div>

                    <p className="text-gray-400 text-sm max-w-2xl mx-auto">
                        Gardez précieusement votre code d&apos;équipe ! Vous en aurez besoin pour suivre
                        l&apos;état de votre équipe et pour que d&apos;autres joueurs puissent vous rejoindre.
                    </p>
                </div>

                {/* Informations importantes */}
                <div className="mt-12 bg-yellow-500/10 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-3">⚠️ Informations importantes</h3>
                    <div className="space-y-2 text-gray-300 text-sm">
                        <p>• La validation des vidéos peut prendre jusqu&apos;à 48 heures</p>
                        <p>• Une équipe est considérée comme valide avec au moins 3 joueurs validés</p>
                        <p>• Les équipes incomplètes ont 7 jours pour se compléter après création</p>
                        <p>• En cas de problème, contactez-nous sur nos réseaux sociaux</p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

import { Suspense } from 'react';

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ConfirmationPageContent />
        </Suspense>
    );
}
