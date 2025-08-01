import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Fonction pour récupérer le tournoi actif
async function getActiveTournament() {
    const tournamentsSnapshot = await adminDb
        .collection('tournaments')
        .where('status', '==', 'active')
        .limit(1)
        .get();

    if (tournamentsSnapshot.empty) {
        return null;
    }

    const tournamentDoc = tournamentsSnapshot.docs[0];
    return {
        id: tournamentDoc.id,
        ...tournamentDoc.data()
    };
}

export async function POST() {
    try {
        console.log('🔧 Correction des statuts d\'équipes...');

        // Récupérer le tournoi actif
        const activeTournament = await getActiveTournament();
        
        if (!activeTournament) {
            console.log('❌ Aucun tournoi actif trouvé');
            return NextResponse.json(
                { error: 'Aucun tournoi actif disponible pour la correction des statuts' },
                { status: 400 }
            );
        }

        console.log(`🎯 Correction des statuts pour le tournoi actif: ${activeTournament.id}`);

        // Récupérer les équipes du tournoi actif
        const teamsSnapshot = await adminDb
            .collection('tournaments')
            .doc(activeTournament.id)
            .collection('teams')
            .get();

        const batch = adminDb.batch();
        let fixedCount = 0;
        const fixes: string[] = [];

        teamsSnapshot.docs.forEach(doc => {
            const team = doc.data();
            const players = team.players || [];
            const totalPlayers = players.length;
            const validatedPlayers = players.filter((p: { status: string }) => p.status === 'validated').length;

            let correctStatus: string;

            if (validatedPlayers >= 3) {
                correctStatus = 'validated';
            } else if (totalPlayers === 4) {
                correctStatus = 'complete';
            } else {
                correctStatus = 'incomplete';
            }

            if (team.status !== correctStatus) {
                const message = `Équipe "${team.name}" (${totalPlayers}/4 joueurs, ${validatedPlayers} validés): ${team.status} → ${correctStatus}`;
                console.log(`📝 ${message}`);
                fixes.push(message);

                batch.update(doc.ref, {
                    status: correctStatus,
                    updatedAt: new Date()
                });
                fixedCount++;
            }
        });

        if (fixedCount > 0) {
            await batch.commit();
            console.log(`✅ ${fixedCount} équipe(s) corrigée(s) avec succès dans le tournoi "${activeTournament.id}" !`);

            return NextResponse.json({
                success: true,
                message: `${fixedCount} équipe(s) corrigée(s) avec succès dans le tournoi "${activeTournament.id}"`,
                fixes: fixes,
                tournamentId: activeTournament.id
            });
        } else {
            console.log(`✅ Aucune correction nécessaire dans le tournoi "${activeTournament.id}", tous les statuts sont corrects.`);

            return NextResponse.json({
                success: true,
                message: `Aucune correction nécessaire dans le tournoi "${activeTournament.id}", tous les statuts sont corrects.`,
                fixes: [],
                tournamentId: activeTournament.id
            });
        }

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('❌ Erreur lors de la correction:', error.message);
        } else {
            console.error('❌ Erreur lors de la correction:', error);
        }

        return NextResponse.json(
            { error: 'Erreur lors de la correction des statuts' },
            { status: 500 }
        );
    }
}
