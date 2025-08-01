'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tournament } from '@/types/tournament-multi';
import { Trophy, Calendar, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function HistoriquePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedTournaments = async () => {
      try {
        const q = query(
          collection(db, 'tournaments'),
          where('status', '==', 'completed'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const tournamentsData = querySnapshot.docs.map(doc => ({
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

    fetchCompletedTournaments();
  }, []);

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
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement de l&apos;historique...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Historique des Tournois
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Découvrez tous les tournois passés et consultez leurs classements
          </p>
        </div>

        {/* Liste des tournois */}
        {tournaments.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">
              Aucun tournoi terminé
            </h3>
            <p className="text-gray-400">
              Les tournois terminés apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:gap-8">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                      <h2 className="text-2xl md:text-3xl font-bold text-white">
                        {tournament.name}
                      </h2>
                    </div>
                    
                    {tournament.description && (
                      <p className="text-gray-300 mb-4 text-lg">
                        {tournament.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm md:text-base">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(tournament.startDate)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4" />
                        <span>Équipes participantes</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/historique/${tournament.id}`}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                    >
                      <span>Voir le classement</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-white/20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
