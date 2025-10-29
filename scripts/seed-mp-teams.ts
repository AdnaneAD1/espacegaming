import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Configuration Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// ID du tournoi MJ 5v5
const TOURNAMENT_ID = 'onGCUWcYD6ajkMoCeafO';

// Liste de noms d'équipes
const teamNames = [
  'Les Guerriers', 'Team Alpha', 'Les Titans', 'Phoenix Squad', 'Les Légendes',
  'Team Vortex', 'Les Champions', 'Elite Force', 'Les Invincibles', 'Team Nexus',
  'Les Gladiateurs', 'Storm Riders', 'Les Prédateurs', 'Team Omega', 'Les Spartans',
  'Night Hawks', 'Les Conquérants', 'Team Fury', 'Les Dominateurs', 'Shadow Legion',
  'Les Immortels', 'Team Velocity'
];

// Liste de pseudos
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

// Liste de pays
const countries = [
  'Maroc', 'France', 'Algérie', 'Tunisie', 'Belgique',
  'Suisse', 'Canada', 'Égypte', 'Sénégal', 'Côte d\'Ivoire'
];

// Fonction pour générer un code unique
function generateTeamCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Fonction pour créer une équipe
async function createTeam(teamIndex: number) {
  const teamName = teamNames[teamIndex];
  const teamCode = generateTeamCode();
  const teamId = uuidv4();

  // Créer le capitaine
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

  // Créer les 4 coéquipiers
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

  // Créer l'équipe
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

  // Sauvegarder dans Firestore
  await db.collection('tournaments').doc(TOURNAMENT_ID).collection('teams').doc(teamId).set(team);

  console.log(`✅ Équipe ${teamIndex + 1}/22 créée: ${teamName} (${teamCode})`);
  return team;
}

// Fonction principale
async function seedTeams() {
  console.log('🚀 Début du seeding des équipes MJ 5v5...');
  console.log(`📍 Tournoi ID: ${TOURNAMENT_ID}`);
  console.log('');

  try {
    // Créer les 22 équipes
    for (let i = 0; i < 22; i++) {
      await createTeam(i);
    }

    console.log('');
    console.log('✅ Seeding terminé avec succès !');
    console.log(`📊 22 équipes créées (110 joueurs au total)`);
    
    // Mettre à jour les statistiques du tournoi
    const tournamentRef = db.collection('tournaments').doc(TOURNAMENT_ID);
    const tournamentDoc = await tournamentRef.get();
    
    if (tournamentDoc.exists) {
      const currentStats = tournamentDoc.data()?.stats || {};
      await tournamentRef.update({
        stats: {
          ...currentStats,
          totalTeams: (currentStats.totalTeams || 0) + 22,
        },
        updatedAt: new Date(),
      });
      console.log('📈 Statistiques du tournoi mises à jour');
    }

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  }
}

// Exécuter le seeding
seedTeams()
  .then(() => {
    console.log('✨ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
