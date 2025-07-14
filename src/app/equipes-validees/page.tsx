'use client'

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Team } from '@/types'
import {
    Users,
    Crown,
    CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function ValidatedTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([])
    const [totalTeams, setTotalTeams] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onSnapshot(
            query(collection(db, 'teams'), orderBy('createdAt', 'desc')),
            (snapshot) => {
                const teamsData = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }) as Team)
                    .filter(team => team.status === "validated" || team.status === "incomplete" || team.status === "complete");

                // Mettre à jour le nombre total d'équipes
                setTotalTeams(teamsData.length)

                // Filtrer les équipes validées côté client
                const validatedTeams = teamsData.filter(team => team.status === 'validated')
                setTeams(validatedTeams)
                setLoading(false)
            },
            (error) => {
                console.error('Erreur lors du chargement des équipes:', error)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center min-h-[60vh]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-white text-lg">Chargement des équipes...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-blue-300 hover:text-blue-200 mb-4 transition-colors"
                    >
                        ← Retour à l&apos;accueil
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Équipes Inscrites
                    </h1>
                    <p className="text-xl text-blue-200 mb-2">
                        {teams.length} équipe{teams.length > 1 ? 's' : ''} qualifiée{teams.length > 1 ? 's' : ''} pour le tournoi
                    </p>

                    {/* Statistiques d'inscription */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                        <div className="flex items-center text-green-400">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span>Toutes les équipes affichées sont officiellement validées</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg border border-blue-500/30">
                                <span className="text-sm">Total inscrites:</span>
                                <span className="font-bold ml-1">{totalTeams}/50</span>
                            </div>

                            {totalTeams < 50 && (
                                <div className="bg-orange-500/20 text-orange-300 px-4 py-2 rounded-lg border border-orange-500/30">
                                    <span className="text-sm">Places restantes:</span>
                                    <span className="font-bold ml-1">{50 - totalTeams}</span>
                                </div>
                            )}

                            {totalTeams >= 50 && (
                                <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg border border-red-500/30">
                                    <span className="text-sm font-bold">COMPLET</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {teams.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="h-24 w-24 text-gray-400 mx-auto mb-6" />
                        <h3 className="text-2xl font-semibold text-white mb-4">Aucune équipe validée</h3>
                        <p className="text-gray-300 text-lg">
                            Les équipes validées apparaîtront ici une fois la validation administrative terminée.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team, index) => (
                            <div
                                key={team.id}
                                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300"
                            >
                                {/* Header de l'équipe */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{team.name}</h3>
                                            <p className="text-blue-200 text-sm">Code: {team.code}</p>
                                        </div>
                                    </div>
                                    <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-semibold">
                                        VALIDÉE
                                    </div>
                                </div>

                                {/* Capitaine */}
                                <div className="mb-4">
                                    <div className="flex items-center mb-2">
                                        <Crown className="h-4 w-4 text-yellow-400 mr-2" />
                                        <span className="text-yellow-400 font-semibold">Capitaine</span>
                                    </div>
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                        <p className="text-white font-medium">{team.captain.pseudo}</p>
                                        <p className="text-yellow-200 text-sm">
                                            {team.captain.country}
                                        </p>
                                    </div>
                                </div>

                                {/* Joueurs */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 text-blue-400 mr-2" />
                                            <span className="text-blue-400 font-semibold">Équipe</span>
                                        </div>
                                        <span className="text-white text-sm">{team.players.length}/4</span>
                                    </div>
                                    <div className="space-y-2">
                                        {team.players.slice(0, 3).map((player) => (
                                            <div key={player.id} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white text-sm">{player.pseudo}</span>
                                                    <span className="text-blue-200 text-xs">{player.country}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {team.players.length > 3 && (
                                            <div className="text-center text-blue-300 text-sm">
                                                +{team.players.length - 3} joueur{team.players.length - 3 > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-center pt-4 border-t border-white/10">
                                    <div className="text-green-400 text-sm flex items-center">
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        {team.players.filter(p => p.status === 'validated').length} validés
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
