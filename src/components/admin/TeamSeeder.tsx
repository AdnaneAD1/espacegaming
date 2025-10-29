'use client'

import { useState } from 'react'
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Database, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const TOURNAMENT_ID = 'onGCUWcYD6ajkMoCeafO'

const teamNames = [
  'Les Guerriers', 'Team Alpha', 'Les Titans', 'Phoenix Squad', 'Les Légendes',
  'Team Vortex', 'Les Champions', 'Elite Force', 'Les Invincibles', 'Team Nexus',
  'Les Gladiateurs', 'Storm Riders', 'Les Prédateurs', 'Team Omega', 'Les Spartans',
  'Night Hawks', 'Les Conquérants', 'Team Fury', 'Les Dominateurs', 'Shadow Legion',
  'Les Immortels', 'Team Velocity'
]

const pseudos = [
  'ProGamer', 'SkillMaster', 'NightHawk', 'ShadowKing', 'FireStorm',
  'IceBreaker', 'ThunderBolt', 'PhoenixRise', 'DragonSlayer', 'VortexPro',
  'AlphaWolf', 'OmegaForce', 'TitanSlayer', 'LegendKiller', 'EliteSniper',
  'StormChaser', 'NightRider', 'ShadowHunter', 'FireFox', 'IceKing',
  'ThunderStrike', 'PhoenixWing', 'DragonFury', 'VortexStorm', 'AlphaPrime',
  'OmegaStrike', 'TitanForce', 'LegendPro', 'EliteWarrior', 'StormBreaker',
  'NightStalker', 'ShadowBlade', 'FireDragon', 'IcePhoenix', 'ThunderWave',
  'PhoenixFire', 'DragonKing', 'VortexRage', 'AlphaStrike', 'OmegaBlast',
  'TitanRage', 'LegendStrike', 'EliteForce', 'StormRider', 'NightBlade',
  'ShadowStrike', 'FireStrike', 'IceStorm', 'ThunderFury', 'PhoenixStorm',
  'DragonStorm', 'VortexBlast', 'AlphaRage', 'OmegaFury', 'TitanStrike',
  'LegendForce', 'EliteRage', 'StormFury', 'NightStorm', 'ShadowFury',
  'FireBlast', 'IceFury', 'ThunderRage', 'PhoenixBlast', 'DragonBlast',
  'VortexFury', 'AlphaBlast', 'OmegaRage', 'TitanBlast', 'LegendBlast',
  'EliteStorm', 'StormBlast', 'NightFury', 'ShadowRage', 'FireFury',
  'IceBlast', 'ThunderBlast', 'PhoenixRage', 'DragonRage', 'VortexStrike',
  'AlphaFury', 'OmegaStorm', 'TitanFury', 'LegendRage', 'EliteBlast',
  'StormStrike', 'NightRage', 'ShadowBlast', 'FireRage', 'IceRage',
  'ThunderStorm', 'PhoenixFury', 'DragonFury2', 'VortexRage2', 'AlphaStorm',
  'OmegaStrike2', 'TitanStorm', 'LegendStorm', 'EliteStrike', 'StormRage',
  'NightBlast', 'ShadowStorm', 'FireStorm2', 'IceStrike', 'ThunderStrike2',
  'PhoenixStrike', 'DragonStrike', 'VortexStorm2', 'AlphaBlast2', 'OmegaBlast2'
]

const countries = [
  'Maroc', 'France', 'Algérie', 'Tunisie', 'Belgique',
  'Suisse', 'Canada', 'Égypte', 'Sénégal', 'Côte d\'Ivoire'
]

function generateTeamCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function TeamSeeder() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [progress, setProgress] = useState(0)

  async function createTeam(teamIndex: number) {
    const teamName = teamNames[teamIndex]
    const teamCode = generateTeamCode()
    const teamId = generateUUID()

    const captainPseudo = `${pseudos[teamIndex * 5]}_${teamIndex + 1}`
    const captainCountry = countries[Math.floor(Math.random() * countries.length)]
    const captainId = generateUUID()

    const captain = {
      id: captainId,
      pseudo: captainPseudo,
      country: captainCountry,
      isCaptain: true,
      status: 'validated' as const,
    }

    const players = [captain]
    for (let i = 1; i < 5; i++) {
      const playerPseudo = `${pseudos[teamIndex * 5 + i]}_${teamIndex + 1}`
      const playerCountry = countries[Math.floor(Math.random() * countries.length)]
      const playerId = generateUUID()

      players.push({
        id: playerId,
        pseudo: playerPseudo,
        country: playerCountry,
        isCaptain: false,
        status: 'validated' as const,
      })
    }

    const team = {
      name: teamName,
      code: teamCode,
      captain: captain,
      players: players,
      status: 'validated' as const,
      gameMode: 'mp_5v5',
      tournamentId: TOURNAMENT_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const teamRef = doc(db, 'tournaments', TOURNAMENT_ID, 'teams', teamId)
    await setDoc(teamRef, team)

    return team
  }

  async function handleSeed() {
    if (!confirm('Voulez-vous vraiment créer 22 équipes de test dans le tournoi MJ 5v5 ?')) {
      return
    }

    setIsSeeding(true)
    setProgress(0)

    try {
      for (let i = 0; i < 22; i++) {
        await createTeam(i)
        setProgress(Math.round(((i + 1) / 22) * 100))
        // Petit délai pour éviter de surcharger Firestore
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Mettre à jour les stats du tournoi
      const tournamentRef = doc(db, 'tournaments', TOURNAMENT_ID)
      const tournamentSnap = await getDoc(tournamentRef)

      if (tournamentSnap.exists()) {
        const currentStats = tournamentSnap.data()?.stats || {}
        await updateDoc(tournamentRef, {
          stats: {
            ...currentStats,
            totalTeams: (currentStats.totalTeams || 0) + 22,
          },
          updatedAt: new Date(),
        })
      }

      toast.success('✅ 22 équipes créées avec succès ! (110 joueurs)')
      setProgress(100)
    } catch (error) {
      console.error('Erreur lors du seeding:', error)
      toast.error('❌ Erreur lors de la création des équipes')
    } finally {
      setIsSeeding(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <Database className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-purple-900">Seeder de test</h3>
      </div>
      
      <p className="text-sm text-purple-700 mb-4">
        Créer 22 équipes de test (5 joueurs chacune) dans le tournoi MJ 5v5
      </p>

      <button
        onClick={handleSeed}
        disabled={isSeeding}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isSeeding ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Création en cours... {progress}%
          </>
        ) : (
          <>
            <Database className="w-4 h-4" />
            Créer 22 équipes de test
          </>
        )}
      </button>

      {isSeeding && (
        <div className="mt-3">
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
