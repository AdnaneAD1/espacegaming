import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Tournament } from '@/types/tournament-multi';

// Fonction pour récupérer tous les tournois actifs
async function getActiveTournaments(): Promise<Tournament[]> {
    const tournamentsSnapshot = await adminDb
        .collection('tournaments')
        .where('status', '==', 'active')
        .get();

    if (tournamentsSnapshot.empty) {
        return [];
    }

    return tournamentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Tournament));
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

        // Récupérer tous les tournois actifs
        const activeTournaments = await getActiveTournaments();
        
        if (activeTournaments.length === 0) {
            return NextResponse.json(
                { error: 'Aucun tournoi actif disponible' },
                { status: 400 }
            );
        }

        // Chercher l'équipe dans tous les tournois actifs
        let foundTeam = null;
        let foundTournament = null;

        for (const tournament of activeTournaments) {
            const teamSnapshot = await adminDb
                .collection('tournaments')
                .doc(tournament.id)
                .collection('teams')
                .where('code', '==', code.toUpperCase())
                .limit(1)
                .get();

            if (!teamSnapshot.empty) {
                foundTeam = teamSnapshot.docs[0];
                foundTournament = tournament;
                break;
            }
        }

        if (!foundTeam || !foundTournament) {
            return NextResponse.json(
                { error: 'Équipe introuvable dans les tournois actifs' },
                { status: 404 }
            );
        }

        // Vérifier si les inscriptions sont ouvertes pour ce tournoi
        if (foundTournament.deadline_register) {
            const now = new Date();
            const deadline = new Date(foundTournament.deadline_register);
            
            if (now > deadline) {
                return NextResponse.json(
                    { error: 'Les inscriptions sont fermées pour ce tournoi' },
                    { status: 403 }
                );
            }
        }

        const teamData = foundTeam.data();

        // Retourner les informations de l'équipe (sans données sensibles)
        const teamInfo = {
            id: foundTeam.id,
            name: teamData.name,
            code: teamData.code,
            captain: {
                pseudo: teamData.captain.pseudo,
                country: teamData.captain.country,
            },
            players: teamData.players || [],
            status: teamData.status,
            createdAt: teamData.createdAt,
            tournamentId: foundTournament.id,
            tournamentName: foundTournament.name,
            gameMode: foundTournament.gameMode // Ajouter le mode de jeu pour déterminer la taille d'équipe
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
