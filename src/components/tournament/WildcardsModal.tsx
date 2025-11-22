'use client';

import { useState, useEffect } from 'react';
import { X, Flame, Zap, TrendingUp, Users } from 'lucide-react';
import { PlayInTeamStats } from '@/types/tournament-multi';
import { PlayInService } from '@/services/playInService';

interface WildcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

export default function WildcardsModal({ isOpen, onClose, tournamentId }: WildcardsModalProps) {
  const [wildcards, setWildcards] = useState<PlayInTeamStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWildcards();
    }
  }, [isOpen, tournamentId]);

  const loadWildcards = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les stats du play-in
      const stats = await PlayInService.calculatePlayInStats(tournamentId);
      
      if (stats.length === 0) {
        setError('Aucune donnée de play-in trouvée');
        setWildcards([]);
        return;
      }

      // Calculer la structure
      const structure = PlayInService.calculatePlayInStructure(stats.length);
      
      if (!structure.enabled) {
        setError('Pas de play-in pour ce tournoi');
        setWildcards([]);
        return;
      }

      // Sélectionner les qualifiés et wildcards
      await PlayInService.selectQualifiersAndWildcards(
        tournamentId,
        stats,
        structure
      );

      // Afficher TOUS les perdants (Bloc A + Bloc B)
      // Récupérer les perdants du Bloc A
      const nonQualifiersFromBlocA = await PlayInService.getNonQualifiersFromBlocA(tournamentId, stats);
      
      // Récupérer les non-qualifiés du Bloc B
      const blocBStats = stats.filter(s => s.blocType === 'B').sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.roundDifference !== a.roundDifference) return b.roundDifference - a.roundDifference;
        return b.points - a.points;
      });
      const nonQualifiersFromBlocB = blocBStats.slice(structure.qualifiersFromBlocB);
      
      // Combiner tous les perdants
      const allLosers = [...nonQualifiersFromBlocA, ...nonQualifiersFromBlocB];
      
      // Trier par kills/wins/roundDiff pour afficher le classement
      const sortedLosers = allLosers.sort((a, b) => {
        const aKills = a.totalKills || 0;
        const bKills = b.totalKills || 0;
        if (bKills !== aKills) return bKills - aKills;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.roundDifference !== a.roundDifference) return b.roundDifference - a.roundDifference;
        return 0;
      });

      setWildcards(sortedLosers);
    } catch (err) {
      console.error('Erreur lors du chargement des wildcards:', err);
      setError('Erreur lors du chargement des wildcards');
      setWildcards([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-500" />
              Classement des Perdants (Wildcards)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Tous les perdants du Bloc A et Bloc B
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des perdants...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : wildcards.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
              Aucun perdant trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {wildcards.map((wildcard, index) => (
                <div
                  key={wildcard.teamId}
                  className={`border-2 rounded-lg p-4 transition-colors ${
                    wildcard.qualified
                      ? 'border-green-400 bg-green-50 hover:bg-green-100'
                      : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm text-white ${
                        wildcard.qualified
                          ? 'bg-green-500'
                          : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-gray-900">
                            {wildcard.teamName}
                          </h3>
                          {wildcard.qualified && (
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              ✓ Qualifié
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {wildcard.blocType === 'A' ? 'Perdant Bloc A' : 'Non-qualifié Bloc B'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        wildcard.qualified
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}>
                        {wildcard.totalKills || 0}
                      </div>
                      <div className="text-xs text-gray-500">Kills</div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {/* Wins */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600">VICTOIRES</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {wildcard.wins}
                      </div>
                    </div>

                    {/* Round Difference */}
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-600">DIFF</span>
                      </div>
                      <div className={`text-2xl font-bold ${
                        wildcard.roundDifference >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {wildcard.roundDifference >= 0 ? '+' : ''}{wildcard.roundDifference}
                      </div>
                    </div>

                    {/* Losses */}
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-semibold text-red-600">DÉFAITES</span>
                      </div>
                      <div className="text-2xl font-bold text-red-900">
                        {wildcard.losses}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  <div className="mt-3 pt-3 border-t border-orange-100 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Rounds gagnés:</span>
                      <span className="font-semibold">{wildcard.roundsWon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rounds perdus:</span>
                      <span className="font-semibold">{wildcard.roundsLost}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 lg:p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
