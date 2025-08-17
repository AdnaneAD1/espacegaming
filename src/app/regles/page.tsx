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
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                        Règles du tournoi
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Lisez attentivement les règles avant de vous inscrire au tournoi Battle Royale Squad
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Annonce officielle */}
                    <section className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 backdrop-blur-lg rounded-2xl p-8 border-2 border-yellow-500">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">🎮 Annonce Officielle du Tournoi 🎮</h2>
                            <p className="text-yellow-200 text-lg">
                                Notre tournoi officiel de Call of Duty: Mobile se tiendra le
                                <strong className="text-yellow-400"> samedi 06 septembre 2025 à 22h (Heure du Bénin)</strong>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-600">
                                <h3 className="text-lg font-bold text-yellow-400 mb-3">🛠 Composition des équipes</h3>
                                <ul className="space-y-2 text-yellow-100 text-sm">
                                    <li>• <strong>4 joueurs fixes par équipe</strong></li>
                                    <li>• Aucun remplacement autorisé</li>
                                    <li>• Compositions verrouillées après validation</li>
                                    <li>• Aucune modification possible</li>
                                </ul>
                            </div>

                            <div className="bg-orange-900/30 rounded-lg p-4 border border-orange-600">
                                <h3 className="text-lg font-bold text-orange-400 mb-3">⏰ Horaires cruciaux</h3>
                                <ul className="space-y-2 text-orange-100 text-sm">
                                    <li>• <strong>21h35</strong> : Connexion obligatoire</li>
                                    <li>• <strong>22h00</strong> : Début du tournoi</li>
                                    <li>• Briefing et contrôle préalable</li>
                                    <li>• Mise en place des rooms</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-gradient-to-r from-red-900/40 to-pink-900/40 rounded-lg border border-red-500">
                            <p className="text-center text-red-200 font-semibold">
                                ⚠️ <strong>ATTENTION :</strong> Tous les participants doivent être en ligne 25 minutes avant le lancement pour participer !
                            </p>
                        </div>
                    </section>
                    {/* Informations générales */}
                    <section className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center mb-6">
                            <Trophy className="w-6 h-6 text-yellow-400 mr-3" />
                            <h2 className="text-2xl font-bold text-white">Informations générales</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">Format du tournoi</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li>• Mode : Battle Royale Squad</li>
                                    <li>• 4 joueurs par équipe maximum</li>
                                    <li>• 25 équipes maximum</li>
                                    <li>• Cartes : Isolated et Blackout</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">Récompenses</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li>• 1ère place : <span className="text-yellow-400 font-bold">60.000 F</span></li>
                                    <li>• 2ème place : <span className="text-yellow-400 font-bold">20.000 F</span></li>
                                    <li>• 3ème place : <span className="text-yellow-400 font-bold">10.000 F</span></li>
                                    <li>• Top killer : <span className="text-yellow-400 font-bold">10.000 F</span></li>
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
                                    <li>• Chaque équipe doit avoir un capitaine qui effectue l&apos;inscription</li>
                                    <li>• <strong className="text-yellow-400">Équipes de 4 joueurs fixes obligatoires</strong></li>
                                    <li>• Si l&apos;équipe est incomplète, un code unique est généré pour permettre à d&apos;autres joueurs de rejoindre</li>
                                    <li>• Si la limite des 25 équipes validées sont atteintes avant la fin des inscriptions, les inscriptions seront encore possible si des équipes sont rejetées</li>
                                    {/* <li>• Les équipes incomplètes ont 7 jours pour se compléter après création</li> */}
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
                                    <li>• Une équipe est validée si au moins 3 joueurs sont validés</li>
                                    <li>• Si une équipe a au moins 3 joueurs rejetés, elle est automatiquement rejetée</li>
                                    <li>• Si une équipe a moins de 3 joueurs validés, elle est automatiquement rejetée</li>
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
                                            <li>• <strong>31 août 2025 à 23h59</strong> pour compléter une équipe</li>
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
                                    <li>• <strong>Maps jouées : Isolated et Blackout</strong> (à télécharger avant d’être dans le salon)</li>
                                    <li>• <strong>Classes autorisées :</strong> Medic (Médecin), Pumped (Gonfle à bloc), Ninja, Rewind (Retour en arrière). Une 5ᵉ classe est laissée pour l’échange interne d’équipe mais n’est <strong>pas autorisée</strong> en jeu.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">Déroulement</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li>• <strong>21h35</strong> : Connexion obligatoire des participants</li>
                                    <li>• Briefing des règles et consignes techniques</li>
                                    <li>• Mise en place des rooms et équipes</li>
                                    <li>• Contrôle préalable des participants</li>
                                    <li>• <strong>22h00</strong> : Lancement du tournoi</li>
                                    <li>• 3 manches seront jouées</li>
                                    <li>• Screenshot ou vidéo de fin de partie recommandé pour toute contestation</li>
                                </ul>
                                <div className="mt-3 p-3 bg-blue-900/30 rounded-lg border border-blue-600">
                                    <p className="text-blue-300 text-sm">
                                        <strong>📢 Info :</strong> Les brackets, modes de jeu détaillés et récompenses seront annoncés prochainement.
                                    </p>
                                </div>
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

                    {/* Dates importantes */}
                    <section className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <div className="flex items-center mb-6">
                            <Clock className="w-6 h-6 text-yellow-400 mr-3" />
                            <h2 className="text-2xl font-bold text-white">Dates importantes</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-400 mb-2">31 août</div>
                                <div className="text-gray-300">Fin des inscriptions</div>
                            </div>
                            <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                                <div className="text-2xl font-bold text-green-400 mb-2">31 août</div>
                                <div className="text-gray-300">Validation des équipes</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg border-2 border-yellow-400">
                                <div className="text-2xl font-bold text-white mb-2">06 septembre</div>
                                <div className="text-yellow-100 font-semibold">TOURNOI PRINCIPAL</div>
                                <div className="text-yellow-200 text-sm mt-1">22h00</div>
                            </div>
                        </div>

                        {/* Détails de l'événement */}
                        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-600">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <Clock className="w-5 h-5 text-yellow-400 mr-2" />
                                Détails de l&apos;événement - 06 septembre 2025
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-lg font-semibold text-blue-400 mb-3">Horaires</h4>
                                    <ul className="space-y-2 text-gray-300">
                                        <li>• <strong className="text-yellow-400">21h35</strong> : Connexion recommandée</li>
                                        <li>• <strong className="text-orange-400">22h00</strong> : Début du tournoi</li>
                                        <li>• <strong className="text-red-400">25 minutes avant</strong> : Obligatoire en ligne</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-blue-400 mb-3">Programme pré-tournoi</h4>
                                    <ul className="space-y-2 text-gray-300">
                                        <li>• Briefing des règles et consignes</li>
                                        <li>• Mise en place des rooms</li>
                                        <li>• Contrôle préalable des participants</li>
                                        <li>• Vérification des équipes</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-yellow-900/30 rounded-lg border border-yellow-600">
                                <p className="text-yellow-300 text-sm">
                                    <strong>⚠️ Important :</strong> Tous les participants doivent être en ligne au plus tard à 21h35 pour participer au tournoi.
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
