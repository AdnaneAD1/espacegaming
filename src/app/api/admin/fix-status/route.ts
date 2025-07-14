import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST() {
    try {
        console.log('🔧 Correction des statuts d\'équipes...');

        const teamsSnapshot = await adminDb.collection('teams').get();
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
            console.log(`✅ ${fixedCount} équipe(s) corrigée(s) avec succès !`);

            return NextResponse.json({
                success: true,
                message: `${fixedCount} équipe(s) corrigée(s) avec succès`,
                fixes: fixes
            });
        } else {
            console.log('✅ Aucune correction nécessaire, tous les statuts sont corrects.');

            return NextResponse.json({
                success: true,
                message: 'Aucune correction nécessaire, tous les statuts sont corrects.',
                fixes: []
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
