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
    Crown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Team } from '@/types'
import { ComponentType } from 'react';
import { useRouter } from 'next/navigation'

interface AdminStats {
    totalTeams: number
    validatedTeams: number
    pendingTeams: number
    totalPlayers: number
    validatedPlayers: number
    pendingPlayers: number
}

export default function AdminDashboard() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<AdminStats>({
        totalTeams: 0,
        validatedTeams: 0,
        pendingTeams: 0,
        totalPlayers: 0,
        validatedPlayers: 0,
        pendingPlayers: 0
    })
    const [teams, setTeams] = useState<Team[]>([])
    const [selectedTab, setSelectedTab] = useState<'dashboard' | 'teams' | 'players' | 'settings'>('dashboard')
    const [loading, setLoading] = useState(true)
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [showTeamDetails, setShowTeamDetails] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [teamToDelete, setTeamToDelete] = useState<string | null>(null)
    const [fixingStatus, setFixingStatus] = useState(false)

    useEffect(() => {
        const unsubscribe = onSnapshot(
            query(collection(db, 'teams'), orderBy('createdAt', 'desc')),
            (snapshot) => {
                const teamsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Team[]

                setTeams(teamsData)

                // Calculer les statistiques
                const totalTeams = teamsData.length
                const validatedTeams = teamsData.filter(team => team.status === 'validated').length
                const pendingTeams = teamsData.filter(team => team.status === 'incomplete' || team.status === 'complete').length

                const allPlayers = teamsData.flatMap(team => team.players)
                const totalPlayers = allPlayers.length
                const validatedPlayers = allPlayers.filter(player => player.status === 'validated').length
                const pendingPlayers = allPlayers.filter(player => player.status === 'pending').length

                setStats({
                    totalTeams,
                    validatedTeams,
                    pendingTeams,
                    totalPlayers,
                    validatedPlayers,
                    pendingPlayers
                })

                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

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
            const teamRef = doc(db, 'teams', teamId)
            const team = teams.find(t => t.id === teamId)

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

                if (validatedCount >= 3) {
                    teamStatus = 'validated'
                } else if (totalPlayers === 4) {
                    teamStatus = 'complete'
                } else {
                    teamStatus = 'incomplete'
                }

                await updateDoc(teamRef, {
                    players: updatedPlayers,
                    captain: updatedCaptain,
                    status: teamStatus,
                    updatedAt: new Date()
                })

                toast.success('Joueur validé avec succès')
            }
        } catch (error) {
            console.error('Erreur lors de la validation:', error)
            toast.error('Erreur lors de la validation')
        }
    }

    const rejectPlayer = async (teamId: string, playerId: string) => {
        try {
            const teamRef = doc(db, 'teams', teamId)
            const team = teams.find(t => t.id === teamId)

            if (team) {
                const updatedPlayers = team.players.map(player =>
                    player.id === playerId
                        ? { ...player, status: 'rejected' as const }
                        : player
                )

                // Recalculer le statut de l'équipe après rejet
                const validatedCount = updatedPlayers.filter(p => p.status === 'validated').length;
                const rejectedCount = updatedPlayers.filter(p => p.status === 'rejected').length;
                const totalPlayers = updatedPlayers.length;

                let teamStatus: 'incomplete' | 'complete' | 'validated' | 'rejected';

                if (rejectedCount >= 3) {
                    teamStatus = 'rejected';
                } else if (validatedCount >= 3) {
                    teamStatus = 'validated';
                } else if (totalPlayers === 4) {
                    teamStatus = 'complete';
                } else {
                    teamStatus = 'incomplete';
                }

                await updateDoc(teamRef, {
                    players: updatedPlayers,
                    status: teamStatus,
                    updatedAt: new Date()
                });

                if (teamStatus === 'rejected') {
                    toast.success('L\'équipe a été refusée (3 joueurs ou plus rejetés)');
                } else {
                    toast.success('Joueur rejeté');
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
            await fetch('/api/admin/teams/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ teamId: teamToDelete }),
            })

            toast.success('Équipe supprimée avec succès')
            setShowDeleteConfirm(false)
            setTeamToDelete(null)
        } catch (error) {
            console.error('Erreur lors de la suppression:', error)
            toast.error('Erreur lors de la suppression')
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
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
                            <div className="flex items-center">
                                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3" />
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Administration</h1>
                                    <p className="text-xs sm:text-sm text-gray-500">Tournoi Battle Royale CODM</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                                <span className="text-xs sm:text-sm text-gray-600 truncate max-w-full sm:max-w-none">
                                    Connecté: {user?.email}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <LogOut className="h-4 w-4 mr-1" />
                                    Déconnexion
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                    {/* Navigation */}
                    <nav className="mb-6 sm:mb-8">
                        {/* Navigation Desktop */}
                        <div className="hidden sm:flex space-x-2 lg:space-x-8">
                            {[
                                { id: 'dashboard', label: 'Tableau de bord', icon: Users },
                                { id: 'teams', label: 'Équipes', icon: Users },
                                { id: 'players', label: 'Joueurs', icon: UserCheck },
                                { id: 'settings', label: 'Paramètres', icon: Settings }
                            ].map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedTab(id as 'dashboard' | 'teams' | 'players' | 'settings')}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${selectedTab === id
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    <span className="hidden lg:inline">{label}</span>
                                    <span className="lg:hidden">{label.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>

                        {/* Navigation Mobile */}
                        <div className="sm:hidden">
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'dashboard', label: 'Tableau', shortLabel: 'Stats', icon: Users },
                                    { id: 'teams', label: 'Équipes', shortLabel: 'Teams', icon: Users },
                                    { id: 'players', label: 'Joueurs', shortLabel: 'Players', icon: UserCheck },
                                    { id: 'settings', label: 'Paramètres', shortLabel: 'Config', icon: Settings }
                                ].map(({ id, label, shortLabel, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedTab(id as 'dashboard' | 'teams' | 'players' | 'settings')}
                                        className={`flex flex-col items-center justify-center p-3 text-xs font-medium rounded-lg transition-colors ${selectedTab === id
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5 mb-1" />
                                        <span>{shortLabel || label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </nav>

                    {/* Dashboard */}
                    {selectedTab === 'dashboard' && (
                        <div className="space-y-6 sm:space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                <StatCard
                                    icon={Users}
                                    title="Total Équipes"
                                    value={stats.totalTeams}
                                    color="bg-blue-500"
                                />
                                <StatCard
                                    icon={CheckCircle}
                                    title="Équipes Validées"
                                    value={stats.validatedTeams}
                                    color="bg-green-500"
                                />
                                <StatCard
                                    icon={Clock}
                                    title="Équipes en Attente"
                                    value={stats.pendingTeams}
                                    color="bg-yellow-500"
                                />
                                <StatCard
                                    icon={Users}
                                    title="Total Joueurs"
                                    value={stats.totalPlayers}
                                    color="bg-purple-500"
                                />
                                <StatCard
                                    icon={UserCheck}
                                    title="Joueurs Validés"
                                    value={stats.validatedPlayers}
                                    color="bg-green-500"
                                />
                                <StatCard
                                    icon={AlertTriangle}
                                    title="Joueurs en Attente"
                                    value={stats.pendingPlayers}
                                    color="bg-orange-500"
                                />
                            </div>

                            {/* Actions rapides */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <button
                                        onClick={() => window.open('/api/admin/export?format=csv', '_blank')}
                                        className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm sm:text-base"
                                    >
                                        <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                        <span className="hidden sm:inline">Exporter </span>CSV
                                    </button>
                                    <button
                                        onClick={() => window.open('/api/admin/export?format=pdf', '_blank')}
                                        className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm sm:text-base"
                                    >
                                        <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                        <span className="hidden sm:inline">Exporter </span>PDF (validés)
                                    </button>
                                    <button
                                        onClick={() => window.open('/api/admin/export?format=json', '_blank')}
                                        className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm sm:text-base"
                                    >
                                        <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                        <span className="hidden sm:inline">Exporter </span>JSON
                                    </button>
                                    <button
                                        onClick={fixTeamStatus}
                                        disabled={fixingStatus}
                                        className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                        {fixingStatus ? 'Correction...' : <span className="hidden sm:inline">Corriger </span>}
                                        {!fixingStatus && 'Statuts'}
                                    </button>
                                    <button className="flex items-center justify-center px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm sm:text-base">
                                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                        Fermer inscriptions
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Liste des équipes */}
                    {selectedTab === 'teams' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Gestion des équipes</h3>
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
                                                    <div className="text-sm text-gray-900">
                                                        {team.players.length}/4 joueurs
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {team.players.filter(p => p.status === 'validated').length} validés
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${team.status === 'validated'
                                                        ? 'bg-green-100 text-green-800'
                                                        : team.status === 'complete'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {team.status === 'validated'
                                                            ? 'Validée'
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

                            {/* Version Mobile/Tablet */}
                            <div className="lg:hidden">
                                <div className="divide-y divide-gray-200">
                                    {teams.map((team) => (
                                        <div key={team.id} className="p-4 sm:p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className="text-sm sm:text-base font-medium text-gray-900">{team.name}</h4>
                                                    <p className="text-xs sm:text-sm text-gray-500">Code: {team.code}</p>
                                                </div>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${team.status === 'validated'
                                                    ? 'bg-green-100 text-green-800'
                                                    : team.status === 'complete'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {team.status === 'validated'
                                                        ? 'Validée'
                                                        : team.status === 'complete'
                                                            ? 'Complète'
                                                            : 'Incomplète'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Capitaine</p>
                                                    <p className="text-sm text-gray-900">{team.captain.pseudo}</p>
                                                    <p className="text-xs text-gray-500">{team.captain.id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Joueurs</p>
                                                    <p className="text-sm text-gray-900">{team.players.length}/4 joueurs</p>
                                                    <p className="text-xs text-gray-500">{team.players.filter(p => p.status === 'validated').length} validés</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex justify-end space-x-2">
                                                <button
                                                    onClick={() => viewTeamDetails(team)}
                                                    className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Détails
                                                </button>
                                                <button
                                                    onClick={() => confirmDeleteTeam(team.id)}
                                                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer l'équipe"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Liste des joueurs organisée par équipes */}
                    {selectedTab === 'players' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation des joueurs par équipe</h3>
                                <div className="text-sm text-gray-600 mb-6">
                                    Gérez la validation des joueurs organisés par équipe. Vous pouvez valider ou rejeter chaque joueur individuellement.
                                </div>
                            </div>

                            {teams.map((team) => (
                                <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-lg font-medium text-gray-900">{team.name}</h4>
                                                <p className="text-sm text-gray-600">Code: {team.code} • {team.players.length}/4 joueurs</p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-sm">
                                                    <span className="text-green-600 font-medium">
                                                        {team.players.filter(p => p.status === 'validated').length} validés
                                                    </span>
                                                    <span className="text-gray-400 mx-2">•</span>
                                                    <span className="text-yellow-600 font-medium">
                                                        {team.players.filter(p => p.status === 'pending').length} en attente
                                                    </span>
                                                    <span className="text-gray-400 mx-2">•</span>
                                                    <span className="text-red-600 font-medium">
                                                        {team.players.filter(p => p.status === 'rejected').length} rejetés
                                                    </span>
                                                </div>
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${team.status === 'validated' ? 'bg-green-100 text-green-800' :
                                                    team.status === 'complete' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {team.status === 'validated' ? 'Équipe validée' :
                                                        team.status === 'complete' ? 'Équipe complète' : 'Équipe incomplète'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {/* Capitaine */}
                                        <div className="mb-6">
                                            <div className="flex items-center mb-3">
                                                <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                                                <h5 className="font-semibold text-gray-900">Capitaine</h5>
                                            </div>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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

                                        {/* Joueurs */}
                                        {team.players.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                    <Users className="h-5 w-5 text-blue-500 mr-2" />
                                                    Joueurs ({team.players.length})
                                                </h5>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {team.players.map((player, index) => (
                                                        <div key={player.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
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
                                                selectedTeam.status === 'complete' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {selectedTeam.status === 'validated' ? 'Validée' :
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
                                <h4 className="font-semibold text-gray-900 mb-4">Joueurs ({selectedTeam.players.length}/4)</h4>
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
