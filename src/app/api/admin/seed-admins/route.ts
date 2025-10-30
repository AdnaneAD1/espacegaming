import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// Liste des admins à créer
const admins = [
  { name: 'Caïd', email: 'caid@espace-gaming-codm.com' },
  { name: 'Aaron', email: 'aaron@espace-gaming-codm.com' },
  { name: 'Nimrod', email: 'nimrod@espace-gaming-codm.com' },
  { name: 'R0N', email: 'r0n@espace-gaming-codm.com' },
  { name: 'Rayane', email: 'rayane@espace-gaming-codm.com' },
  { name: 'Samuel', email: 'samuel@espace-gaming-codm.com' },
  { name: 'Sandra', email: 'sandra@espace-gaming-codm.com' },
  { name: 'Adnane', email: 'adnane@espace-gaming-codm.com' },
  { name: 'Nabil', email: 'nabil@espace-gaming-codm.com' },
  { name: 'Etienne', email: 'etienne@espace-gaming-codm.com' },
];

// Fonction pour générer le mot de passe selon le nom (sans accent, sans espace, minuscule)
function generatePassword(name: string) {
  // Retire les accents et caractères spéciaux
  const normalized = name.normalize('NFD').replace(/[^\w]/g, '').toLowerCase();
  return `${normalized}@2025!`;
}


export async function POST() {
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: { email: string; error: string }[] = [];

  for (const adminData of admins) {
    try {
      // Vérifie si l'utilisateur existe déjà
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(adminData.email);
        skipped.push(adminData.email);
        continue;
      } catch {
        // User does not exist, continue
      }
      // Crée l'utilisateur dans Firebase Auth
      userRecord = await admin.auth().createUser({
        email: adminData.email,
        password: generatePassword(adminData.name),
        displayName: `Administrateur ${adminData.name}`,
        emailVerified: true,
      });
      // Ajoute les infos d'admin dans Firestore
      await adminDb.collection('admins').doc(userRecord.uid).set({
        displayName: `Administrateur ${adminData.name}`,
        name: adminData.name,
        email: adminData.email,
        role: "super_admin",
        permissions: {
          exportData: true,
          manageSettings: true,
          manageTeams: true,
          validatePlayers: true
        },
        createdAt: new Date(),
      });
      created.push(adminData.email);
    } catch (error: unknown) {
      let message = '';
      if (error instanceof Error) {
        message = error.message;
      } else {
        message = String(error);
      }
      errors.push({ email: adminData.email, error: message });
    }
  }

  return NextResponse.json({
    created,
    skipped,
    errors,
    message: 'Seeder terminé. Change le mot de passe à la première connexion!'
  });
}
