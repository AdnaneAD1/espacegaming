'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AdminGuard from '@/components/AdminGuard'
import {
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Download,
    Settings,
    LogOut,
    Shield,
    Eye,
    UserCheck,
    AlertTriangle,
    Trash2,
    X,
    Crown,
    FileText,
    Database,
    Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { collection, query, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Team } from '@/types'
import { Tournament } from '@/types/tournament-multi'
import { GameModeUtils } from '@/types/game-modes'
import { ComponentType } from 'react';
import { useRouter } from 'next/navigation'
import TournamentManagement from '@/components/admin/TournamentManagement'
import TournamentManager from '@/components/admin/TournamentManager'

interface AdminStats {
    totalTeams: number
    validatedTeams: number
    pendingTeams: number
    rejectedTeams: number
    totalPlayers: number
    validatedPlayers: number
    pendingPlayers: number
    rejectedPlayers: number
}

export default function AdminDashboard() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [teams, setTeams] = useState<Team[]>([])
    const [dashboardTeams, setDashboardTeams] = useState<Team[]>([])
    const [tournaments, setTournaments] = useState<Tournament[]>([])
    const [selectedTab, setSelectedTab] = useState<'dashboard' | 'teams' | 'players' | 'tournaments' | 'tournament-manage' | 'settings'>('dashboard')
    const [loading, setLoading] = useState(true)
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [showTeamDetails, setShowTeamDetails] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [teamToDelete, setTeamToDelete] = useState<string | null>(null)
    const [fixingStatus, setFixingStatus] = useState(false)
    const [selectedTournamentForTeams, setSelectedTournamentForTeams] = useState<string>('all')
    const [selectedTournamentForDashboard, setSelectedTournamentForDashboard] = useState<string>('all')
    const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null)
    const [managingTournamentId, setManagingTournamentId] = useState<string | null>(null)

    // Fonction pour naviguer vers la gestion d'un tournoi spécifique
    const handleManageTournament = (tournamentId: string) => {
        setManagingTournamentId(tournamentId)
        setSelectedTab('tournament-manage')
    }

    // Fonction pour revenir à la liste des tournois
    const handleBackToTournamentList = () => {
        setManagingTournamentId(null)
        setSelectedTab('tournaments')
    }

    // Calculer les statistiques pour le dashboard basées sur le tournoi sélectionné
    const calculateDashboardStats = (selectedTournament: string, teamsData: Team[]): AdminStats => {
        // Utiliser les équipes filtrées selon le tournoi sélectionné
        const relevantTeams = selectedTournament === 'all' ? teamsData : teamsData
        
        const totalTeams = relevantTeams.length
        const validatedTeams = relevantTeams.filter(team => team.status === 'validated').length
        const pendingTeams = relevantTeams.filter(team => team.status === 'incomplete' || team.status === 'complete').length
        const rejectedTeams = relevantTeams.filter(team => team.status === 'rejected').length
        
        const allPlayers = relevantTeams.flatMap(team => team.players)
        const totalPlayers = allPlayers.length
        const validatedPlayers = allPlayers.filter(player => player.status === 'validated').length
        const pendingPlayers = allPlayers.filter(player => player.status === 'pending').length
        const rejectedPlayers = allPlayers.filter(player => player.status === 'rejected').length
        
        return {
            totalTeams,
            validatedTeams,
            pendingTeams,
            rejectedTeams,
            totalPlayers,
            validatedPlayers,
            pendingPlayers,
            rejectedPlayers
        }
    }

    // Charger les tournois
    useEffect(() => {
        const loadTournaments = async () => {
            try {
                const tournamentsSnapshot = await getDocs(
                    query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'))
                )
                const tournamentsData = tournamentsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Tournament[]
                setTournaments(tournamentsData)

                // Trouver le tournoi actif et le sélectionner par défaut
                const activeTournament = tournamentsData.find(t => t.status === 'active')
                if (activeTournament) {
                    setActiveTournamentId(activeTournament.id)
                    setSelectedTournamentForTeams(activeTournament.id)
                    setSelectedTournamentForDashboard(activeTournament.id)
                }
            } catch (error) {
                console.error('Erreur lors du chargement des tournois:', error)
            }
        }
        loadTournaments()
    }, [])

    // Charger les équipes selon le tournoi sélectionné
    useEffect(() => {
        let unsubscribe: () => void

        if (selectedTournamentForTeams === 'all') {
            // Charger toutes les équipes (ancien système)
            unsubscribe = onSnapshot(
                query(collection(db, 'teams'), orderBy('createdAt', 'desc')),
                (snapshot) => {
                    const teamsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Team[]
                    setTeams(teamsData)
                    setLoading(false)
                }
            )
        } else {
            // Charger les équipes d'un tournoi spécifique
            unsubscribe = onSnapshot(
                query(
                    collection(db, 'tournaments', selectedTournamentForTeams, 'teams'),
                    orderBy('createdAt', 'desc')
                ),
                (snapshot) => {
                    const teamsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Team[]
                    setTeams(teamsData)
                    setLoading(false)
                }
            )
        }

        return () => unsubscribe()
    }, [selectedTournamentForTeams])

    // Charger les équipes pour le Dashboard selon le tournoi sélectionné
    useEffect(() => {
        let unsubscribe: () => void

        if (selectedTournamentForDashboard === 'all') {
            // Charger toutes les équipes (ancien système)
            unsubscribe = onSnapshot(
                query(collection(db, 'teams'), orderBy('createdAt', 'desc')),
                (snapshot) => {
                    const teamsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Team[]
                    setDashboardTeams(teamsData)
                }
            )
        } else {
            // Charger les équipes d'un tournoi spécifique
            unsubscribe = onSnapshot(
                query(
                    collection(db, 'tournaments', selectedTournamentForDashboard, 'teams'),
                    orderBy('createdAt', 'desc')
                ),
                (snapshot) => {
                    const teamsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Team[]
                    setDashboardTeams(teamsData)
                }
            )
        }

        return () => unsubscribe()
    }, [selectedTournamentForDashboard])

    const handleLogout = async () => {
        const result = await logout()
        if (result.success) {
            toast.success('Déconnexion réussie')
            setTimeout(() => {
                router.push('/')
            }, 300); // Petit délai pour laisser le toast s'afficher et éviter les race conditions
        }
    }

    const validatePlayer = async (teamId: string, playerId: string) => {
        try {
            // Trouver l'équipe pour obtenir son tournamentId
            const team = teams.find(t => t.id === teamId)
            if (!team) {
                toast.error('Équipe introuvable')
                return
            }

            // Utiliser le tournoi sélectionné
            const teamTournamentId = selectedTournamentForTeams !== 'all' ? selectedTournamentForTeams : activeTournamentId
            if (!teamTournamentId) {
                toast.error('Aucun tournoi associé à cette équipe')
                return
            }

            // Récupérer le tournoi pour obtenir le gameMode
            const tournament = tournaments.find(t => t.id === teamTournamentId)
            if (!tournament) {
                toast.error('Tournoi introuvable')
                return
            }

            // Calculer la taille d'équipe dynamiquement
            const teamSize = GameModeUtils.getTeamSize(tournament.gameMode)
            // Pour Solo (1): 1 validé suffit (le capitaine), Duo (2): 1 validé, Squad (4): 3 validés, 5v5 (5): 4 validés
            const minValidatedPlayers = teamSize === 1 ? 1 : teamSize - 1

            // Utiliser la référence du tournoi de l'équipe
            const teamRef = doc(db, 'tournaments', teamTournamentId, 'teams', teamId)
            const tournamentRef = doc(db, 'tournaments', teamTournamentId)

            if (team) {
                const updatedPlayers = team.players.map(player =>
                    player.id === playerId
                        ? { ...player, status: 'validated' as const }
                        : player
                )

                // Mettre à jour aussi le statut du capitaine si c'est lui
                let updatedCaptain = team.captain;
                const validatedPlayer = updatedPlayers.find(p => p.id === playerId);
                if (validatedPlayer?.isCaptain) {
                    updatedCaptain = { ...team.captain, status: 'validated' as const };
                }

                // Recalculer le statut de l'équipe après validation
                const validatedCount = updatedPlayers.filter(p => p.status === 'validated').length
                const totalPlayers = updatedPlayers.length

                let teamStatus: 'incomplete' | 'complete' | 'validated'
                const wasTeamValidatedBefore = team.status === 'validated'

                // Logique dynamique selon la taille d'équipe
                if (validatedCount >= minValidatedPlayers) {
                    teamStatus = 'validated'
                } else if (totalPlayers === teamSize) {
                    teamStatus = 'complete'
                } else {
                    teamStatus = 'incomplete'
                }

                // Mettre à jour l'équipe
                await updateDoc(teamRef, {
                    players: updatedPlayers,
                    captain: updatedCaptain,
                    status: teamStatus,
                    updatedAt: new Date()
                })

                // Si l'équipe vient d'être validée (nouveau statut 'validated' et n'était pas validée avant)
                if (teamStatus === 'validated' && !wasTeamValidatedBefore) {
                    // Mettre à jour les statistiques du tournoi
                    const updatedStats = {
                        ...tournament.stats,
                        totalTeams: tournament.stats.totalTeams + 1,
                        totalGames: 3 // Fixer le nombre de parties à 3 comme demandé
                    }

                    await updateDoc(tournamentRef, {
                        stats: updatedStats,
                        updatedAt: new Date()
                    })

                    toast.success('Équipe validée avec succès ! Statistiques du tournoi mises à jour (3 parties)')
                } else {
                    toast.success('Joueur validé avec succès')
                }
            }
        } catch (error) {
            console.error('Erreur lors de la validation:', error)
            toast.error('Erreur lors de la validation')
        }
    }

    const rejectPlayer = async (teamId: string, playerId: string) => {
        try {
            // Trouver l'équipe pour obtenir son tournamentId
            const team = teams.find(t => t.id === teamId)
            if (!team) {
                toast.error('Équipe introuvable')
                return
            }

            // Utiliser le tournoi sélectionné
            const teamTournamentId = selectedTournamentForTeams !== 'all' ? selectedTournamentForTeams : activeTournamentId
            if (!teamTournamentId) {
                toast.error('Aucun tournoi associé à cette équipe')
                return
            }

            // Récupérer le tournoi pour obtenir le gameMode
            const tournament = tournaments.find(t => t.id === teamTournamentId)
            if (!tournament) {
                toast.error('Tournoi introuvable')
                return
            }

            // Calculer la taille d'équipe dynamiquement
            const teamSize = GameModeUtils.getTeamSize(tournament.gameMode)
            // Pour Solo (1): 1 validé suffit (le capitaine), Duo (2): 1 validé, Squad (4): 3 validés, 5v5 (5): 4 validés
            const minValidatedPlayers = teamSize === 1 ? 1 : teamSize - 1
            // Pour Solo (1): 1 rejeté = équipe rejetée, Duo (2): 2 rejetés, Squad (4): 3 rejetés, 5v5 (5): 4 rejetés
            const minRejectedForTeamRejection = Math.max(1, teamSize - 1)

            // Utiliser la référence du tournoi de l'équipe
            const teamRef = doc(db, 'tournaments', teamTournamentId, 'teams', teamId)

            if (team) {
                const updatedPlayers = team.players.map(player =>
                    player.id === playerId
                        ? { ...player, status: 'rejected' as const }
                        : player
                )

                // Mettre à jour aussi le statut du capitaine si c'est lui
                let updatedCaptain = team.captain;
                const rejectedPlayer = updatedPlayers.find(p => p.id === playerId);
                if (rejectedPlayer?.isCaptain) {
                    updatedCaptain = { ...team.captain, status: 'rejected' as const };
                }

                // Recalculer le statut de l'équipe après rejet
                const validatedCount = updatedPlayers.filter(p => p.status === 'validated').length;
                const rejectedCount = updatedPlayers.filter(p => p.status === 'rejected').length;
                const totalPlayers = updatedPlayers.length;

                let teamStatus: 'incomplete' | 'complete' | 'validated' | 'rejected';

                // Logique dynamique selon la taille d'équipe
                if (rejectedCount >= minRejectedForTeamRejection) {
                    teamStatus = 'rejected';
                } else if (validatedCount >= minValidatedPlayers) {
                    teamStatus = 'validated';
                } else if (totalPlayers === teamSize) {
                    teamStatus = 'complete';
                } else {
                    teamStatus = 'incomplete';
                }

                await updateDoc(teamRef, {
                    players: updatedPlayers,
                    captain: updatedCaptain,
                    status: teamStatus,
                    updatedAt: new Date()
                });

                if (teamStatus === 'rejected') {
                    const message = teamSize === 1 
                        ? 'L\'équipe a été refusée (joueur rejeté)'
                        : `L'équipe a été refusée (${minRejectedForTeamRejection} joueur${minRejectedForTeamRejection > 1 ? 's' : ''} ou plus rejetés)`;
                    toast.success(message);
                } else {
                    toast.success('Joueur rejeté avec succès');
                }
            }
        } catch (error) {
            console.error('Erreur lors du rejet:', error)
            toast.error('Erreur lors du rejet')
        }
    }

    const viewTeamDetails = (team: Team) => {
        setSelectedTeam(team)
        setShowTeamDetails(true)
    }

    const confirmDeleteTeam = (teamId: string) => {
        setTeamToDelete(teamId)
        setShowDeleteConfirm(true)
    }

    const deleteTeam = async () => {
        if (!teamToDelete) return

        try {
            // Préparer les données à envoyer
            const deleteData: { teamId: string; tournamentId?: string } = {
                teamId: teamToDelete
            }

            // Ajouter le tournamentId si on n'est pas dans "all" (ancien système)
            if (selectedTournamentForTeams !== 'all') {
                deleteData.tournamentId = selectedTournamentForTeams
            }

            const response = await fetch('/api/admin/teams/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(deleteData),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erreur lors de la suppression')
            }

            toast.success('Équipe supprimée avec succès')
            setShowDeleteConfirm(false)
            setTeamToDelete(null)
        } catch (error) {
            console.error('Erreur lors de la suppression:', error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error('Erreur lors de la suppression')
            }
        }
    }

    const fixTeamStatus = async () => {
        if (fixingStatus) return

        setFixingStatus(true)
        try {
            const response = await fetch('/api/admin/fix-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const data = await response.json()

            if (data.success) {
                toast.success(data.message)
                if (data.fixes && data.fixes.length > 0) {
                    console.log('Corrections effectuées:', data.fixes)
                }
            } else {
                toast.error(data.error || 'Erreur lors de la correction')
            }
        } catch (error) {
            console.error('Erreur lors de la correction:', error)
            toast.error('Erreur lors de la correction')
        } finally {
            setFixingStatus(false)
        }
    }


    const StatCard = ({ icon: Icon, title, value, color }: {
        icon: ComponentType<{ className?: string }>
        title: string
        value: number
        color: string
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
                <div className={`p-2 sm:p-3 rounded-lg ${color} flex-shrink-0`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <AdminGuard>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </AdminGuard>
        )
    }

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
                            <div className="flex items-center w-full sm:w-auto">
                                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Administration</h1>
                                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Tournoi Battle Royale CODM</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                                <div className="flex items-center justify-between sm:justify-start">
                                    <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
                                        {user?.email}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ml-2 sm:ml-0"
                                    >
                                        <LogOut className="h-4 w-4 mr-1" />
                                        <span className="hidden xs:inline">Déconnexion</span>
                                        <span className="xs:hidden">Exit</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
                    {/* Navigation */}
                    <nav className="mb-4 sm:mb-6 lg:mb-8">
                        {/* Navigation Desktop */}
                        <div className="hidden md:flex space-x-1 lg:space-x-4 xl:space-x-8 bg-white rounded-xl p-2 shadow-sm border border-gray-200">
                            {[
                                { id: 'dashboard', label: 'Tableau de bord', icon: Users },
                                { id: 'teams', label: 'Équipes', icon: Users },
                                { id: 'players', label: 'Joueurs', icon: UserCheck },
                                { id: 'tournaments', label: 'Tournois', icon: Crown }
                            ].map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedTab(id as 'dashboard' | 'teams' | 'players' | 'tournaments')}
                                    className={`flex items-center px-3 lg:px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${selectedTab === id
                                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-102'
                                        }`}
                                >
                                    <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="hidden lg:inline whitespace-nowrap">{label}</span>
                                    <span className="lg:hidden whitespace-nowrap">{label.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>

                        {/* Navigation Tablet */}
                        <div className="hidden sm:flex md:hidden bg-white rounded-xl p-2 shadow-sm border border-gray-200 overflow-x-auto">
                            <div className="flex space-x-2 min-w-max">
                                {[
                                    { id: 'dashboard', label: 'Dashboard', icon: Users },
                                    { id: 'teams', label: 'Équipes', icon: Users },
                                    { id: 'players', label: 'Joueurs', icon: UserCheck },
                                    { id: 'tournaments', label: 'Tournois', icon: Crown }
                                ].map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedTab(id as 'dashboard' | 'teams' | 'players' | 'tournaments')}
                                        className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${selectedTab === id
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Mobile */}
                        <div className="sm:hidden bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'dashboard', label: 'Stats', icon: Users },
                                    { id: 'teams', label: 'Équipes', icon: Users },
                                    { id: 'players', label: 'Joueurs', icon: UserCheck }
                                ].map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedTab(id as 'dashboard' | 'teams' | 'players' | 'tournaments')}
                                        className={`flex flex-col items-center justify-center p-3 text-xs font-medium rounded-lg transition-all duration-200 ${selectedTab === id
                                            ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:scale-95'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5 mb-1.5" />
                                        <span className="leading-tight">{label}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Deuxième ligne pour mobile */}
                            <div className="flex justify-center mt-2">
                                <button
                                    onClick={() => setSelectedTab('tournaments')}
                                    className={`flex flex-col items-center justify-center p-3 text-xs font-medium rounded-lg transition-all duration-200 ${selectedTab === 'tournaments'
                                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:scale-95'
                                        }`}
                                >
                                    <Crown className="h-5 w-5 mb-1.5" />
                                    <span className="leading-tight">Tournois</span>
                                </button>
                            </div>
                        </div>
                    </nav>

                    {/* Dashboard */}
                    {selectedTab === 'dashboard' && (
                        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                            {/* Sélecteur de tournoi pour le dashboard */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
                                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Statistiques du tournoi</h3>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <label htmlFor="tournament-select-dashboard" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                            Tournoi :
                                        </label>
                                        <select
                                            id="tournament-select-dashboard"
                                            value={selectedTournamentForDashboard}
                                            onChange={(e) => setSelectedTournamentForDashboard(e.target.value)}
                                            className="w-full sm:w-auto min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 truncate"
                                        >
                                            <option value="all">Toutes les données (ancien système)</option>
                                            {tournaments.map((tournament) => (
                                                <option key={tournament.id} value={tournament.id}>
                                                    {tournament.name} ({tournament.status === 'active' ? 'Actif' : tournament.status === 'completed' ? 'Terminé' : 'Brouillon'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Cartes statistiques responsive */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                                <div className="col-span-2 sm:col-span-3 lg:col-span-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                                        <StatCard
                                            icon={Users}
                                            title="Total Équipes"
                                            value={calculateDashboardStats(selectedTournamentForDashboard, dashboardTeams).totalTeams}
                                            color="bg-blue-500"
                                        />
                                        <StatCard
                                            icon={CheckCircle}
                                            title="Équipes Validées"
                                            value={calculateDashboardStats(selectedTournamentForDashboard, dashboardTeams).validatedTeams}
                                            color="bg-green-500"
                                        />
                                        <StatCard
                                            icon={Clock}
                                            title="Équipes en Attente"
                                            value={calculateDashboardStats(selectedTournamentForDashboard, dashboardTeams).pendingTeams}
                                            color="bg-yellow-500"
                                        />
                                        <StatCard
                                            icon={Users}
                                            title="Total Joueurs"
                                            value={calculateDashboardStats(selectedTournamentForDashboard, dashboardTeams).totalPlayers}
                                            color="bg-purple-500"
                                        />
                                        <StatCard
                                            icon={UserCheck}
                                            title="Joueurs Validés"
                                            value={calculateDashboardStats(selectedTournamentForDashboard, dashboardTeams).validatedPlayers}
                                            color="bg-green-500"
                                        />
                                        <StatCard
                                            icon={AlertTriangle}
                                            title="Joueurs en Attente"
                                            value={calculateDashboardStats(selectedTournamentForDashboard, dashboardTeams).pendingPlayers}
                                            color="bg-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions rapides - Version responsive */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
                                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Actions rapides</h3>
                                <div className="text-xs sm:text-sm text-gray-600 mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                                    {selectedTournamentForDashboard === 'all' 
                                        ? '📈 Actions sur toutes les données (ancien système)'
                                        : `🏆 Actions sur le tournoi : ${tournaments.find(t => t.id === selectedTournamentForDashboard)?.name || 'Tournoi sélectionné'}`
                                    }
                                </div>
                                
                                {/* Version mobile - cartes empilées */}
                                <div className="sm:hidden space-y-2">
                                    <button
                                        onClick={() => {
                                            const exportUrl = selectedTournamentForDashboard === 'all' 
                                                ? '/api/admin/export?format=csv'
                                                : `/api/admin/export?format=csv&tournament=${selectedTournamentForDashboard}`
                                            window.open(exportUrl, '_blank')
                                        }}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:scale-95 transition-all duration-200 text-sm font-medium"
                                    >
                                        <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                                        Exporter CSV
                                    </button>
                                    <button
                                        onClick={() => {
                                            const exportUrl = selectedTournamentForDashboard === 'all' 
                                                ? '/api/admin/export?format=pdf'
                                                : `/api/admin/export?format=pdf&tournament=${selectedTournamentForDashboard}`
                                            window.open(exportUrl, '_blank')
                                        }}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 active:scale-95 transition-all duration-200 text-sm font-medium"
                                    >
                                        <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                        Exporter PDF
                                    </button>
                                    <button
                                        onClick={() => {
                                            const exportUrl = selectedTournamentForDashboard === 'all' 
                                                ? '/api/admin/export?format=json'
                                                : `/api/admin/export?format=json&tournament=${selectedTournamentForDashboard}`
                                            window.open(exportUrl, '_blank')
                                        }}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:scale-95 transition-all duration-200 text-sm font-medium"
                                    >
                                        <Database className="h-4 w-4 mr-2 flex-shrink-0" />
                                        Exporter JSON
                                    </button>

                                </div>
                                
                                {/* Version tablette/desktop - grille */}
                                <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                                    <button
                                        onClick={() => {
                                            const exportUrl = selectedTournamentForDashboard === 'all' 
                                                ? '/api/admin/export?format=csv'
                                                : `/api/admin/export?format=csv&tournament=${selectedTournamentForDashboard}`
                                            window.open(exportUrl, '_blank')
                                        }}
                                        className="flex flex-col sm:flex-row items-center justify-center px-3 py-3 sm:px-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:scale-95 transition-all duration-200 text-xs sm:text-sm font-medium"
                                    >
                                        <Download className="h-5 w-5 sm:h-4 sm:w-4 mb-1 sm:mb-0 sm:mr-2 flex-shrink-0" />
                                        <span className="text-center leading-tight">
                                            <span className="block sm:hidden">CSV</span>
                                            <span className="hidden sm:inline">Export CSV</span>
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const exportUrl = selectedTournamentForDashboard === 'all' 
                                                ? '/api/admin/export?format=pdf'
                                                : `/api/admin/export?format=pdf&tournament=${selectedTournamentForDashboard}`
                                            window.open(exportUrl, '_blank')
                                        }}
                                        className="flex flex-col sm:flex-row items-center justify-center px-3 py-3 sm:px-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 active:scale-95 transition-all duration-200 text-xs sm:text-sm font-medium"
                                    >
                                        <Download className="h-5 w-5 sm:h-4 sm:w-4 mb-1 sm:mb-0 sm:mr-2 flex-shrink-0" />
                                        <span className="text-center leading-tight">
                                            <span className="block sm:hidden">PDF</span>
                                            <span className="hidden sm:inline">Export PDF</span>
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const exportUrl = selectedTournamentForDashboard === 'all' 
                                                ? '/api/admin/export?format=json'
                                                : `/api/admin/export?format=json&tournament=${selectedTournamentForDashboard}`
                                            window.open(exportUrl, '_blank')
                                        }}
                                        className="flex flex-col sm:flex-row items-center justify-center px-3 py-3 sm:px-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:scale-95 transition-all duration-200 text-xs sm:text-sm font-medium"
                                    >
                                        <Download className="h-5 w-5 sm:h-4 sm:w-4 mb-1 sm:mb-0 sm:mr-2 flex-shrink-0" />
                                        <span className="text-center leading-tight">
                                            <span className="block sm:hidden">JSON</span>
                                            <span className="hidden sm:inline">Export JSON</span>
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (selectedTournamentForDashboard === 'all') {
                                                fixTeamStatus()
                                            } else {
                                                alert('Correction des statuts disponible uniquement pour l\'ancien système ("Toutes les données")')
                                            }
                                        }}
                                        disabled={fixingStatus || selectedTournamentForDashboard !== 'all'}
                                        className="flex flex-col sm:flex-row items-center justify-center px-3 py-3 sm:px-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 active:scale-95 transition-all duration-200 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        <Settings className="h-5 w-5 sm:h-4 sm:w-4 mb-1 sm:mb-0 sm:mr-2 flex-shrink-0" />
                                        <span className="text-center leading-tight">
                                            {fixingStatus ? (
                                                <span className="block">Correction...</span>
                                            ) : (
                                                <>
                                                    <span className="block sm:hidden">Statuts</span>
                                                    <span className="hidden sm:inline">Corriger Statuts</span>
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Liste des équipes */}
                    {selectedTab === 'teams' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
                                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Gestion des équipes</h3>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <label htmlFor="tournament-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                            Tournoi :
                                        </label>
                                        <select
                                            id="tournament-select"
                                            value={selectedTournamentForTeams}
                                            onChange={(e) => setSelectedTournamentForTeams(e.target.value)}
                                            className="w-full sm:w-auto min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 truncate"
                                        >
                                            <option value="all">Toutes les équipes (ancien système)</option>
                                            {tournaments.map((tournament) => (
                                                <option key={tournament.id} value={tournament.id}>
                                                    {tournament.name} ({tournament.status === 'active' ? 'Actif' : tournament.status === 'completed' ? 'Terminé' : 'Brouillon'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Version Desktop */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Équipe
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Capitaine
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Joueurs
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {teams.map((team) => (
                                            <tr key={team.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{team.name}</div>
                                                        <div className="text-sm text-gray-500">Code: {team.code}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{team.captain.pseudo}</div>
                                                        <div className="text-sm text-gray-500">{team.captain.id}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(() => {
                                                        const tournamentId = selectedTournamentForTeams !== 'all' ? selectedTournamentForTeams : activeTournamentId
                                                        const tournament = tournaments.find(t => t.id === tournamentId)
                                                        const teamSize = tournament ? GameModeUtils.getTeamSize(tournament.gameMode) : 4
                                                        return (
                                                            <>
                                                                <div className="text-sm text-gray-900">
                                                                    {team.players.length}/{teamSize} joueur{teamSize > 1 ? 's' : ''}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {team.players.filter(p => p.status === 'validated').length} validé{team.players.filter(p => p.status === 'validated').length > 1 ? 's' : ''}
                                                                </div>
                                                            </>
                                                        )
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${team.status === 'validated'
                                                        ? 'bg-green-100 text-green-800'
                                                        : team.status === 'rejected'
                                                            ? 'bg-red-100 text-red-800'
                                                            : team.status === 'complete'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {team.status === 'validated'
                                                            ? 'Validée'
                                                            : team.status === 'rejected'
                                                                ? 'Refusée'
                                                                : team.status === 'complete'
                                                                    ? 'Complète'
                                                                    : 'Incomplète'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => viewTeamDetails(team)}
                                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                            title="Voir les détails"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDeleteTeam(team.id)}
                                                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                            title="Supprimer l'équipe"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Version Mobile/Tablet - Cartes modernes */}
                            <div className="lg:hidden p-3 sm:p-4">
                                <div className="space-y-3 sm:space-y-4">
                                    {teams.map((team) => (
                                        <div key={team.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200">
                                            {/* En-tête de la carte */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{team.name}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <span className="inline-flex items-center">
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                                            Code: {team.code}
                                                        </span>
                                                    </p>
                                                </div>
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ml-3 whitespace-nowrap ${team.status === 'validated'
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : team.status === 'rejected'
                                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                                        : team.status === 'complete'
                                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                    }`}>
                                                    {team.status === 'validated'
                                                        ? '✓ Validée'
                                                        : team.status === 'rejected'
                                                            ? '❌ Refusée'
                                                            : team.status === 'complete'
                                                                ? '📝 Complète'
                                                                : '⚠ Incomplète'}
                                                </span>
                                            </div>
                                            
                                            {/* Informations principales */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                    <div className="flex items-center mb-2">
                                                        <UserCheck className="h-4 w-4 text-blue-600 mr-2" />
                                                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Capitaine</p>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900">{team.captain.pseudo}</p>
                                                    <p className="text-xs text-gray-500 mt-1 font-mono">{team.captain.id}</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                    <div className="flex items-center mb-2">
                                                        <Users className="h-4 w-4 text-purple-600 mr-2" />
                                                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Joueurs</p>
                                                    </div>
                                                    {(() => {
                                                        const tournamentId = selectedTournamentForTeams !== 'all' ? selectedTournamentForTeams : activeTournamentId
                                                        const tournament = tournaments.find(t => t.id === tournamentId)
                                                        const teamSize = tournament ? GameModeUtils.getTeamSize(tournament.gameMode) : 4
                                                        const validatedCount = team.players.filter(p => p.status === 'validated').length
                                                        return (
                                                            <>
                                                                <p className="text-sm font-medium text-gray-900">{team.players.length}/{teamSize} joueur{teamSize > 1 ? 's' : ''}</p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    <span className="inline-flex items-center">
                                                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                                                        {validatedCount} validé{validatedCount > 1 ? 's' : ''}
                                                                    </span>
                                                                </p>
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                                <button
                                                    onClick={() => viewTeamDetails(team)}
                                                    className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 active:scale-95 transition-all duration-200"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Voir les détails
                                                </button>
                                                <button
                                                    onClick={() => confirmDeleteTeam(team.id)}
                                                    className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all duration-200"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Supprimer l&apos;équipe
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Message si aucune équipe */}
                                {teams.length === 0 && (
                                    <div className="text-center py-12">
                                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune équipe trouvée</h3>
                                        <p className="text-gray-600">Aucune équipe n&apos;est disponible pour le tournoi sélectionné.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Liste des joueurs organisée par équipes */}
                    {selectedTab === 'players' && (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                                <div className="flex flex-col space-y-4">
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Validation des joueurs par équipe</h3>
                                        <div className="text-sm text-gray-600 mt-2">
                                            Gérez la validation des joueurs organisés par équipe. Vous pouvez valider ou rejeter chaque joueur individuellement.
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <label htmlFor="tournament-select-players" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                            Tournoi :
                                        </label>
                                        <select
                                            id="tournament-select-players"
                                            value={selectedTournamentForTeams}
                                            onChange={(e) => setSelectedTournamentForTeams(e.target.value)}
                                            className="w-full sm:w-auto min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 truncate"
                                        >
                                            <option value="all">Tous les joueurs (ancien système)</option>
                                            {tournaments.map((tournament) => (
                                                <option key={tournament.id} value={tournament.id}>
                                                    {tournament.name} ({tournament.status === 'active' ? 'Actif' : tournament.status === 'completed' ? 'Terminé' : 'Brouillon'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {teams.map((team) => (
                                <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                                    {/* En-tête responsive */}
                                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{team.name}</h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    <span className="inline-flex items-center">
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                                        Code: {team.code} • {(() => {
                                                            const tournamentId = selectedTournamentForTeams !== 'all' ? selectedTournamentForTeams : activeTournamentId
                                                            const tournament = tournaments.find(t => t.id === tournamentId)
                                                            const teamSize = tournament ? GameModeUtils.getTeamSize(tournament.gameMode) : 4
                                                            return `${team.players.length}/${teamSize} joueur${teamSize > 1 ? 's' : ''}`
                                                        })()}
                                                    </span>
                                                </p>
                                            </div>
                                            
                                            {/* Statistiques responsive */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                {/* Stats sur mobile - version compacte */}
                                                <div className="flex sm:hidden items-center gap-4 text-xs">
                                                    <span className="flex items-center text-green-600 font-medium">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                                        {team.players.filter(p => p.status === 'validated').length} validés
                                                    </span>
                                                    <span className="flex items-center text-yellow-600 font-medium">
                                                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                                                        {team.players.filter(p => p.status === 'pending').length} attente
                                                    </span>
                                                    <span className="flex items-center text-red-600 font-medium">
                                                        <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                                                        {team.players.filter(p => p.status === 'rejected').length} rejetés
                                                    </span>
                                                </div>
                                                
                                                {/* Stats sur desktop - version détaillée */}
                                                <div className="hidden sm:flex items-center text-sm space-x-4">
                                                    <span className="text-green-600 font-medium">
                                                        {team.players.filter(p => p.status === 'validated').length} validés
                                                    </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="text-yellow-600 font-medium">
                                                        {team.players.filter(p => p.status === 'pending').length} en attente
                                                    </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="text-red-600 font-medium">
                                                        {team.players.filter(p => p.status === 'rejected').length} rejetés
                                                    </span>
                                                </div>
                                                
                                                {/* Badge statut */}
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${team.status === 'validated' ? 'bg-green-100 text-green-800 border border-green-200' :
                                                    team.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                    team.status === 'complete' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                        'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                    }`}>
                                                    {team.status === 'validated' ? '✓ Équipe validée' :
                                                        team.status === 'rejected' ? '❌ Équipe refusée' :
                                                        team.status === 'complete' ? '📝 Équipe complète' : '⚠ Équipe incomplète'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 sm:p-4 lg:p-6">
                                        {/* Capitaine - Version responsive */}
                                        <div className="mb-4 sm:mb-6">
                                            <div className="flex items-center mb-3 sm:mb-4">
                                                <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                                                <h5 className="text-base sm:text-lg font-semibold text-gray-900">Capitaine</h5>
                                            </div>
                                            
                                            {/* Version mobile - carte compacte */}
                                            <div className="sm:hidden bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-900 text-base truncate">{team.captain.pseudo}</p>
                                                            <p className="text-sm text-gray-600 mt-1">{team.captain.country}</p>
                                                        </div>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 whitespace-nowrap ${team.captain.status === 'validated' ? 'bg-green-100 text-green-800' :
                                                            team.captain.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {team.captain.status === 'validated' ? '✓ Validé' :
                                                                team.captain.status === 'rejected' ? '✗ Rejeté' : '⏳ En attente'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-gray-600">WhatsApp:</p>
                                                            <p className="font-mono text-gray-900 text-xs truncate">{team.captain.whatsapp}</p>
                                                        </div>
                                                        <div className="ml-3">
                                                            {team.captain.deviceCheckVideo ? (
                                                                <a
                                                                    href={team.captain.deviceCheckVideo}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                                                >
                                                                    <Eye className="h-3 w-3 mr-1" />
                                                                    Vidéo
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">Pas de vidéo</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {team.captain.status === 'pending' && (
                                                        <div className="flex gap-2 pt-2 border-t border-yellow-200">
                                                            <button
                                                                onClick={() => validatePlayer(team.id!, team.captain.id)}
                                                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                                            >
                                                                <Check className="h-4 w-4 mr-1" />
                                                                Valider
                                                            </button>
                                                            <button
                                                                onClick={() => rejectPlayer(team.id!, team.captain.id)}
                                                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                                            >
                                                                <X className="h-4 w-4 mr-1" />
                                                                Rejeter
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Version desktop/tablette - layout étendu */}
                                            <div className="hidden sm:block bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{team.captain.pseudo}</p>
                                                        <p className="text-sm text-gray-600">{team.captain.country}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">WhatsApp:</p>
                                                        <p className="text-sm font-mono text-gray-900">{team.captain.whatsapp}</p>
                                                    </div>
                                                    <div>
                                                        {team.captain.deviceCheckVideo ? (
                                                            <a
                                                                href={team.captain.deviceCheckVideo}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Voir vidéo
                                                            </a>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">Aucune vidéo</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${team.captain.status === 'validated' ? 'bg-green-100 text-green-800' :
                                                            team.captain.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {team.captain.status === 'validated' ? 'Validé' :
                                                                team.captain.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                                        </span>
                                                        {team.captain.status === 'pending' && (
                                                            <div className="flex space-x-1 ml-2">
                                                                <button
                                                                    onClick={() => validatePlayer(team.id!, team.captain.id)}
                                                                    className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                                                                    title="Valider"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => rejectPlayer(team.id!, team.captain.id)}
                                                                    className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                                                    title="Rejeter"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Joueurs - Version responsive */}
                                        {team.players.length > 0 && (
                                            <div>
                                                <h5 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                                                    <Users className="h-5 w-5 text-blue-500 mr-2" />
                                                    Joueurs ({team.players.length})
                                                </h5>
                                                
                                                {/* Version mobile - cartes compactes */}
                                                <div className="sm:hidden space-y-3">
                                                    {team.players.map((player, index) => (
                                                        <div key={player.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <h6 className="font-semibold text-gray-900 text-sm truncate">Joueur {index + 1}</h6>
                                                                    <p className="text-sm font-medium text-gray-900 mt-1 truncate">{player.pseudo}</p>
                                                                    <p className="text-xs text-gray-600">{player.country}</p>
                                                                </div>
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 whitespace-nowrap ${player.status === 'validated' ? 'bg-green-100 text-green-800' :
                                                                    player.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                        'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                    {player.status === 'validated' ? '✓ Validé' :
                                                                        player.status === 'rejected' ? '✗ Rejeté' : '⏳ En attente'}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="space-y-2 text-xs">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-600">WhatsApp:</span>
                                                                    <span className="font-mono text-gray-900 truncate ml-2">{player.whatsapp}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-600">Vidéo:</span>
                                                                    <div className="ml-2">
                                                                        {player.deviceCheckVideo ? (
                                                                            <a
                                                                                href={player.deviceCheckVideo}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                                                                            >
                                                                                <Eye className="h-3 w-3 mr-1" />
                                                                                Voir
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-gray-400">Aucune</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {player.status === 'pending' && (
                                                                <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200">
                                                                    <button
                                                                        onClick={() => validatePlayer(team.id!, player.id)}
                                                                        className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                                                    >
                                                                        <Check className="h-3 w-3 mr-1" />
                                                                        Valider
                                                                    </button>
                                                                    <button
                                                                        onClick={() => rejectPlayer(team.id!, player.id)}
                                                                        className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                                                    >
                                                                        <X className="h-3 w-3 mr-1" />
                                                                        Rejeter
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {/* Version desktop/tablette - grille étendue */}
                                                <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {team.players.map((player, index) => (
                                                        <div key={player.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h6 className="font-medium text-gray-900">Joueur {index + 1}</h6>
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${player.status === 'validated' ? 'bg-green-100 text-green-800' :
                                                                    player.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                        'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                    {player.status === 'validated' ? 'Validé' :
                                                                        player.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                                                <div>
                                                                    <p className="text-gray-600">Pseudo:</p>
                                                                    <p className="font-medium text-gray-900">{player.pseudo}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-600">Pays:</p>
                                                                    <p className="text-gray-900">{player.country}</p>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <p className="text-gray-600">WhatsApp:</p>
                                                                    <p className="font-mono text-sm text-gray-900">{player.whatsapp}</p>
                                                                </div>
                                                            </div>                                                            
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    {player.deviceCheckVideo ? (
                                                                        <a
                                                                            href={player.deviceCheckVideo}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                                                        >
                                                                            <Eye className="h-3 w-3 mr-1" />
                                                                            Vidéo
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-400">Aucune vidéo</span>
                                                                    )}
                                                                </div>
                                                                {player.status === 'pending' && (
                                                                    <div className="flex space-x-1">
                                                                        <button
                                                                            onClick={() => validatePlayer(team.id!, player.id)}
                                                                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                                                                            title="Valider"
                                                                        >
                                                                            <CheckCircle className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => rejectPlayer(team.id!, player.id)}
                                                                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                                                            title="Rejeter"
                                                                        >
                                                                            <XCircle className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {team.players.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                                <p>Aucun joueur supplémentaire dans cette équipe</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {teams.length === 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune équipe</h3>
                                    <p className="text-gray-600">Aucune équipe n&apos;est encore inscrite au tournoi.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gestion des Tournois */}
                    {selectedTab === 'tournaments' && (
                        <TournamentManagement onManageTournament={handleManageTournament} />
                    )}

                    {/* Gestion d'un Tournoi Spécifique */}
                    {selectedTab === 'tournament-manage' && managingTournamentId && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Gestion du Tournoi</h2>
                                <button
                                    onClick={handleBackToTournamentList}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    ← Retour à la liste
                                </button>
                            </div>
                            <TournamentManager
                                teams={teams}
                                tournamentId={managingTournamentId}
                                onBackToList={handleBackToTournamentList}
                            />
                        </div>
                    )}

                    {/* Paramètres */}
                    {selectedTab === 'settings' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres du tournoi</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Statut des inscriptions
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                            Ouvertes
                                        </button>
                                        <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                                            Fermées
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="team-limit" className="block text-sm font-medium text-gray-700 mb-2">
                                        Limite d&apos;équipes
                                    </label>
                                    <input
                                        id="team-limit"
                                        type="number"
                                        defaultValue={50}
                                        placeholder="Nombre maximum d'équipes"
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Sauvegarder les paramètres
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal des détails d'équipe */}
            {showTeamDetails && selectedTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Détails de l&apos;équipe: {selectedTeam.name}
                                </h3>
                                <button
                                    onClick={() => setShowTeamDetails(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Fermer"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Informations générales</h4>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <p><span className="font-medium text-gray-900">Nom:</span> {selectedTeam.name}</p>
                                        <p><span className="font-medium text-gray-900">Code:</span> {selectedTeam.code}</p>
                                        <p><span className="font-medium text-gray-900">Statut:</span>
                                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${selectedTeam.status === 'validated' ? 'bg-green-100 text-green-800' :
                                                selectedTeam.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                selectedTeam.status === 'complete' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {selectedTeam.status === 'validated' ? 'Validée' :
                                                    selectedTeam.status === 'rejected' ? 'Refusée' :
                                                    selectedTeam.status === 'complete' ? 'Complète' : 'Incomplète'}
                                            </span>
                                        </p>
                                        <p><span className="font-medium text-gray-900">Créée le:</span> {new Date(selectedTeam.createdAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Capitaine</h4>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <p><span className="font-medium text-gray-900">Pseudo:</span> {selectedTeam.captain.pseudo}</p>
                                        <p><span className="font-medium text-gray-900">Pays:</span> {selectedTeam.captain.country}</p>
                                        <p><span className="font-medium text-gray-900">WhatsApp:</span> {selectedTeam.captain.whatsapp}</p>
                                        <p><span className="font-medium text-gray-900">Statut:</span>
                                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${selectedTeam.captain.status === 'validated' ? 'bg-green-100 text-green-800' :
                                                selectedTeam.captain.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {selectedTeam.captain.status === 'validated' ? 'Validé' :
                                                    selectedTeam.captain.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4">
                                    Joueurs ({selectedTeam.players.length}/{(() => {
                                        const tournamentId = selectedTournamentForTeams !== 'all' ? selectedTournamentForTeams : activeTournamentId
                                        const tournament = tournaments.find(t => t.id === tournamentId)
                                        return tournament ? GameModeUtils.getTeamSize(tournament.gameMode) : 4
                                    })()})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedTeam.players.map((player, index) => (
                                        <div key={player.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="font-medium text-gray-900">Joueur {index + 1}</h5>
                                                <span className={`px-2 py-1 text-xs rounded-full ${player.status === 'validated' ? 'bg-green-100 text-green-800' :
                                                    player.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {player.status === 'validated' ? 'Validé' :
                                                        player.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-700">
                                                <p><span className="font-medium text-gray-900">Pseudo:</span> {player.pseudo}</p>
                                                <p><span className="font-medium text-gray-900">Pays:</span> {player.country}</p>
                                                <p><span className="font-medium text-gray-900">WhatsApp:</span> {player.whatsapp}</p>
                                                {player.deviceCheckVideo && (
                                                    <p>
                                                        <span className="font-medium text-gray-900">Vidéo:</span>
                                                        <a
                                                            href={player.deviceCheckVideo}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-1 text-blue-600 hover:text-blue-800 underline"
                                                        >
                                                            Voir la vidéo
                                                        </a>
                                                    </p>
                                                )}
                                            </div>
                                            {player.status === 'pending' && (
                                                <div className="flex space-x-2 mt-3">
                                                    <button
                                                        onClick={() => validatePlayer(selectedTeam.id!, player.id)}
                                                        className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Valider
                                                    </button>
                                                    <button
                                                        onClick={() => rejectPlayer(selectedTeam.id!, player.id)}
                                                        className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Rejeter
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                            <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={deleteTeam}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminGuard>
    )
}
