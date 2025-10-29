// Script de seeding côté client pour 22 équipes MJ 5v5
// À exécuter dans la console du navigateur sur la page admin

import { collection, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

const TOURNAMENT_ID = 'onGCUWcYD6ajkMoCeafO';

const teamNames = [
  'Les Guerriers', 'Team Alpha', 'Les Titans', 'Phoenix Squad', 'Les Légendes',
  'Team Vortex', 'Les Champions', 'Elite Force', 'Les Invincibles', 'Team Nexus',
  'Les Gladiateurs', 'Storm Riders', 'Les Prédateurs', 'Team Omega', 'Les Spartans',
  'Night Hawks', 'Les Conquérants', 'Team Fury', 'Les Dominateurs', 'Shadow Legion',
  'Les Immortels', 'Team Velocity'
];

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
];

const countries = [
  'Maroc', 'France', 'Algérie', 'Tunisie', 'Belgique',
  'Suisse', 'Canada', 'Égypte', 'Sénégal', 'Côte d\'Ivoire'
];

function generateTeamCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function createTeam(teamIndex: number) {
  const teamName = teamNames[teamIndex];
  const teamCode = generateTeamCode();
  const teamId = uuidv4();

  const captainPseudo = `${pseudos[teamIndex * 5]}_${teamIndex + 1}`;
  const captainCountry = countries[Math.floor(Math.random() * countries.length)];
  const captainId = uuidv4();

  const captain = {
    id: captainId,
    pseudo: captainPseudo,
    country: captainCountry,
    isCaptain: true,
    status: 'validated' as const,
  };

  const players = [captain];
  for (let i = 1; i < 5; i++) {
    const playerPseudo = `${pseudos[teamIndex * 5 + i]}_${teamIndex + 1}`;
    const playerCountry = countries[Math.floor(Math.random() * countries.length)];
    const playerId = uuidv4();

    players.push({
      id: playerId,
      pseudo: playerPseudo,
      country: playerCountry,
      isCaptain: false,
      status: 'validated' as const,
    });
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
  };

  const teamRef = doc(db, 'tournaments', TOURNAMENT_ID, 'teams', teamId);
  await setDoc(teamRef, team);

  console.log(`✅ Équipe ${teamIndex + 1}/22: ${teamName} (${teamCode})`);
  return team;
}

export async function seedMPTeams() {
  console.log('🚀 Début du seeding des équipes MJ 5v5...');
  console.log(`📍 Tournoi ID: ${TOURNAMENT_ID}`);
  console.log('');

  try {
    for (let i = 0; i < 22; i++) {
      await createTeam(i);
      // Petit délai pour éviter de surcharger Firestore
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('');
    console.log('✅ Seeding terminé !');
    console.log(`📊 22 équipes créées (110 joueurs)`);

    // Mettre à jour les stats du tournoi
    const tournamentRef = doc(db, 'tournaments', TOURNAMENT_ID);
    const tournamentSnap = await getDoc(tournamentRef);

    if (tournamentSnap.exists()) {
      const currentStats = tournamentSnap.data()?.stats || {};
      await updateDoc(tournamentRef, {
        stats: {
          ...currentStats,
          totalTeams: (currentStats.totalTeams || 0) + 22,
        },
        updatedAt: new Date(),
      });
      console.log('📈 Statistiques mises à jour');
    }

    return { success: true, teamsCreated: 22 };
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}
