'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Users, Calendar, Clock, Star, Shield, Gamepad2, UserPlus, Award } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { isRegistrationOpen } from '@/lib/utils';
import { TournamentService } from '@/services/tournamentService';
import { GameModeUtils } from '@/types/game-modes';
import { Tournament } from '@/types/tournament-multi';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Team } from '@/types';

export default function Home() {
  const [brTimeLeft, setBrTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mpTimeLeft, setMpTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);
  const [isResultsAvailable, setIsResultsAvailable] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [brTournament, setBrTournament] = useState<Tournament | null>(null);
  const [mpTournament, setMpTournament] = useState<Tournament | null>(null);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [brTeamsCount, setBrTeamsCount] = useState(0);
  const [mpTeamsCount, setMpTeamsCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
    
    // Fonction pour calculer le temps restant pour un tournoi spécifique
    const calculateTimeLeft = (deadline?: Date) => {
      if (!deadline) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      
      const now = new Date();
      const target = new Date(deadline);
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };
    
    // Fonction pour mettre à jour les temps restants
    const updateTimers = () => {
      if (brTournament?.deadline_register) {
        setBrTimeLeft(calculateTimeLeft(brTournament.deadline_register));
      }
      if (mpTournament?.deadline_register) {
        setMpTimeLeft(calculateTimeLeft(mpTournament.deadline_register));
      }
    };

    // Mise à jour initiale
    updateTimers();
    
    // Timer pour mettre à jour toutes les secondes
    const timer = setInterval(updateTimers, 1000);

    return () => clearInterval(timer);
  }, [brTournament, mpTournament]);

  // Charger les tournois BR et MP actifs
  useEffect(() => {
    const loadActiveTournaments = async () => {
      try {
        const [brTournamentData, mpTournamentData] = await Promise.all([
          TournamentService.getActiveBRTournament(),
          TournamentService.getActiveMPTournament()
        ]);
        
        setBrTournament(brTournamentData);
        setMpTournament(mpTournamentData);
        
        const isOpen = await isRegistrationOpen();
        setRegistrationOpen(isOpen);
      } catch (error) {
        console.error('Erreur lors du chargement des tournois:', error);
        setRegistrationOpen(false);
      } finally {
        setTournamentsLoading(false);
      }
    };

    loadActiveTournaments();
    // Vérifier toutes les minutes
    const interval = setInterval(loadActiveTournaments, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compter les équipes inscrites pour BR
  useEffect(() => {
    if (!brTournament?.id) return;

    const unsubscribe = onSnapshot(
      query(collection(db, `tournaments/${brTournament.id}/teams`)),
      (snapshot) => {
        const teams = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Team)
          .filter(team => team.status !== 'rejected');
        setBrTeamsCount(teams.length);
      },
      (error) => {
        console.error('Erreur lors du comptage des équipes BR:', error);
      }
    );

    return () => unsubscribe();
  }, [brTournament]);

  // Compter les équipes inscrites pour MP
  useEffect(() => {
    if (!mpTournament?.id) return;

    const unsubscribe = onSnapshot(
      query(collection(db, `tournaments/${mpTournament.id}/teams`)),
      (snapshot) => {
        const teams = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Team)
          .filter(team => team.status !== 'rejected');
        setMpTeamsCount(teams.length);
      },
      (error) => {
        console.error('Erreur lors du comptage des équipes MP:', error);
      }
    );

    return () => unsubscribe();
  }, [mpTournament]);

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
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Tournois COD Mobile
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Participez aux tournois Battle Royale et Multijoueur et remportez des récompenses !
            </p>
          </div>

          {/* Grille des tournois actifs */}
          {tournamentsLoading ? (
            <div className="text-center text-white text-xl">Chargement des tournois...</div>
          ) : (brTournament || mpTournament) ? (
            <div className={`grid gap-8 ${brTournament && mpTournament ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
              {/* Carte Battle Royale */}
              {brTournament && (
                <TournamentCard 
                  tournament={brTournament}
                  type="br"
                  isClient={isClient}
                  timeLeft={brTimeLeft}
                  registrationOpen={registrationOpen}
                  isResultsAvailable={isResultsAvailable}
                  teamsCount={brTeamsCount}
                />
              )}

              {/* Carte Multijoueur */}
              {mpTournament && (
                <TournamentCard 
                  tournament={mpTournament}
                  type="mp"
                  isClient={isClient}
                  timeLeft={mpTimeLeft}
                  registrationOpen={registrationOpen}
                  isResultsAvailable={isResultsAvailable}
                  teamsCount={mpTeamsCount}
                />
              )}
            </div>
          ) : (
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 border border-gray-700 text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Aucun tournoi actif</h3>
              <p className="text-gray-300 mb-6">
                Aucun tournoi n&apos;est actuellement ouvert aux inscriptions.
                <br />
                Restez connectés pour les prochains tournois !
              </p>
              <Link
                href="/historique"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Clock className="w-5 h-5" />
                Voir l&apos;historique
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Section Comment participer - Affichée seulement si au moins un tournoi actif */}
      {(brTournament || mpTournament) && (
        <section className="py-16 bg-gray-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Ancien code commenté - à supprimer plus tard */}
            {false && isClient && (
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
                        { label: 'Jours', value: brTimeLeft.days },
                        { label: 'Heures', value: brTimeLeft.hours },
                        { label: 'Minutes', value: brTimeLeft.minutes },
                        { label: 'Secondes', value: brTimeLeft.seconds },
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
                      Fin des inscriptions : <span className="text-white font-semibold">31 août 2025 à 23h59</span>
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
            <div className="space-y-6">
              {/* Boutons Inscription */}
              <div>
                <h3 className="text-lg font-semibold text-white text-center mb-3">Créer une équipe</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto px-4">
                  {registrationOpen ? (
                    <>
                      <Link
                        href="/inscription"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">Battle Royale</span>
                      </Link>
                      <Link
                        href="/inscription/mp"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">Multijoueur</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-600 text-gray-300 px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg cursor-not-allowed flex items-center justify-center gap-2">
                        <UserPlus className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">BR (Fermé)</span>
                      </div>
                      <div className="bg-gray-600 text-gray-300 px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg cursor-not-allowed flex items-center justify-center gap-2">
                        <UserPlus className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">MP (Fermé)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Boutons Rejoindre */}
              <div>
                <h3 className="text-lg font-semibold text-white text-center mb-3">Rejoindre une équipe</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto px-4">
                  {registrationOpen ? (
                    <>
                      <Link
                        href="/rejoindre"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                      >
                        <Users className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">Battle Royale</span>
                      </Link>
                      <Link
                        href="/rejoindre-mp"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                      >
                        <Users className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">Multijoueur</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-600 text-gray-300 px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg cursor-not-allowed flex items-center justify-center gap-2">
                        <Users className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">BR (Fermé)</span>
                      </div>
                      <div className="bg-gray-600 text-gray-300 px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg cursor-not-allowed flex items-center justify-center gap-2">
                        <Users className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">MP (Fermé)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Autres boutons */}
              <div>
                <h3 className="text-lg font-semibold text-white text-center mb-3">Équipes inscrites</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto px-4">
                  <Link
                    href="/equipes-validees"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    <Award className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Battle Royale</span>
                  </Link>
                  <Link
                    href="/equipes-validees/mp"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    <Award className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Multijoueur</span>
                  </Link>
                </div>
              </div>

              {/* Boutons Règles */}
              <div>
                <h3 className="text-lg font-semibold text-white text-center mb-3">Règles du tournoi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto px-4">
                  <Link
                    href="/regles"
                    className="bg-gray-800 text-white px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg hover:bg-gray-700 transition-all duration-200 border border-gray-700 flex items-center justify-center gap-2"
                  >
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Battle Royale</span>
                  </Link>
                  <Link
                    href="/regles/mp"
                    className="bg-gray-800 text-white px-4 sm:px-6 py-4 rounded-xl font-semibold text-base lg:text-lg hover:bg-gray-700 transition-all duration-200 border border-gray-700 flex items-center justify-center gap-2"
                  >
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Multijoueur</span>
                  </Link>
                </div>
              </div>
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
        </section>
      )}

      {/* Section Comment participer */}
      <section className="py-16 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Comment participer ?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Deux façons de rejoindre les tournois selon votre situation
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
                  Vous avez déjà des coéquipiers ? Créez votre équipe (BR ou MP) et obtenez un code unique à partager avec vos amis.
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
                    4 joueurs (BR) ou 5 joueurs (MP)
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/inscription"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center"
                  >
                    Battle Royale
                  </Link>
                  <Link
                    href="/inscription/mp"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center"
                  >
                    Multijoueur
                  </Link>
                </div>
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/rejoindre"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center"
                  >
                    Battle Royale
                  </Link>
                  <Link
                    href="/rejoindre-mp"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center"
                  >
                    Multijoueur
                  </Link>
                </div>
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
                  <li>• Une équipe doit avoir minimum 3 joueurs validés (BR) ou 4 joueurs (MP) pour participer</li>
                  <li>• Chaque joueur doit uploader une vidéo de device check</li>
                  <li>• La validation des joueurs se fait manuellement par les administrateurs</li>
                  <li>• Vérifiez les dates d&apos;inscription pour chaque mode de jeu</li>
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
              Découvrez tous les détails de nos tournois Battle Royale et Multijoueur
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Trophy,
                title: "Récompenses",
                description: "Récompenses attractives pour les gagnants de chaque mode de jeu",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: Users,
                title: "Formats",
                description: "Battle Royale Squad (4 joueurs) • Multijoueur (5 joueurs)",
                color: "from-blue-500 to-purple-500"
              },
              {
                icon: Calendar,
                title: "Dates des tournois",
                description: "Consultez les cartes de tournois ci-dessus pour les dates exactes",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Shield,
                title: "Inscriptions",
                description: "Ouvertes selon les périodes de chaque tournoi",
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
                fondée en 2022. Nous organisons régulièrement des tournois Battle Royale et Multijoueur
                pour offrir aux joueurs francophones une plateforme compétitive de qualité.
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
            {/* Partenaire: KB~VODUN */}
            <a
              href="https://www.tiktok.com/@danhomey97"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800/60 aspect-[4/5] min-h-40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/40"
              aria-label="KB~VODUN - Profil TikTok"
            >
              <div
                className="absolute inset-0 bg-no-repeat bg-center bg-contain transition-transform duration-300 group-hover:scale-[1.02]"
                style={{ backgroundImage: "url('/partners/kb-vodun.jpg')" }}
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-white font-semibold drop-shadow">KB~VODUN</div>
                <div className="text-xs text-gray-300">TikTok @danhomey97</div>
              </div>
            </a>

            {/* Autres partenaires (placeholders) */}
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="group relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800/60 aspect-[4/5] min-h-40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10 flex items-center justify-center"
              >
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

// Composant pour afficher une carte de tournoi
interface TournamentCardProps {
  tournament: Tournament;
  type: 'br' | 'mp';
  isClient: boolean;
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  registrationOpen: boolean | null;
  isResultsAvailable: boolean;
  teamsCount: number;
}

function TournamentCard({ tournament, type, isClient, timeLeft, registrationOpen, teamsCount }: TournamentCardProps) {
  const gameModeName = GameModeUtils.getDisplayName(tournament.gameMode);
  const teamSize = GameModeUtils.getTeamSize(tournament.gameMode);
  const isBR = type === 'br';
  const maxTeams = tournament.settings?.maxTeams || 50;
  const placesRestantes = Math.max(0, maxTeams - teamsCount);
  
  // Vérifier si les inscriptions sont ouvertes pour ce tournoi
  const isRegistrationOpenForTournament = registrationOpen && tournament.deadline_register && new Date() < new Date(tournament.deadline_register);

  return (
    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
          {isBR ? <Gamepad2 className="w-8 h-8 text-white" /> : <Trophy className="w-8 h-8 text-white" />}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {isBR ? 'Battle Royale' : 'Multijoueur'}
        </h2>
        <p className="text-blue-300 font-semibold">{gameModeName}</p>
        <p className="text-gray-400 text-sm mt-1">
          {teamSize === 1 ? 'Solo' : `${teamSize} joueurs par équipe`}
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-blue-300 text-sm font-semibold">
            {placesRestantes} place{placesRestantes > 1 ? 's' : ''} restante{placesRestantes > 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          {teamsCount} / {maxTeams} équipes inscrites
        </p>
      </div>

      {/* Compteur ou statut */}
      {isClient && isRegistrationOpenForTournament ? (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 text-center flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-green-400" />
            Inscriptions ouvertes
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'J', value: timeLeft.days },
              { label: 'H', value: timeLeft.hours },
              { label: 'M', value: timeLeft.minutes },
              { label: 'S', value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2 mb-1">
                  <span className="text-xl font-bold text-white">{item.value.toString().padStart(2, '0')}</span>
                </div>
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
          {tournament.deadline_register && (
            <p className="text-center text-gray-400 text-xs mt-3">
              Fin des inscriptions : <span className="text-white font-semibold">
                {new Date(tournament.deadline_register).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })} à {new Date(tournament.deadline_register).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 text-center">
          <p className="text-red-400 font-semibold">Inscriptions fermées</p>
          {tournament.deadline_register && (
            <p className="text-gray-400 text-xs mt-2">
              Clôturées le {new Date(tournament.deadline_register).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })} à {new Date(tournament.deadline_register).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="space-y-3">
        {isRegistrationOpenForTournament ? (
          <>
            <Link
              href={isBR ? '/inscription' : '/inscription/mp'}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              S&apos;inscrire
            </Link>
            {teamSize > 1 && (
              <Link
                href={isBR ? "/rejoindre" : "/rejoindre-mp"}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Rejoindre
              </Link>
            )}
          </>
        ) : (
          <Link
            href={isBR ? '/classement-final' : '/classement-final/mp'}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            Voir le classement
          </Link>
        )}
        <Link
          href={isBR ? '/equipes-validees' : '/equipes-validees/mp'}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Award className="w-5 h-5" />
          Équipes inscrites
        </Link>
      </div>
    </div>
  );
}
