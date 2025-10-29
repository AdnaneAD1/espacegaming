'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tournament } from '@/types/tournament-multi';
import { TournamentService } from '@/services/tournamentService';
import { GameMode, GameModeUtils, GAME_MODES_CONFIG } from '@/types/game-modes';
import { Trophy, Plus, Calendar, Users, Target, Settings, Play, Trash2, CheckCircle, Loader2, Gamepad2 } from 'lucide-react';

interface TournamentManagementProps {
  onManageTournament?: (tournamentId: string) => void
}

export default function TournamentManagement({ onManageTournament }: TournamentManagementProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    gameMode: GameMode.BR_SQUAD,
    startDate: '',
    endDate: '',
    deadline_register: '',
    date_result: '',
    maxTeams: 50,
    // Configuration personnalisée
    customFormat: {
      bestOf: undefined as 3 | 5 | undefined,
      tournamentFormat: 'elimination_direct' as 'elimination_direct' | 'groups_then_elimination' | 'groups_only',
      groupStage: {
        enabled: false,
        teamsPerGroup: 4,
        qualifiersPerGroup: 2 as 1 | 2,
        roundRobinInGroup: true
      }
    }
  });

  // Obtenir la date/heure actuelle au format datetime-local
  const getCurrentDateTime = () => {
    const now = new Date();
    // Ajuster pour le fuseau horaire local
    const offset = now.getTimezoneOffset();
    const localTime = new Date(now.getTime() - (offset * 60 * 1000));
    return localTime.toISOString().slice(0, 16);
  };

  const minDateTime = getCurrentDateTime();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const tournamentsQuery = query(
        collection(db, 'tournaments'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tournamentsQuery);
      const tournamentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tournament[];
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Erreur lors du chargement des tournois:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournament.name.trim()) return;

    setCreating(true);
    try {
      // Préparer les dates
      const startDate = newTournament.startDate ? new Date(newTournament.startDate) : new Date();
      const endDate = newTournament.endDate ? new Date(newTournament.endDate) : undefined;
      const deadline_register = newTournament.deadline_register ? new Date(newTournament.deadline_register) : undefined;
      const date_result = newTournament.date_result ? new Date(newTournament.date_result) : undefined;
      
      // Préparer customFormat en nettoyant les valeurs undefined
      const customFormat = GameModeUtils.isMultiplayerMode(newTournament.gameMode)
        ? {
            ...(newTournament.customFormat.bestOf && { bestOf: newTournament.customFormat.bestOf }),
            tournamentFormat: newTournament.customFormat.tournamentFormat,
            groupStage: newTournament.customFormat.groupStage
          }
        : undefined;

      const tournamentId = await TournamentService.createTournament(
        newTournament.name,
        newTournament.description,
        newTournament.gameMode,
        { 
          startDate, 
          endDate, 
          deadline_register, 
          date_result,
          maxTeams: newTournament.maxTeams,
          // Configuration personnalisée uniquement pour les modes multijoueur
          ...(customFormat && { customFormat })
        }
      );
      
      console.log('Nouveau tournoi créé:', tournamentId);
      
      // Réinitialiser le formulaire
      setNewTournament({ 
        name: '', 
        description: '', 
        gameMode: GameMode.BR_SQUAD, 
        startDate: '', 
        endDate: '', 
        deadline_register: '', 
        date_result: '',
        maxTeams: 50,
        customFormat: {
          bestOf: undefined,
          tournamentFormat: 'elimination_direct',
          groupStage: {
            enabled: false,
            teamsPerGroup: 4,
            qualifiersPerGroup: 2,
            roundRobinInGroup: true
          }
        }
      });
      setShowCreateForm(false);
      
      // Recharger la liste
      await fetchTournaments();
      
      alert('Tournoi créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création du tournoi');
    } finally {
      setCreating(false);
    }
  };

  const handleActivateTournament = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir activer le tournoi "${tournamentName}" ?\n\nCela désactivera automatiquement tous les autres tournois actifs.`)) {
      return;
    }

    setActivatingId(tournamentId);
    try {
      await TournamentService.activateTournament(tournamentId);
      await fetchTournaments();
      alert('Tournoi activé avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'activation:', error);
      alert('Erreur lors de l\'activation du tournoi');
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le tournoi "${tournamentName}" ?\n\nCette action est irréversible et supprimera toutes les données associées (équipes, résultats, etc.).`)) {
      return;
    }

    setDeletingId(tournamentId);
    try {
      await TournamentService.deleteTournament(tournamentId);
      await fetchTournaments();
      alert('Tournoi supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCompleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir terminer le tournoi "${tournamentName}" ?\n\nCette action marquera le tournoi comme terminé et il ne pourra plus être modifié.`)) {
      return;
    }

    try {
      await TournamentService.completeTournament(tournamentId);
      await fetchTournaments();
      alert('Tournoi terminé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la completion:', error);
      alert(`Erreur lors de la completion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Brouillon', color: 'bg-gray-500' },
      active: { label: 'Actif', color: 'bg-green-500' },
      completed: { label: 'Terminé', color: 'bg-blue-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs text-white ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date: Date | { toDate: () => Date } | string | number | null | undefined) => {
    if (!date) return 'Date inconnue';
    
    let dateObj: Date;
    if (typeof date === 'object' && date !== null && 'toDate' in date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date as string | number);
    }
    
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Chargement des tournois...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Tournois</h2>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau Tournoi
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-lg p-8">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 ml-3 truncate">Créer un nouveau tournoi</h3>
          </div>
          
          <form onSubmit={handleCreateTournament} className="space-y-6">
            {/* Informations générales */}
            <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informations générales
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom du tournoi *
                  </label>
                  <input
                    type="text"
                    value={newTournament.name}
                    onChange={(e) => setNewTournament(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Ex: Tournoi CODM Février 2025"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newTournament.description}
                    onChange={(e) => setNewTournament(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    rows={4}
                    placeholder="Décrivez les règles, les récompenses et les modalités du tournoi..."
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Mode de jeu */}
            <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-purple-500" />
                Mode de jeu
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Sélectionnez le mode de jeu *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.values(GameMode).map((mode) => {
                      const config = GAME_MODES_CONFIG[mode];
                      const isSelected = newTournament.gameMode === mode;
                      
                      return (
                        <div
                          key={mode}
                          onClick={() => setNewTournament(prev => ({ ...prev, gameMode: mode }))}
                          className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-50 shadow-md' 
                              : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className={`font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>
                              {config.displayName}
                            </h5>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              config.category === 'battle_royale' 
                                ? 'bg-orange-100 text-orange-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {config.category === 'battle_royale' ? 'BR' : 'MJ'}
                            </span>
                          </div>
                          <p className={`text-sm ${isSelected ? 'text-purple-600' : 'text-gray-600'} mb-2`}>
                            {config.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>👥 {config.teamSize} joueur{config.teamSize > 1 ? 's' : ''}</span>
                            {GameModeUtils.isBestOfMode(mode) && (
                              <span>🎯 BO{GameModeUtils.getBestOf(mode)}</span>
                            )}
                            {GameModeUtils.hasGroupStage(mode) && (
                              <span>📊 Groupes</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Informations sur le mode sélectionné */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h6 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-600" />
                    Configuration du mode {GAME_MODES_CONFIG[newTournament.gameMode].displayName}
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Taille d&apos;équipe:</strong> {GAME_MODES_CONFIG[newTournament.gameMode].teamSize} joueur(s)
                    </div>
                    <div>
                      <strong>Format:</strong> {
                        GAME_MODES_CONFIG[newTournament.gameMode].settings.tournamentFormat === 'groups_then_elimination' 
                          ? 'Groupes puis élimination'
                          : GAME_MODES_CONFIG[newTournament.gameMode].settings.tournamentFormat === 'round_robin'
                          ? 'Round Robin'
                          : 'Élimination directe'
                      }
                    </div>
                    {GameModeUtils.isBestOfMode(newTournament.gameMode) && (
                      <div>
                        <strong>Matches:</strong> Best of {GameModeUtils.getBestOf(newTournament.gameMode)}
                      </div>
                    )}
                    {GameModeUtils.hasGroupStage(newTournament.gameMode) && (
                      <div>
                        <strong>Qualifiés par groupe:</strong> {GameModeUtils.getQualifiersPerGroup(newTournament.gameMode)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Configuration personnalisée - Uniquement pour les modes multijoueur */}
            {GameModeUtils.isMultiplayerMode(newTournament.gameMode) && (
              <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-500" />
                  Configuration personnalisée
                </h4>
              
              <div className="space-y-6">
                {/* Format du tournoi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Format du tournoi *
                  </label>
                  <div className="space-y-3">
                    {GameModeUtils.getAvailableFormats(newTournament.gameMode).map((format) => (
                      <label key={format.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="tournamentFormat"
                          value={format.value}
                          checked={newTournament.customFormat.tournamentFormat === format.value}
                          onChange={(e) => setNewTournament(prev => ({
                            ...prev,
                            customFormat: {
                              ...prev.customFormat,
                              tournamentFormat: e.target.value as 'elimination_direct' | 'groups_then_elimination' | 'groups_only',
                              groupStage: {
                                ...prev.customFormat.groupStage,
                                enabled: e.target.value !== 'elimination_direct'
                              }
                            }
                          }))}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{format.label}</div>
                          <div className="text-sm text-gray-600">{format.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Configuration Best Of pour les modes multijoueur */}
                {GameModeUtils.isMultiplayerMode(newTournament.gameMode) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Format des matches
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {GameModeUtils.getAvailableBestOf(newTournament.gameMode).map((option) => (
                        <label key={option.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="bestOf"
                            value={option.value}
                            checked={newTournament.customFormat.bestOf === option.value}
                            onChange={(e) => setNewTournament(prev => ({
                              ...prev,
                              customFormat: {
                                ...prev.customFormat,
                                bestOf: parseInt(e.target.value) as 3 | 5
                              }
                            }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-900">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Configuration des phases de groupes */}
                {newTournament.customFormat.tournamentFormat !== 'elimination_direct' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Configuration des phases de groupes
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          Équipes par groupe
                        </label>
                        <select
                          value={newTournament.customFormat.groupStage.teamsPerGroup}
                          onChange={(e) => setNewTournament(prev => ({
                            ...prev,
                            customFormat: {
                              ...prev.customFormat,
                              groupStage: {
                                ...prev.customFormat.groupStage,
                                teamsPerGroup: parseInt(e.target.value)
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value={3}>3 équipes par groupe</option>
                          <option value={4}>4 équipes par groupe</option>
                          <option value={5}>5 équipes par groupe</option>
                          <option value={6}>6 équipes par groupe</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          Qualifiés par groupe
                        </label>
                        <select
                          value={newTournament.customFormat.groupStage.qualifiersPerGroup}
                          onChange={(e) => setNewTournament(prev => ({
                            ...prev,
                            customFormat: {
                              ...prev.customFormat,
                              groupStage: {
                                ...prev.customFormat.groupStage,
                                qualifiersPerGroup: parseInt(e.target.value) as 1 | 2
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value={1}>1 qualifié par groupe</option>
                          <option value={2}>2 qualifiés par groupe</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newTournament.customFormat.groupStage.roundRobinInGroup}
                          onChange={(e) => setNewTournament(prev => ({
                            ...prev,
                            customFormat: {
                              ...prev.customFormat,
                              groupStage: {
                                ...prev.customFormat.groupStage,
                                roundRobinInGroup: e.target.checked
                              }
                            }
                          }))}
                          className="text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="text-sm text-blue-800">
                          Round Robin dans les groupes (chaque équipe joue contre toutes les autres)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
            
            {/* Dates et horaires */}
            <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Dates et horaires
              </h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date de début *
                    </label>
                    <input
                      type="datetime-local"
                      value={newTournament.startDate}
                      onChange={(e) => setNewTournament(prev => ({ ...prev, startDate: e.target.value }))}
                      min={minDateTime}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date de fin *
                    </label>
                    <input
                      type="datetime-local"
                      value={newTournament.endDate}
                      onChange={(e) => setNewTournament(prev => ({ ...prev, endDate: e.target.value }))}
                      min={newTournament.startDate || minDateTime}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date limite d&apos;inscription *
                  </label>
                  <input
                    type="datetime-local"
                    value={newTournament.deadline_register}
                    onChange={(e) => setNewTournament(prev => ({ ...prev, deadline_register: e.target.value }))}
                    min={minDateTime}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-2 flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Après cette date, les nouvelles inscriptions seront refusées automatiquement
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date d&apos;affichage des résultats *
                  </label>
                  <input
                    type="datetime-local"
                    value={newTournament.date_result}
                    onChange={(e) => setNewTournament(prev => ({ ...prev, date_result: e.target.value }))}
                    min={minDateTime}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-2 flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Le lien vers le classement final apparaîtra sur la page d&apos;accueil à partir de cette date
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre maximum d&apos;équipes *
                  </label>
                  <input
                    type="number"
                    value={newTournament.maxTeams}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setNewTournament(prev => ({ ...prev, maxTeams: 0 }));
                      } else {
                        const num = parseInt(value);
                        if (!isNaN(num) && num >= 1 && num <= 100) {
                          setNewTournament(prev => ({ ...prev, maxTeams: num }));
                        }
                      }
                    }}
                    min={1}
                    max={100}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-2 flex items-start gap-2">
                    <svg className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Limite le nombre d&apos;équipes pouvant s&apos;inscrire à ce tournoi (entre 1 et 100)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg"
                >
                  {creating ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Créer le tournoi
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="w-full sm:w-auto bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Annuler
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mt-4 text-center">
                <span className="text-red-500">*</span> Tous les champs sont obligatoires pour créer un tournoi complet
              </p>
            </div>
          </form>
        </div>
      )}

      {/* Liste des tournois - Version responsive */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            Tournois existants ({tournaments.length})
          </h3>
        </div>
        
        {tournaments.length === 0 ? (
          <div className="p-4 sm:p-6 text-center text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm sm:text-base">Aucun tournoi trouvé. Créez votre premier tournoi !</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                {/* Version Desktop */}
                <div className="hidden lg:flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {tournament.name}
                      </h4>
                      {getStatusBadge(tournament.status)}
                    </div>
                    
                    {tournament.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{tournament.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Créé le {formatDate(tournament.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Gamepad2 className="w-4 h-4" />
                        <span>{tournament.gameMode ? GAME_MODES_CONFIG[tournament.gameMode]?.displayName : 'BR Squad'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{tournament.stats?.totalTeams || 0} équipes</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{tournament.stats?.totalGames || 0} parties</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (onManageTournament) {
                          onManageTournament(tournament.id);
                        } else {
                          alert(`Gestion du tournoi: ${tournament.name}\nID: ${tournament.id}\n\nCette fonctionnalité sera bientôt disponible !`);
                        }
                      }}
                      className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Gérer
                    </button>
                    
                    {/* Bouton d'activation pour les tournois en brouillon */}
                    {tournament.status === 'draft' && (
                      <button
                        onClick={() => handleActivateTournament(tournament.id, tournament.name)}
                        className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Activer
                      </button>
                    )}
                    
                    {/* Bouton pour terminer un tournoi actif */}
                    {tournament.status === 'active' && (
                      <button
                        onClick={() => handleCompleteTournament(tournament.id, tournament.name)}
                        className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-lg hover:bg-orange-200 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Terminer
                      </button>
                    )}
                    
                    {/* Bouton de suppression pour les tournois en brouillon uniquement */}
                    {tournament.status === 'draft' && (
                      <button
                        onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                        className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    )}
                    
                    {/* Bouton d'historique pour les tournois terminés */}
                    {tournament.status === 'completed' && (
                      <button
                        onClick={() => window.open(`/historique/${tournament.id}`, '_blank')}
                        className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        <Trophy className="w-4 h-4" />
                        Voir l&apos;historique
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Version Mobile/Tablet - Carte moderne */}
                <div className="lg:hidden">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    {/* En-tête de la carte */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800 truncate mb-1">
                          {tournament.name}
                        </h4>
                        <div className="mb-2">
                          {getStatusBadge(tournament.status)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {tournament.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tournament.description}</p>
                    )}
                    
                    {/* Statistiques - Version mobile compacte */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white rounded-lg p-2 text-center">
                        <Gamepad2 className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-700 font-medium truncate">
                          {tournament.gameMode ? GAME_MODES_CONFIG[tournament.gameMode]?.displayName : 'BR Squad'}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-2 text-center">
                        <Calendar className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500 truncate">{formatDate(tournament.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-white rounded-lg p-2 text-center">
                        <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-700 font-medium">{tournament.stats?.totalTeams || 0}</p>
                        <p className="text-xs text-gray-500">équipes</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-2 text-center">
                        <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-700 font-medium">{tournament.stats?.totalGames || 0}</p>
                        <p className="text-xs text-gray-500">parties</p>
                      </div>
                    </div>
                    
                    {/* Actions - Version mobile */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          if (onManageTournament) {
                            onManageTournament(tournament.id);
                          } else {
                            alert(`Gestion du tournoi: ${tournament.name}\nID: ${tournament.id}\n\nCette fonctionnalité sera bientôt disponible !`);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        <Settings className="w-4 h-4" />
                        Gérer
                      </button>
                      
                      {/* Bouton d'activation pour les tournois en brouillon */}
                      {tournament.status === 'draft' && (
                        <button
                          onClick={() => handleActivateTournament(tournament.id, tournament.name)}
                          disabled={activatingId === tournament.id}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                            activatingId === tournament.id
                              ? 'bg-green-200 text-green-600 cursor-not-allowed'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {activatingId === tournament.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">
                            {activatingId === tournament.id ? 'Activation...' : 'Activer'}
                          </span>
                        </button>
                      )}
                      
                      {/* Bouton pour terminer un tournoi actif */}
                      {tournament.status === 'active' && (
                        <button
                          onClick={() => handleCompleteTournament(tournament.id, tournament.name)}
                          className="flex items-center justify-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Terminer</span>
                        </button>
                      )}
                      
                      {/* Bouton de suppression pour les tournois en brouillon uniquement */}
                      {tournament.status === 'draft' && (
                        <button
                          onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                          disabled={deletingId === tournament.id}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                            deletingId === tournament.id
                              ? 'bg-red-200 text-red-600 cursor-not-allowed'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {deletingId === tournament.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">
                            {deletingId === tournament.id ? 'Suppression...' : 'Supprimer'}
                          </span>
                        </button>
                      )}
                      
                      {/* Bouton d'historique pour les tournois terminés */}
                      {tournament.status === 'completed' && (
                        <button
                          onClick={() => window.open(`/historique/${tournament.id}`, '_blank')}
                          className="flex items-center justify-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                        >
                          <Trophy className="w-4 h-4" />
                          <span className="hidden sm:inline">Historique</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
