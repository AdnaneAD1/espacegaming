import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function DELETE(request: NextRequest) {
    try {
        const { teamId, tournamentId } = await request.json();

        if (!teamId) {
            return NextResponse.json(
                { error: 'ID d\'équipe requis' },
                { status: 400 }
            );
        }

        // Supprimer l'équipe selon le système (ancien ou nouveau)
        if (tournamentId && tournamentId !== 'all') {
            // Nouveau système : supprimer de la sous-collection du tournoi
            await adminDb
                .collection('tournaments')
                .doc(tournamentId)
                .collection('teams')
                .doc(teamId)
                .delete();
        } else {
            // Ancien système : supprimer de la collection teams
            await adminDb.collection('teams').doc(teamId).delete();
        }

        // Mettre à jour les statistiques uniquement pour l'ancien système
        if (!tournamentId || tournamentId === 'all') {
            const teamsSnapshot = await adminDb.collection('teams').get();
            const totalPlayers = teamsSnapshot.docs.reduce((total: number, doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                const team = doc.data();
                return total + (team.players?.length || 0);
            }, 0);

            await adminDb.collection('stats').doc('tournament').set({
                totalTeams: teamsSnapshot.size,
                totalPlayers,
                lastUpdated: new Date(),
            }, { merge: true });
        }

        return NextResponse.json({
            success: true,
            message: 'Équipe supprimée avec succès',
        });

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Erreur lors de la suppression de l\'équipe:', error.message);
        } else {
            console.error('Erreur lors de la suppression de l\'équipe:', String(error));
        }
        return NextResponse.json(
            { error: 'Erreur lors de la suppression de l\'équipe' },
            { status: 500 }
        );
    }
}
