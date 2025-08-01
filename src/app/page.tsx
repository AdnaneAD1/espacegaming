'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Users, Calendar, Clock, Star, Shield, Gamepad2, UserPlus, Award } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getTimeUntilRegistrationEnd, isRegistrationOpen } from '@/lib/utils';
import { TournamentService } from '@/services/tournamentService';

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);
  const [isResultsAvailable, setIsResultsAvailable] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Fonction pour mettre à jour le temps restant
    const updateTimeLeft = async () => {
      try {
        const time = await getTimeUntilRegistrationEnd();
        setTimeLeft(time);
      } catch (error) {
        console.error('Erreur lors du calcul du temps restant:', error);
      }
    };

    // Mise à jour initiale
    updateTimeLeft();
    
    // Timer pour mettre à jour toutes les secondes
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // Vérifier l'ouverture des inscriptions
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const isOpen = await isRegistrationOpen();
        setRegistrationOpen(isOpen);
      } catch (error) {
        console.error('Erreur lors de la vérification des inscriptions:', error);
        setRegistrationOpen(false);
      }
    };

    checkRegistrationStatus();
    // Vérifier toutes les minutes
    const interval = setInterval(checkRegistrationStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Vérifier si les résultats sont disponibles
  useEffect(() => {
    const checkResultsAvailability = async () => {
      try {
        const activeTournament = await TournamentService.getActiveTournament();
        const revealDate = process.env.NEXT_PUBLIC_RESULTS_REVEAL_DATE;
        if (!activeTournament || !activeTournament.date_result || !revealDate) {
          setIsResultsAvailable(false);
          return;
        }

        const now = new Date();
        const targetDate = new Date(activeTournament.date_result) || new Date(revealDate);
        setIsResultsAvailable(now >= targetDate);
      } catch (error) {
        console.error('Erreur lors de la vérification des résultats:', error);
        setIsResultsAvailable(false);
      }
    };

    checkResultsAvailability();
    const interval = setInterval(checkResultsAvailability, 60000); // Vérifier toutes les minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Navbar />

      {/* Section Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Tournoi COD Mobile
              </span>
              <br />
              <span className="text-white">Battle Royale Squad</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Rejoignez le tournoi officiel organisé par <strong>Espace Gaming CODM</strong>
              <br />
              Récompense de <span className="text-yellow-400 font-bold">4000 CP</span> par joueur gagnant !
            </p>

            {/* Compteur ou Résultats */}
            {isClient && (
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 mb-8 max-w-2xl mx-auto border border-gray-700">
                {isResultsAvailable ? (
                  /* Résultats disponibles */
                  <>
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center justify-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                      Résultats du Tournoi Disponibles !
                    </h3>
                    <p className="text-center text-gray-300 mb-6">
                      Le tournoi est terminé ! Découvrez le classement final et félicitez les gagnants.
                    </p>
                    <div className="text-center">
                      <Link
                        href="/classement-final"
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <Trophy className="w-6 h-6" />
                        Voir le Classement Final
                        <Award className="w-5 h-5" />
                      </Link>
                    </div>
                  </>
                ) : registrationOpen ? (
                  /* Inscriptions ouvertes */
                  <>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 text-green-400" />
                      Inscriptions ouvertes encore :
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: 'Jours', value: timeLeft.days },
                        { label: 'Heures', value: timeLeft.hours },
                        { label: 'Minutes', value: timeLeft.minutes },
                        { label: 'Secondes', value: timeLeft.seconds },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3 mb-2">
                            <span className="text-2xl font-bold text-white">{item.value.toString().padStart(2, '0')}</span>
                          </div>
                          <span className="text-sm text-gray-400">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-gray-400 text-sm mt-4">
                      Fin des inscriptions : <span className="text-white font-semibold">24 juillet 2025 à 23h59</span>
                    </p>
                  </>
                ) : (
                  /* Inscriptions fermées */
                  <>
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5" />
                      Inscriptions fermées
                    </h3>
                    <p className="text-center text-gray-400 mb-6">
                      Les inscriptions pour ce tournoi sont maintenant fermées.
                      <br />
                      <span className="text-white font-semibold">Le tournoi sera diffusé en direct sur :</span>
                    </p>
                    
                    {/* Comptes TikTok */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      <div className="text-center">
                        <h4 className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
                          <Users className="w-5 h-5 text-pink-400" />
                          Mister A YT
                        </h4>
                        <div className="flex justify-center">
                          <blockquote 
                            className="tiktok-embed" 
                            cite="https://www.tiktok.com/@misteraytcodm" 
                            data-unique-id="misteraytcodm" 
                            data-embed-type="creator" 
                            style={{maxWidth: '300px', minWidth: '288px'}}
                          >
                            <section>
                              <a 
                                target="_blank" 
                                href="https://www.tiktok.com/@misteraytcodm?refer=creator_embed"
                                className="text-pink-400 hover:text-pink-300 transition-colors"
                              >
                                @misteraytcodm
                              </a>
                            </section>
                          </blockquote>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <h4 className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
                          <Users className="w-5 h-5 text-pink-400" />
                          Adoooooo
                        </h4>
                        <div className="flex justify-center">
                          <blockquote 
                            className="tiktok-embed" 
                            cite="https://www.tiktok.com/@goatcoincoin" 
                            data-unique-id="goatcoincoin" 
                            data-embed-type="creator" 
                            style={{maxWidth: '300px', minWidth: '288px'}}
                          >
                            <section>
                              <a 
                                target="_blank" 
                                href="https://www.tiktok.com/@goatcoincoin?refer=creator_embed"
                                className="text-pink-400 hover:text-pink-300 transition-colors"
                              >
                                @goatcoincoin
                              </a>
                            </section>
                          </blockquote>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-center text-gray-400 text-sm mt-6">
                      <span className="text-white">Suivez-nous pour les prochains tournois !</span>
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Boutons d'action responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto px-4">
              {registrationOpen ? (
                <>
                  <Link
                    href="/inscription"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 lg:px-8 py-4 rounded-xl font-semibold text-base lg:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Créer une équipe</span>
                  </Link>
                  <Link
                    href="/rejoindre"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 lg:px-8 py-4 rounded-xl font-semibold text-base lg:text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    <Users className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Rejoindre équipe</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="bg-gray-600 text-gray-300 px-4 sm:px-6 lg:px-8 py-4 rounded-xl font-semibold text-base lg:text-lg cursor-not-allowed flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Créer équipe (Fermé)</span>
                  </div>
                  <div className="bg-gray-600 text-gray-300 px-4 sm:px-6 lg:px-8 py-4 rounded-xl font-semibold text-base lg:text-lg cursor-not-allowed flex items-center justify-center gap-2">
                    <Users className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Rejoindre (Fermé)</span>
                  </div>
                </>
              )}
              <Link
                href="/equipes-validees"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 lg:px-8 py-4 rounded-xl font-semibold text-base lg:text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Award className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Équipes inscrites</span>
              </Link>
              <Link
                href="/regles"
                className="bg-gray-800 text-white px-4 sm:px-6 lg:px-8 py-4 rounded-xl font-semibold text-base lg:text-lg hover:bg-gray-700 transition-all duration-200 border border-gray-700 flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Voir les règles</span>
              </Link>
            </div>
            
            {/* Bouton de suivi séparé pour éviter le débordement */}
            <div className="flex justify-center mt-4">
              <Link
                href="/suivi"
                className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 lg:px-8 py-4 rounded-xl font-semibold text-base lg:text-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 max-w-xs"
              >
                <Trophy className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Suivre une équipe</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section Comment participer */}
      <section className="py-16 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Comment participer ?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Deux façons de rejoindre le tournoi selon votre situation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Créer une équipe */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 hover:border-blue-500 transition-all duration-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Créer une équipe</h3>
                <p className="text-gray-400 mb-6">
                  Vous avez déjà des coéquipiers ? Créez votre équipe et obtenez un code unique à partager avec vos amis.
                </p>
                <ul className="text-left text-gray-300 mb-8 space-y-2">
                  <li className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-2" />
                    Vous devenez le capitaine de l&apos;équipe
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-2" />
                    Recevez un code à 6 caractères unique
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-2" />
                    Vos coéquipiers peuvent vous rejoindre facilement
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-2" />
                    Maximum 4 joueurs par équipe
                  </li>
                </ul>
                <Link
                  href="/inscription"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block text-center"
                >
                  Créer mon équipe
                </Link>
              </div>
            </div>

            {/* Rejoindre une équipe */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 hover:border-green-500 transition-all duration-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Rejoindre une équipe</h3>
                <p className="text-gray-400 mb-6">
                  Un ami vous a donné un code d&apos;équipe ? Rejoignez son équipe en quelques clics.
                </p>
                <ul className="text-left text-gray-300 mb-8 space-y-2">
                  <li className="flex items-center">
                    <Star className="w-4 h-4 text-green-400 mr-2" />
                    Entrez le code reçu de votre capitaine
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 text-green-400 mr-2" />
                    Vérification automatique de l&apos;équipe
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 text-green-400 mr-2" />
                    Inscription rapide et simple
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 text-green-400 mr-2" />
                    Validation par les administrateurs
                  </li>
                </ul>
                <Link
                  href="/rejoindre"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block text-center"
                >
                  Rejoindre une équipe
                </Link>
              </div>
            </div>
          </div>

          {/* Note importante */}
          <div className="mt-12 bg-yellow-500/10 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-black font-bold text-sm">!</span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">Important à savoir</h4>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• Une équipe doit avoir minimum 3 joueurs validés pour participer</li>
                  <li>• Chaque joueur doit uploader une vidéo de device check</li>
                  <li>• La validation des joueurs se fait manuellement par les administrateurs</li>
                  <li>• Les inscriptions ferment le <strong>24 juillet 2025</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Informations du tournoi */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Informations du tournoi
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Découvrez tous les détails de notre tournoi Battle Royale Squad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Trophy,
                title: "Récompense",
                description: "4000 CP par joueur gagnant",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: Users,
                title: "Format",
                description: "Battle Royale Squad (4 joueurs fixes)",
                color: "from-blue-500 to-purple-500"
              },
              {
                icon: Calendar,
                title: "Date du tournoi",
                description: "26 juillet 2025 - 22h",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Shield,
                title: "Inscription",
                description: "Jusqu'au 24 juillet 2025",
                color: "from-red-500 to-pink-500"
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200">
                  <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section À propos de la communauté */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                À propos d&apos;<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Espace Gaming CODM</span>
              </h2>
              <p className="text-gray-400 text-lg mb-6">
                Espace Gaming CODM est une communauté passionnée de Call of Duty Mobile,
                fondée en 2023. Nous organisons régulièrement des tournois pour offrir
                aux joueurs francophones une plateforme compétitive de qualité.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">200+</div>
                  <div className="text-gray-400">Membres actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">15+</div>
                  <div className="text-gray-400">Tournois organisés</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-gray-700">
              <Gamepad2 className="w-16 h-16 text-blue-400 mb-6 mx-auto" />
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                Rejoignez notre communauté
              </h3>
              <p className="text-gray-400 text-center mb-6">
                Participez à nos événements, échangez avec d&apos;autres joueurs et améliorez votre niveau !
              </p>
              <div className="flex justify-center space-x-4">
                <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  Discord
                </a>
                <a href="#" className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Partenaires */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Nos partenaires
            </h2>
            <p className="text-gray-400 text-lg">
              Merci à nos partenaires qui rendent ce tournoi possible
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Placeholders pour les logos des partenaires */}
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-gray-800/60 backdrop-blur-lg rounded-xl p-6 border border-gray-700 flex items-center justify-center h-24">
                <span className="text-gray-500">Logo partenaire {item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
