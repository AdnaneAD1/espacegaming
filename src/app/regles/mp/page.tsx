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

                {/* Note importante */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 mb-8">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-2xl font-bold text-red-300 mb-2">
                                ⚠️ Règlement strict
                            </h2>
                            <p className="text-gray-300">
                                Le non-respect de ces règles entraînera une <strong className="text-red-400">disqualification immédiate</strong>.
                                <br />
                                Lisez attentivement chaque section avant de participer.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sections de règles */}
                <div className="space-y-6">
                    {/* Section 1 - Modes de jeu */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">1. Modes de jeu et Maps</h2>
                        </div>
                        <div className="text-gray-300 space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">🎮 Recherche et Destruction</h3>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>Tunisia</li>
                                    <li>Stand de tir</li>
                                    <li>Kurohana Metropolis</li>
                                    <li>Standoff</li>
                                    <li>Coastal</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">🎯 Contrôle</h3>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>Raid</li>
                                    <li>Takeoff</li>
                                    <li>Crossfire</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">🗺️ Point Stratégique</h3>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>Summit</li>
                                    <li>Apocalypse</li>
                                    <li>Hacienda</li>
                                    <li>Slums</li>
                                    <li>Combine</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 2 - Paramètres */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">2. Paramètres des matchs</h2>
                        </div>
                        <div className="text-gray-300 space-y-4">
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-2">⚙️ Point Stratégique</h3>
                                <ul className="space-y-1">
                                    <li>• <strong className="text-white">Limite de score :</strong> 250</li>
                                    <li>• <strong className="text-white">Limite de temps :</strong> 600 secondes</li>
                                </ul>
                            </div>
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-2">💣 Recherche et Destruction</h3>
                                <ul className="space-y-1">
                                    <li>• <strong className="text-white">Limite de manches WIN :</strong> 7</li>
                                    <li>• <strong className="text-white">Limite de temps :</strong> 120 secondes</li>
                                </ul>
                            </div>
                            <div className="bg-gray-700/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-2">🎯 Contrôle</h3>
                                <ul className="space-y-1">
                                    <li>• <strong className="text-white">Limite de manches :</strong> 3</li>
                                    <li>• <strong className="text-white">Limite de temps :</strong> 90 secondes</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 3 - Armes interdites */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">3. Armes interdites ❌</h2>
                        </div>
                        <div className="text-gray-300 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                                    <span className="text-red-400 font-semibold">❌ NA-45</span>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                                    <span className="text-red-400 font-semibold">❌ SVD</span>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                                    <span className="text-red-400 font-semibold">❌ XPR</span>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                                    <span className="text-red-400 font-semibold">❌ THUMPER</span>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                                    <span className="text-red-400 font-semibold">❌ D13 SECTOR</span>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                                    <span className="text-red-400 font-semibold">❌ SHORTY</span>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                                    <span className="text-red-400 font-semibold">❌ FHJ-18</span>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                                    <span className="text-red-400 font-semibold">❌ SMRS</span>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                                    <span className="text-red-400 font-semibold">❌ ARGUS</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4 - Utilitaires et tactiques interdits */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">4. Utilitaires mortels et tactiques interdits ❌</h2>
                        </div>
                        <div className="text-gray-300 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-red-400 mb-3">💣 Utilitaires mortels interdits</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Mine</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Thermite</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Cocktail Molotov</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Grenade de contact</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ C4</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Grenade à dispersion</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Capteur cardiaque</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Grenade à gaz</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Drone flash</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Grenade à écho</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Stimulant</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Bombe cryogénique</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Boule d&apos;orage</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Grenade leurre</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Explosif à capteur</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Grenade neutralisante</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 5 - Atouts interdits */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">5. Atouts interdits ❌</h2>
                        </div>
                        <div className="text-gray-300">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Persistance</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Livraison express</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Martyre</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Régénération rapide</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Détermination</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Alerte</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Alerte maximale</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Traqueur</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Reconnaissance</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Soutien aux unités</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Tacticien</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Localisation</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Assassin</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Drone téléguidé</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 6 - Talents d'agent interdits */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">6. Talents d&apos;agent interdits ❌</h2>
                        </div>
                        <div className="text-gray-300">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Bouclier convertible</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ UNITÉ CANINE</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ R.U.C.H.E.</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Lame de l&apos;ombre</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Charge sauvage</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Bouclier balistique</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Armure cinétique</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ TAK-5</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Noyau de réacteur</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Baliste EM3</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Outils de diversion</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Ravage</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Boîte de munitions</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Champ de contrôle</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 7 - Accessoires d'arme interdits */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">7. Accessoires d&apos;arme interdits ❌</h2>
                        </div>
                        <div className="text-gray-300 space-y-2">
                            <p className="text-red-400 font-semibold mb-3">Les accessoires suivants sont interdits :</p>
                            <ul className="space-y-1 ml-4">
                                <li>❌ AKIMBO</li>
                                <li>❌ MUNITION ILLIMITÉE (RPD)</li>
                                <li>❌ CHARGEUR 15 CARTOUCHES (AS VAL)</li>
                                <li>❌ COMMOTION CÉRÉBRALE (DLQ33)</li>
                                <li>❌ MUNITIONS CR AMAX M67</li>
                                <li>❌ MUNITIONS FOUDROYANTES HS-0405</li>
                                <li>❌ LANCEUR CANON M4</li>
                                <li>❌ HADES LE CHERCHEUR DE CŒUR</li>
                                <li>❌ CHARGEUR GROS CALIBRE HVK</li>
                                <li>❌ CHARGEUR DRH OTM</li>
                                <li>❌ TERMITE ET MUNITIONS EXPLOSIVES</li>
                                <li>❌ CX9 ROND À POINTE CREUSE DE 9MM</li>
                                <li>❌ MUNITION SNIPER DE HAUTE PRÉCISION (TYPE 19)</li>
                                <li>❌ BOOSTER DE RECUL BP50</li>
                                <li>❌ LEROY 438 MM BP50</li>
                                <li>❌ BOOSTER DE RECUL MG42</li>
                                <li>❌ CHARGEUR À TAMBOUR 125 CARTOUCHES MG42 6.5</li>
                                <li>❌ CHARGEUR DE 32 CARTOUCHE USS9</li>
                                <li>❌ HANDICAP</li>
                                <li>❌ MUNITIONS 335 MM RAPIDE MG42</li>
                            </ul>
                        </div>
                    </div>

                    {/* Section 8 - Jokers interdits */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">8. Jokers interdits ❌</h2>
                        </div>
                        <div className="text-gray-300 space-y-3">
                            <p className="text-red-400 font-bold text-lg mb-3">🃏 TOUS LES JOKERS SONT INTERDITS</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Avide d&apos;atouts : rouge</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Bombardier</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Surarmement</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Changement tactique</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Soutien aux séries</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 9 - Séries de points interdites */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">9. Séries de points interdites ❌</h2>
                        </div>
                        <div className="text-gray-300">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Drone</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Drone amélioré</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Drone de brouillage</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Colis stratégique</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Tourelle manuelle</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Tourelle SAM</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Hélicoptère furtif</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Choc de VdR</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Hawk X3</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Essaim</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Coup de tonnerre</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Laser Orbital</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Tourelle</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Hélicoptère d&apos;attaque</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Napalm</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Frappe à dispersion</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ MQ-27 Dragonfire</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ XS1 Goliath</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Wheelson</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Gardien</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Flamenaut</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ ADAV</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Avion d&apos;assaut</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ RC-XD</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ S.R.A.</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ Largage aérien d&apos;urgence</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 10 - Restrictions cosmétiques */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">10. Restrictions cosmétiques ❌</h2>
                        </div>
                        <div className="text-gray-300 space-y-3">
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                                <p className="text-red-400 font-semibold mb-2">🚫 LES EMOTES SONT INTERDITS À TOUT MOMENT DU MATCH</p>
                            </div>
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                                <p className="text-red-400 font-semibold mb-2">🚫 LES CAMOUFLAGES LÉGENDAIRES DES ÉQUIPEMENTS MORTEL ET TACTIQUE SONT INTERDITS</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 11 - Personnages interdits */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">11. Personnages interdits ❌</h2>
                        </div>
                        <div className="text-gray-300">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ GORILLE COSMIQUE</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ ZOMBIE - GARDIEN WICHT</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ GRINCH - CROS NOCTURNE</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ GRINCH - GUIRLANDE DE FLEUR</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ GRINCH - CŒUR DE LION</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ GOLEM - MARAIS</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ ROZE - OBSCURITÉ</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ ROZE - TOUR</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ ALICE ANGE DE LA MORT - TRANCHÉE</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ ALICE ANGE DE LA MORT - JENUE FILLE AU VOILE</div>
                                <div className="bg-red-900/20 border border-red-500/30 rounded p-2 text-sm text-center">❌ FLORENCE - TERREUR NOCTURNE</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 12 - Composition d'une équipe */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-blue-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">12. Composition d&apos;une équipe ✅</h2>
                        </div>
                        <div className="text-gray-300 space-y-4">
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-blue-400 mb-2">👥 TALENT D&apos;AGENT</h3>
                                <p>Chaque équipe doit avoir <strong className="text-white">5 talents d&apos;agent différents</strong>.</p>
                                <p className="text-sm mt-1">⚠️ Le même talent ne peut pas être équipé par 2 joueurs d&apos;une même équipe.</p>
                            </div>
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-blue-400 mb-2">🔫 RÔLES DE CLASSE D&apos;ARME</h3>
                                <p className="mb-2">Chaque équipe doit assigner à ses joueurs <strong className="text-white">2 rôles de classe d&apos;arme</strong>.</p>
                                <p className="text-sm mb-2">Ces rôles sont :</p>
                                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                                    <li>Fusil d&apos;assaut</li>
                                    <li>Mitraillette</li>
                                    <li>Lourd (shotgun/mitrailleuse)</li>
                                    <li>Sniper</li>
                                </ul>
                            </div>
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ LIMITATIONS</h3>
                                <ul className="space-y-1 text-sm">
                                    <li>• <strong className="text-white">3 joueurs maximum</strong> peuvent choisir fusil d&apos;assaut</li>
                                    <li>• <strong className="text-white">3 joueurs maximum</strong> peuvent choisir mitraillettes</li>
                                    <li>• <strong className="text-white">2 joueurs maximum</strong> peuvent choisir lourd</li>
                                    <li>• <strong className="text-white">2 joueurs maximum</strong> peuvent choisir sniper</li>
                                </ul>
                            </div>
                            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                                <p className="text-orange-400 text-sm">
                                    📋 <strong>Important :</strong> Chaque capitaine ou chef de clan doit fournir une fiche 30 minutes avant chaque match selon l&apos;exemple ci-dessous.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 13 - Emplacement scrim */}
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-blue-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">13. Emplacement définitif pour vos équipements scrim 📋</h2>
                        </div>
                        <div className="text-gray-300">
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                <p className="text-blue-400 font-semibold">💡 Conseil important :</p>
                                <p className="mt-2">Réservez un emplacement définitif pour vos équipements scrim afin d&apos;éviter toute confusion pendant les matchs.</p>
                                <p className="text-sm mt-2 text-gray-400">Exemple : Emplacement 1 pour Scrim, Emplacement 2 pour les parties publiques, etc.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Note sur la variabilité des règles */}
                <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-xl font-bold text-yellow-300 mb-2">⚠️ Variabilité des règles</h3>
                            <p className="text-gray-300">
                                Les <strong className="text-yellow-400">maps</strong>, les <strong className="text-yellow-400">modes de jeu</strong>, les <strong className="text-yellow-400">paramètres</strong> et certaines <strong className="text-yellow-400">armes</strong> peuvent être différents en fonction du tournoi.
                                <br />
                                <br />
                                Toutes ces informations seront précisées dans la <strong className="text-white">description du tournoi</strong> et une <strong className="text-white">annonce vous parviendra</strong> avant le début de chaque compétition.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Note importante */}
                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
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
