import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Tournament } from '@/types/tournament-multi';

// Fonction pour récupérer le tournoi actif
async function getActiveTournament(): Promise<Tournament | null> {
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
    } as Tournament;
}

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

        // Récupérer le tournoi actif
        const activeTournament = await getActiveTournament();
        
        if (!activeTournament) {
            return NextResponse.json(
                { error: 'Aucun tournoi actif disponible' },
                { status: 400 }
            );
        }

        // Vérifier si les inscriptions sont ouvertes (deadline_register)
        if (activeTournament.deadline_register) {
            const now = new Date();
            const deadline = new Date(activeTournament.deadline_register);
            
            if (now > deadline) {
                return NextResponse.json(
                    { error: 'Les inscriptions sont fermées pour ce tournoi' },
                    { status: 403 }
                );
            }
        }

        // Rechercher l'équipe par code dans le tournoi actif
        const teamSnapshot = await adminDb
            .collection('tournaments')
            .doc(activeTournament.id)
            .collection('teams')
            .where('code', '==', code.toUpperCase())
            .limit(1)
            .get();

        if (teamSnapshot.empty) {
            return NextResponse.json(
                { error: 'Équipe introuvable dans ce tournoi' },
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
            tournamentId: activeTournament.id,
            tournamentName: activeTournament.name
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
