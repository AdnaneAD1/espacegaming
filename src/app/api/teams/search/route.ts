import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { error: 'Code d\'équipe requis' },
                { status: 400 }
            );
        }

        if (code.length !== 6) {
            return NextResponse.json(
                { error: 'Le code d\'équipe doit contenir 6 caractères' },
                { status: 400 }
            );
        }

        // Rechercher l'équipe par code
        const teamSnapshot = await adminDb
            .collection('teams')
            .where('code', '==', code.toUpperCase())
            .limit(1)
            .get();

        if (teamSnapshot.empty) {
            return NextResponse.json(
                { error: 'Équipe introuvable' },
                { status: 404 }
            );
        }

        const teamDoc = teamSnapshot.docs[0];
        const teamData = teamDoc.data();

        // Retourner les informations de l'équipe (sans données sensibles)
        const teamInfo = {
            id: teamDoc.id,
            name: teamData.name,
            code: teamData.code,
            captain: {
                pseudo: teamData.captain.pseudo,
                country: teamData.captain.country,
            },
            players: teamData.players || [],
            status: teamData.status,
            createdAt: teamData.createdAt,
        };

        return NextResponse.json(teamInfo);

    } catch (error) {
        console.error('Erreur lors de la recherche d\'équipe:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
