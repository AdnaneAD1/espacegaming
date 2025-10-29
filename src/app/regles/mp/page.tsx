'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText, Shield, Users, Trophy, AlertCircle } from 'lucide-react';

export default function ReglesMP() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                            <FileText className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Règles du Tournoi
                        </span>
                        <br />
                        <span className="text-white">Multijoueur</span>
                    </h1>
                    <p className="text-xl text-gray-300">
                        Lisez attentivement les règles avant de vous inscrire
                    </p>
                </div>

                {/* Placeholder - À remplacer avec les vraies règles */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 mb-8">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-2xl font-bold text-yellow-300 mb-2">
                                Règles en cours de rédaction
                            </h2>
                            <p className="text-gray-300">
                                Les règles spécifiques au mode Multijoueur seront ajoutées prochainement.
                                <br />
                                Revenez plus tard pour consulter le règlement complet.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sections de règles - Template */}
                <div className="space-y-6">
                    {/* Section 1 */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">1. Composition des équipes</h2>
                        </div>
                        <div className="text-gray-300 space-y-3">
                            <p>
                                <strong className="text-white">À définir :</strong> Règles concernant la composition des équipes en mode Multijoueur.
                            </p>
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">2. Format du tournoi</h2>
                        </div>
                        <div className="text-gray-300 space-y-3">
                            <p>
                                <strong className="text-white">À définir :</strong> Format du tournoi (phase de groupes, élimination directe, etc.).
                            </p>
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">3. Règles de jeu</h2>
                        </div>
                        <div className="text-gray-300 space-y-3">
                            <p>
                                <strong className="text-white">À définir :</strong> Règles spécifiques au mode Multijoueur.
                            </p>
                        </div>
                    </div>

                    {/* Section 4 */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">4. Sanctions et fair-play</h2>
                        </div>
                        <div className="text-gray-300 space-y-3">
                            <p>
                                <strong className="text-white">À définir :</strong> Règles concernant le fair-play et les sanctions.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Note importante */}
                <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                    <p className="text-blue-300 text-center">
                        <strong>Note :</strong> En vous inscrivant au tournoi, vous acceptez de respecter l&apos;ensemble de ces règles.
                        <br />
                        Tout manquement pourra entraîner une disqualification.
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
}
