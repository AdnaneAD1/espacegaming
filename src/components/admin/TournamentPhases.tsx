'use client';

import { useState, useEffect } from 'react';
import { Tournament, TournamentPhase, TournamentGroup, EliminationMatch, TournamentTeam } from '@/types/tournament-multi';
import { GameModeUtils, GAME_MODES_CONFIG } from '@/types/game-modes';
import { TournamentPhasesService } from '@/services/tournamentPhasesService';
import { 
  Users, 
  Trophy, 
  Clock, 
  Target, 
  Shuffle,
  Crown,
  Swords,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TournamentPhasesProps {
  tournament: Tournament;
  teams: TournamentTeam[];
  onBack?: () => void;
}

export default function TournamentPhases({ tournament, teams, onBack }: TournamentPhasesProps) {
  const [phases, setPhases] = useState<TournamentPhase[]>([]);
  const [groups, setGroups] = useState<TournamentGroup[]>([]);
  const [matches, setMatches] = useState<EliminationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'groups' | 'bracket'>('overview');

  // Charger les données des phases
  useEffect(() => {
    loadTournamentPhases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament.id]);

  const loadTournamentPhases = async () => {
    try {
      const [phasesData, groupsData, matchesData] = await Promise.all([
        TournamentPhasesService.getTournamentPhases(tournament.id),
        TournamentPhasesService.getTournamentGroups(tournament.id),
        TournamentPhasesService.getEliminationMatches(tournament.id)
      ]);
      
      setPhases(phasesData);
      setGroups(groupsData);
      setMatches(matchesData);
    } catch (error) {
      console.error('Erreur lors du chargement des phases:', error);
      toast.error('Erreur lors du chargement des phases');
    }
  };

  // Générer les phases de groupes
  const handleGenerateGroupStage = async () => {
    if (!GameModeUtils.hasGroupStage(tournament.gameMode)) {
      toast.error('Ce mode de jeu ne supporte pas les phases de groupes');
      return;
    }

    setLoading(true);
    try {
      await TournamentPhasesService.generateGroupStage(
        tournament.id,
        tournament.gameMode,
        teams.filter(t => t.status === 'validated')
      );
      
      toast.success('Phases de groupes générées avec succès !');
      await loadTournamentPhases();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération des phases de groupes');
    } finally {
      setLoading(false);
    }
  };

  // Générer le bracket d'élimination
  const handleGenerateEliminationBracket = async () => {
    setLoading(true);
    try {
      // Si il y a des phases de groupes, récupérer les qualifiés
      let qualifiedTeams = teams.filter(t => t.status === 'validated');
      
      if (phases.some(p => p.phaseType === 'group_stage')) {
        qualifiedTeams = await TournamentPhasesService.finalizeGroupStage(tournament.id);
      }
      
      await TournamentPhasesService.generateEliminationBracket(
        tournament.id,
        tournament.gameMode,
        qualifiedTeams
      );
      
      toast.success('Bracket d\'élimination généré avec succès !');
      await loadTournamentPhases();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération du bracket');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">En attente</span>;
      case 'active':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">En cours</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Terminé</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Informations du tournoi */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-900">{tournament.name}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">Mode de jeu</span>
            </div>
            <p className="text-purple-700">{GAME_MODES_CONFIG[tournament.gameMode]?.displayName}</p>
            {GameModeUtils.isBestOfMode(tournament.gameMode) && (
              <p className="text-sm text-purple-600">BO{GameModeUtils.getBestOf(tournament.gameMode)}</p>
            )}
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Équipes inscrites</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{teams.filter(t => t.status === 'validated').length}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Statut</span>
            </div>
            <p className="text-green-700 capitalize">{tournament.status}</p>
          </div>
        </div>
      </div>

      {/* Phases du tournoi */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Phases du tournoi</h3>
        
        {phases.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shuffle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">Aucune phase générée pour ce tournoi</p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {GameModeUtils.hasGroupStage(tournament.gameMode) && (
                <button
                  onClick={handleGenerateGroupStage}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Générer les phases de groupes
                </button>
              )}
              
              <button
                onClick={handleGenerateEliminationBracket}
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Swords className="w-5 h-5" />
                Générer le bracket d&apos;élimination
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase) => (
              <div key={phase.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    phase.phaseType === 'group_stage' ? 'bg-purple-100' : 'bg-red-100'
                  }`}>
                    {phase.phaseType === 'group_stage' ? (
                      <Users className={`w-5 h-5 ${phase.phaseType === 'group_stage' ? 'text-purple-600' : 'text-red-600'}`} />
                    ) : (
                      <Swords className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {phase.phaseType === 'group_stage' ? 'Phase de groupes' : 'Phase d\'élimination'}
                    </h4>
                    <p className="text-sm text-gray-600">Phase {phase.phaseNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getPhaseStatusBadge(phase.status)}
                  <button
                    onClick={() => setActiveTab(phase.phaseType === 'group_stage' ? 'groups' : 'bracket')}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Voir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Phases de groupes</h3>
        {groups.length === 0 && GameModeUtils.hasGroupStage(tournament.gameMode) && (
          <button
            onClick={handleGenerateGroupStage}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Générer les groupes
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun groupe généré</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-purple-50 px-6 py-4 border-b border-gray-200">
                <h4 className="font-bold text-purple-900">{group.groupName}</h4>
                <p className="text-sm text-purple-700">{group.teams.length} équipes</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {group.teams
                    .sort((a, b) => a.position - b.position)
                    .map((team, index) => (
                    <div key={team.teamId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          team.qualified ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {team.position || index + 1}
                        </span>
                        <span className="font-medium">{team.teamName}</span>
                        {team.qualified && <Crown className="w-4 h-4 text-yellow-500" />}
                      </div>
                      
                      <div className="text-right text-sm">
                        <p className="font-semibold">{team.points} pts</p>
                        <p className="text-gray-600">{team.wins}V - {team.losses}D</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBracket = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Bracket d&apos;élimination</h3>
        {matches.length === 0 && (
          <button
            onClick={handleGenerateEliminationBracket}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Générer le bracket
          </button>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <Swords className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun bracket généré</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Organiser les matches par tour */}
          {Array.from(new Set(matches.map(m => m.round))).sort().map(round => (
            <div key={round} className="mb-8">
              <h4 className="text-lg font-bold text-gray-900 mb-4">
                {round === 1 ? 'Premier tour' : 
                 round === 2 ? 'Quarts de finale' :
                 round === 3 ? 'Demi-finales' :
                 round === 4 ? 'Finale' : `Tour ${round}`}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches
                  .filter(m => m.round === round)
                  .sort((a, b) => a.matchNumber - b.matchNumber)
                  .map((match) => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Match {match.matchNumber}</span>
                      {getPhaseStatusBadge(match.status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className={`flex items-center justify-between p-2 rounded ${
                        match.winnerId === match.team1Id ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}>
                        <span className="font-medium">{match.team1Name || 'TBD'}</span>
                        {match.winnerId === match.team1Id && <Crown className="w-4 h-4 text-yellow-500" />}
                      </div>
                      
                      <div className="text-center text-gray-400">
                        <span className="text-xs">VS</span>
                      </div>
                      
                      <div className={`flex items-center justify-between p-2 rounded ${
                        match.winnerId === match.team2Id ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}>
                        <span className="font-medium">{match.team2Name || 'TBD'}</span>
                        {match.winnerId === match.team2Id && <Crown className="w-4 h-4 text-yellow-500" />}
                      </div>
                    </div>
                    
                    {match.status === 'pending' && match.team1Id && match.team2Id && (
                      <button className="w-full mt-3 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">
                        Saisir le résultat
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des phases</h2>
          <p className="text-gray-600">Organisez les phases de groupes et les brackets d&apos;élimination</p>
        </div>
        
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Retour
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'groups', 'bracket'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' ? 'Vue d\'ensemble' : 
               tab === 'groups' ? 'Phases de groupes' : 
               'Bracket d\'élimination'}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'groups' && renderGroups()}
      {activeTab === 'bracket' && renderBracket()}
    </div>
  );
}
