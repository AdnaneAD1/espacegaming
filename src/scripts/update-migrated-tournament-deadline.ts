import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Script pour mettre à jour la deadline d'inscription d'un tournoi migré
 * Utilisé après migration de données pour définir une nouvelle date limite
 */

interface UpdateDeadlineOptions {
  tournamentId: string;
  deadline: Date;
}

/**
 * Met à jour la deadline d'inscription pour un tournoi spécifique
 */
async function updateDeadlineRegister(options: UpdateDeadlineOptions): Promise<void> {
  const { tournamentId, deadline } = options;
  
  try {
    // Vérifier que le tournoi existe
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) {
      throw new Error(`Tournoi avec l'ID ${tournamentId} introuvable`);
    }

    // Mettre à jour la deadline d'inscription
    await updateDoc(tournamentRef, {
      deadline_register: deadline,
      updatedAt: serverTimestamp()
    });

    console.log(`✅ Deadline d'inscription mise à jour pour le tournoi ${tournamentId}`);
    console.log(`📅 Nouvelle deadline: ${deadline.toLocaleString('fr-FR')}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la deadline:', error);
    throw error;
  }
}

/**
 * Script principal d'exécution
 * Exemple d'utilisation pour mettre à jour la deadline d'un tournoi migré
 */
async function main() {
  try {
    // Exemple: mettre à jour la deadline pour un tournoi migré
    // Remplacez 'TOURNAMENT_ID' par l'ID réel du tournoi
    const tournamentId = process.env.TOURNAMENT_ID || 'TOURNAMENT_ID_HERE';
    
    // Définir une nouvelle deadline (par exemple, dans 7 jours)
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 7);
    
    await updateDeadlineRegister({
      tournamentId,
      deadline: newDeadline
    });
    
    console.log('🎉 Script terminé avec succès');
    
  } catch (error) {
    console.error('💥 Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  }
}

// Exporter les fonctions pour utilisation dans d'autres modules
export { updateDeadlineRegister };

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}
