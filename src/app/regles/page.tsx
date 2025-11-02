import { FileText, Trophy, Users, Clock, Shield, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const pointSystem = [
    { placement: "Top 1", points: 25, color: "text-yellow-400" },
    { placement: "Top 2", points: 20, color: "text-gray-300" },
    { placement: "Top 3", points: 17, color: "text-orange-400" },
    { placement: "Top 4", points: 15, color: "text-blue-400" },
    { placement: "Top 5-10", points: 12, color: "text-blue-400" },
    { placement: "Top 11-20", points: 10, color: "text-blue-400" },
    { placement: "Top 21-30", points: 8, color: "text-blue-400" },
    { placement: "Top 31-40", points: 5, color: "text-blue-400" },
    { placement: "Top 41-50", points: 3, color: "text-blue-400" },
];

const killPoints = [
    { kills: "1 kill", points: "10pts par kill" },
];

export default function ReglesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <FileText className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Règles du Tournoi
                        </span>
                        <br />
                        <span className="text-white">Battle Royale</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Lisez attentivement les règles avant de vous inscrire
                    </p>
                </div>

                {/* Note importante */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 mb-8">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
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

                <div className="space-y-8">
                    {/* Informations générales */}
                    <section className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center mb-6">
                            <Trophy className="w-6 h-6 text-yellow-400 mr-3" />
                            <h2 className="text-2xl font-bold text-white">Informations générales</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">🎮 Modes de jeu</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li>• <strong className="text-white">Battle Royale Squad</strong> (4 joueurs par équipe)</li>
                                    <li>• <strong className="text-white">Battle Royale Duo</strong> (2 joueurs par équipe)</li>
                                    <li>• <strong className="text-white">Battle Royale Solo</strong> (1 joueur)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">🗺️ Maps disponibles</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
                                        <span className="text-blue-300 font-semibold">Isolated</span>
                                    </div>
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
                                        <span className="text-blue-300 font-semibold">Blackout</span>
                                    </div>
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
                                        <span className="text-blue-300 font-semibold">Alcatraz</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mt-3">
                                    💡 <strong>Important :</strong> Téléchargez toutes les maps avant d'être dans le salon
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">📋 Composition des équipes</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li>• <strong className="text-white">Squad :</strong> 4 joueurs fixes par équipe</li>
                                    <li>• <strong className="text-white">Duo :</strong> 2 joueurs fixes par équipe</li>
                                    <li>• <strong className="text-white">Solo :</strong> 1 joueur</li>
                                    <li>• Aucun remplacement autorisé après validation</li>
                                    <li>• Compositions verrouillées définitivement</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Règles d'inscription */}
                    <section className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center mb-6">
                            <Users className="w-6 h-6 text-blue-400 mr-3" />
                            <h2 className="text-2xl font-bold text-white">Règles d&apos;inscription</h2>
                        </div>
                        <div className="space-y-4 text-gray-300">
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">Formation des équipes</h3>
                                <ul className="space-y-2">
                                    <li>• Chaque équipe/joueur doit effectuer son inscription</li>
                                    <li>• <strong className="text-yellow-400">Squad :</strong> 4 joueurs fixes obligatoires</li>
                                    <li>• <strong className="text-yellow-400">Duo :</strong> 2 joueurs fixes obligatoires</li>
                                    <li>• <strong className="text-yellow-400">Solo :</strong> 1 joueur</li>
                                    <li>• Si l&apos;équipe est incomplète, un code unique est généré pour permettre à d&apos;autres joueurs de rejoindre</li>
                                    <li>• Si la limite d&apos;équipes validées est atteinte avant la fin des inscriptions, les inscriptions seront encore possibles si des équipes sont rejetées</li>
                                </ul>
                                <div className="mt-4 p-3 bg-red-900/30 rounded-lg border border-red-600">
                                    <p className="text-red-300 text-sm">
                                        <strong>⚠️ IMPORTANT :</strong> Aucun remplacement ne sera autorisé une fois les équipes validées. Les compositions seront verrouillées définitivement.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">Validation des joueurs</h3>
                                <ul className="space-y-2">
                                    <li>• Chaque joueur doit fournir une vidéo de device check</li>
                                    <li>• La vidéo doit montrer clairement l&apos;écran de jeu et les paramètres</li>
                                    <li>• Validation manuelle par les administrateurs</li>
                                    <li>• <strong className="text-white">Squad :</strong> Une équipe est validée si au moins 3 joueurs sont validés</li>
                                    <li>• <strong className="text-white">Duo :</strong> Une équipe est validée si les 2 joueurs sont validés</li>
                                    <li>• <strong className="text-white">Solo :</strong> Le joueur doit être validé</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Système de codes d'équipe */}
                    <section className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-lg rounded-2xl p-8 border border-blue-600">
                        <div className="flex items-center mb-6">
                            <Users className="w-6 h-6 text-blue-400 mr-3" />
                            <h2 className="text-2xl font-bold text-white">Rejoindre une équipe avec un code</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-4">Comment ça fonctionne ?</h3>
                                <ol className="space-y-3 text-gray-300">
                                    <li className="flex items-start">
                                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                                        <div>
                                            <strong>Création d&apos;équipe incomplète</strong>
                                            <p className="text-sm text-gray-400">Un capitaine crée une équipe avec moins de 4 joueurs</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                                        <div>
                                            <strong>Génération automatique du code</strong>
                                            <p className="text-sm text-gray-400">Un code unique de 6 caractères est automatiquement généré</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                                        <div>
                                            <strong>Partage du code</strong>
                                            <p className="text-sm text-gray-400">Le capitaine partage ce code avec les joueurs qu&apos;il souhaite recruter</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                                        <div>
                                            <strong>Rejoindre l&apos;équipe</strong>
                                            <p className="text-sm text-gray-400">Les joueurs utilisent le code pour rejoindre automatiquement l&apos;équipe</p>
                                        </div>
                                    </li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-4">Règles importantes</h3>
                                <div className="space-y-4">
                                    <div className="bg-green-900/30 rounded-lg p-4 border border-green-600">
                                        <h4 className="text-green-400 font-semibold mb-2">✅ Ce qui est autorisé</h4>
                                        <ul className="space-y-1 text-green-100 text-sm">
                                            <li>• Rejoindre une équipe avec 1-3 joueurs</li>
                                            <li>• Utiliser le code autant de fois que nécessaire</li>
                                            <li>• Compléter l&apos;équipe jusqu&apos;à 4 joueurs maximum</li>
                                        </ul>
                                    </div>

                                    <div className="bg-red-900/30 rounded-lg p-4 border border-red-600">
                                        <h4 className="text-red-400 font-semibold mb-2">❌ Ce qui est interdit</h4>
                                        <ul className="space-y-1 text-red-100 text-sm">
                                            <li>• Rejoindre une équipe déjà complète (4/4)</li>
                                            <li>• Rejoindre une équipe après le délai d&apos;inscription</li>
                                            <li>• Modifier l&apos;équipe après validation</li>
                                        </ul>
                                    </div>

                                    <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-600">
                                        <h4 className="text-yellow-400 font-semibold mb-2">🕒 Délais à respecter</h4>
                                        <ul className="space-y-1 text-yellow-100 text-sm">
                                            <li>• Compléter l&apos;équipe avant la fin des inscriptions</li>
                                            <li>• Upload vidéo obligatoire lors de la jointure</li>
                                            <li>• Validation admin requise pour tous les joueurs</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-600">
                            <p className="text-blue-300 text-center">
                                <strong>💡 Astuce :</strong> Vous pouvez accéder à la page &ldquo;Rejoindre une équipe&rdquo; depuis le menu principal pour saisir un code d&apos;équipe.
                            </p>
                        </div>
                    </section>

                    {/* Système de points */}
                    <section className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center mb-6">
                            <Shield className="w-6 h-6 text-green-400 mr-3" />
                            <h2 className="text-2xl font-bold text-white">Système de points</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Points de placement */}
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-4">Points de placement</h3>
                                <div className="space-y-2">
                                    {pointSystem.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                            <span className={`font-medium ${item.color}`}>{item.placement}</span>
                                            <span className="text-white font-bold">{item.points} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Points de kills */}
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-4">Points de kills</h3>
                                <div className="space-y-2">
                                    {killPoints.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                            <span className="text-gray-300">{item.kills}</span>
                                            <span className="text-green-400 font-bold">{item.points}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-4 bg-blue-900/30 rounded-lg border border-blue-700">
                                    <p className="text-blue-300 text-sm">
                                        <strong>Exemple :</strong> 3ème place (17 pts) + 8 kills (10 pts x 8) = 97 points total
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Règles de jeu */}
                    <section className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center mb-6">
                            <Clock className="w-6 h-6 text-purple-400 mr-3" />
                            <h2 className="text-2xl font-bold text-white">Règles de jeu</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">Paramètres autorisés</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li>• Configuration graphique et sensibilité libres</li>
                                    <li>• HUD personnalisé autorisé</li>
                                    <li>• Tous les appareils compatibles</li>
                                    <li>• <strong>Maps :</strong> Isolated, Blackout et Alcatraz (à télécharger avant d'être dans le salon)</li>
                                    <li>• <strong>Classes autorisées :</strong> Medic (Médecin), Pumped (Gonfle à bloc), Ninja, Rewind (Retour en arrière). Une 5ᵉ classe est laissée pour l'échange interne d'équipe mais n'est <strong>pas autorisée</strong> en jeu.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">Déroulement</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li>• Connexion obligatoire 25 minutes avant le début</li>
                                    <li>• Briefing des règles et consignes techniques</li>
                                    <li>• Mise en place des rooms et équipes</li>
                                    <li>• Contrôle préalable des participants</li>
                                    <li>• Lancement du tournoi à l'heure prévue</li>
                                    <li>• Nombre de parties selon le tournoi</li>
                                    <li>• Screenshot ou vidéo de fin de partie recommandé pour toute contestation</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Interdictions */}
                    <section className="bg-red-900/20 backdrop-blur-lg rounded-2xl p-8 border border-red-700">
                        <div className="flex items-center mb-6">
                            <AlertTriangle className="w-6 h-6 text-red-400 mr-3" />
                            <h2 className="text-2xl font-bold text-white">Interdictions strictes</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-red-400 mb-3">Tricherie</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li>• Hack/Cheat de toute forme</li>
                                    <li>• Modification du jeu</li>
                                    <li>• Utilisation de bots</li>
                                    <li>• Exploitation de bugs ou glitchs (camoufler son hitbox, traverser les murs, etc.)</li>
                                    <li>• Utilisation des <strong>armes interdites</strong> : Machine de guerre, Thumper, Purificateur, Annihilateur, shotguns à cadence auto/semi-auto (JAK-12, Echo…), DLQ munitions Oméga et toute arme à munitions explosives/thermites, armes à effets glitchés/effets buggués (selon MAJ)</li>
                                    <li>• <strong>Classes</strong> interdites hormis celles autorisées ci-dessus (Medic, Pumped, Ninja, Rewind)</li>
                                    <li>• Utilisation des <strong>véhicules interdits</strong> : Tank, Jackal, Overbike</li>
                                    <li>• Team-up (alliance entre équipes)</li>
                                    <li>• Stream-sniping (même en différé)</li>
                                    <li>• Utilisation des munitions Oméga/thermite sur DLQ, Rytec AMR et autres armes pouvant en équiper</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-red-400 mb-3">Comportement</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li>• Toxicité ou harcèlement</li>
                                    <li>• Insultes ou propos discriminatoires</li>
                                    <li>• Spam ou publicité</li>
                                    <li>• Non-respect des administrateurs</li>
                                    <li>• Non-respect des règles spécifiques du tournoi Battle Royale CoD Mobile</li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-red-900/30 rounded-lg border border-red-600">
                            <p className="text-red-300 font-semibold">
                                ⚠️ Toute violation de ces règles entraînera une disqualification immédiate et définitive
                            </p>
                        </div>
                    </section>

                    {/* Note sur la variabilité des règles */}
                    <section className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
                            <div>
                                <h2 className="text-2xl font-bold text-yellow-300 mb-4">⚠️ Variabilité des règles</h2>
                                <p className="text-gray-300 mb-4">
                                    Le <strong className="text-yellow-400">nombre de parties</strong> et les <strong className="text-yellow-400">maps</strong> peuvent être différents en fonction du tournoi.
                                </p>
                                <p className="text-gray-300">
                                    Toutes ces informations seront précisées dans la <strong className="text-white">description du tournoi</strong> et une <strong className="text-white">annonce vous parviendra</strong> avant le début de chaque compétition.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-lg rounded-2xl p-8 border border-blue-700">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">Questions ?</h2>
                            <p className="text-gray-300 mb-6">
                                Pour toute question concernant les règles, contactez-nous sur nos réseaux sociaux
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
                                    Discord officiel
                                </a>
                                <a href="#" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
                                    WhatsApp Admin
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <Footer />
        </div>
    );
}
