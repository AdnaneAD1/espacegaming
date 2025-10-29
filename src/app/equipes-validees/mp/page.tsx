'use client'

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Team } from '@/types'
import { TournamentService } from '@/services/tournamentService'
import { GameModeUtils } from '@/types/game-modes'
import {
    Users,
    Crown,
    CheckCircle,
    Trophy,
    Gamepad2
} from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ValidatedTeamsMPPage() {
    const [teams, setTeams] = useState<Team[]>([])
    const [totalTeams, setTotalTeams] = useState(0)
    const [loading, setLoading] = useState(true)
    const [tournamentName, setTournamentName] = useState<string>('')
    const [gameModeName, setGameModeName] = useState<string>('Multijoueur 5v5')
    const [teamSize, setTeamSize] = useState<number>(5)
    const [maxTeams, setMaxTeams] = useState<number>(50)

    useEffect(() => {
        let unsubscribe: (() => void) | null = null

        const setupSubscription = async () => {
            try {
                // Récupérer le tournoi MP actif
                const activeTournament = await TournamentService.getActiveMPTournament()
                if (!activeTournament) {
                    console.error('Aucun tournoi MP actif trouvé')
                    setLoading(false)
                    return
                }

                setTournamentName(activeTournament.name)
                setMaxTeams(activeTournament.settings?.maxTeams || 50)
                
                const modeName = GameModeUtils.getDisplayName(activeTournament.gameMode)
                const size = GameModeUtils.getTeamSize(activeTournament.gameMode)
                setGameModeName(modeName)
                setTeamSize(size)

                // S'abonner aux équipes du tournoi actif
                unsubscribe = onSnapshot(
                    query(
                        collection(db, `tournaments/${activeTournament.id}/teams`),
                        orderBy('createdAt', 'desc')
                    ),
                    (snapshot) => {
                        const teamsData = snapshot.docs
                            .map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }) as Team)
                            .filter(team => team.status === "validated" || team.status === "incomplete" || team.status === "complete")

                        // Mettre à jour le nombre total d'équipes
                        setTotalTeams(teamsData.length)

                        // Filtrer les équipes validées côté client
                        const validatedTeams = teamsData.filter(team => team.status === 'validated')
                        setTeams(validatedTeams)
                        setLoading(false)
                    },
                    (error) => {
                        console.error('Erreur lors de la récupération des équipes:', error)
                        setLoading(false)
                    }
                )
            } catch (error) {
                console.error('Erreur lors de la configuration:', error)
                setLoading(false)
            }
        }

        setupSubscription()

        return () => {
            if (unsubscribe) {
                unsubscribe()
            }
        }
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            Équipes Validées
                        </span>
                        <br />
                        <span className="text-white">{gameModeName}</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        {tournamentName || 'Tournoi Multijoueur'}
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-500/30 rounded-full px-6 py-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-300 font-semibold">
                                {teams.length} équipe{teams.length > 1 ? 's' : ''} validée{teams.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-6 py-2">
                            <Trophy className="w-5 h-5 text-blue-400" />
                            <span className="text-blue-300 font-semibold">
                                {totalTeams} / {maxTeams} inscrites
                            </span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-white text-xl">Chargement des équipes...</div>
                ) : teams.length === 0 ? (
                    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 border border-gray-700 text-center">
                        <Gamepad2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-4">Aucune équipe validée</h2>
                        <p className="text-gray-300 mb-6">
                            Soyez parmi les premiers à vous inscrire au tournoi {gameModeName} !
                        </p>
                        <Link
                            href="/inscription/mp"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            S&apos;inscrire maintenant
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team, index) => (
                            <div
                                key={team.id}
                                className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-green-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10"
                            >
                                {/* Header de la carte */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{team.name}</h3>
                                            <p className="text-sm text-gray-400">Équipe #{index + 1}</p>
                                        </div>
                                    </div>
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>

                                {/* Capitaine */}
                                <div className="mb-4 bg-gray-700/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Crown className="w-4 h-4 text-yellow-400" />
                                        <span className="text-sm font-semibold text-gray-300">Capitaine</span>
                                    </div>
                                    <div className="ml-6">
                                        <p className="text-white font-semibold">{team.captain.pseudo}</p>
                                        <p className="text-sm text-gray-400">{team.captain.country}</p>
                                    </div>
                                </div>

                                {/* Joueurs - Affichage conditionnel selon la taille d'équipe */}
                                {teamSize > 1 && team.players && team.players.length > 1 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-semibold text-gray-300">
                                                Coéquipiers ({team.players.length - 1}/{teamSize - 1})
                                            </span>
                                        </div>
                                        <div className="ml-6 space-y-2">
                                            {team.players.slice(1).map((player, idx) => (
                                                <div key={idx} className="text-sm">
                                                    <p className="text-white">{player.pseudo}</p>
                                                    <p className="text-gray-400">{player.country}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Message pour mode Solo (1v1) */}
                                {teamSize === 1 && (
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                        <p className="text-purple-300 text-sm text-center">
                                            Mode Solo - Pas de coéquipiers
                                        </p>
                                    </div>
                                )}

                                {/* Statut */}
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Statut</span>
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-semibold">
                                            <CheckCircle className="w-4 h-4" />
                                            Validée
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA Section */}
                {!loading && (
                    <div className="mt-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Vous n&apos;êtes pas encore inscrit ?
                        </h2>
                        <p className="text-gray-300 mb-6">
                            Rejoignez le tournoi {gameModeName} et affrontez les meilleures équipes !
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Link
                                href="/inscription/mp"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Créer une équipe
                            </Link>
                            {teamSize > 1 && (
                                <Link
                                    href="/rejoindre-mp"
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Rejoindre une équipe
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}
