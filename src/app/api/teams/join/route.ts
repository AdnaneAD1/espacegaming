import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { joinTeamSchema } from '@/lib/validations';
import { v4 as uuidv4 } from 'uuid';
import { GameMode, GameModeUtils } from '@/types/game-modes';
import { TournamentService } from '@/services/tournamentService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validation des données
        const validatedData = joinTeamSchema.parse(body);

        // Déterminer le type de tournoi (BR par défaut pour compatibilité)
        const tournamentType: 'br' | 'mp' = body.tournamentType || 'br';

        // Charger le tournoi actif selon le type
        const activeTournament = tournamentType === 'br'
            ? await TournamentService.getActiveBRTournament()
            : await TournamentService.getActiveMPTournament();
        if (!activeTournament) {
            return NextResponse.json(
                { error: 'Aucun tournoi actif disponible pour rejoindre une équipe' },
                { status: 400 }
            );
        }

        // Vérifier si les inscriptions sont encore ouvertes
        if (activeTournament.deadline_register) {
            const now = new Date();
            const deadline = new Date(activeTournament.deadline_register);
            if (now > deadline) {
                return NextResponse.json(
                    { error: 'Les inscriptions sont fermées pour ce tournoi' },
                    { status: 400 }
                );
            }
        }

        // Rechercher l'équipe dans le tournoi actif
        const teamSnapshot = await adminDb
            .collection('tournaments')
            .doc(activeTournament.id)
            .collection('teams')
            .where('code', '==', validatedData.teamCode.toUpperCase())
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

        // Vérifier la taille d'équipe requise selon le mode de jeu
        const tournamentGameMode = activeTournament.gameMode || GameMode.BR_SQUAD;
        const requiredTeamSize = GameModeUtils.getTeamSize(tournamentGameMode);
        // Le capitaine est déjà inclus dans players (premier élément), donc pas besoin d'ajouter +1
        const currentTeamSize = teamData.players?.length || 0;

        // Vérifier si l'équipe est complète
        if (currentTeamSize >= requiredTeamSize) {
            return NextResponse.json(
                { error: `Cette équipe est déjà complète (${currentTeamSize}/${requiredTeamSize} joueurs)` },
                { status: 400 }
            );
        }

        // Types
interface Player {
    id: string;
    pseudo: string;
    country: string;
    whatsapp: string;
    deviceCheckVideo: string;
    status: string;
    joinedAt: Date;
    isCaptain: boolean;
}

        // Vérifier si le pseudo n'est pas déjà pris dans cette équipe
        const existingPlayer = teamData.players?.find(
            (player: Player) => player.pseudo.trim().toLowerCase() === validatedData.player.pseudo.trim().toLowerCase()
        );
        
        if (existingPlayer) {
            return NextResponse.json(
                { error: 'Ce pseudo est déjà utilisé dans cette équipe' },
                { status: 400 }
            );
        }

        // Vérifier si le joueur n'est pas déjà dans une autre équipe du tournoi actif
        const allTeamsSnapshot = await adminDb
            .collection('tournaments')
            .doc(activeTournament.id)
            .collection('teams')
            .get();
        let playerInOtherTeam = false;

        allTeamsSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            if (data.players) {
                const found = data.players.find((player: Player) =>
                    player.pseudo.trim().toLowerCase() === validatedData.player.pseudo.trim().toLowerCase()
                );
                if (found && doc.id !== teamDoc.id) {
                    playerInOtherTeam = true;
                }
            }
        });

        if (playerInOtherTeam) {
            return NextResponse.json(
                { error: 'Ce joueur est déjà inscrit dans une autre équipe de ce tournoi' },
                { status: 400 }
            );
        }

        // Créer le nouveau joueur
        const newPlayer = {
            id: uuidv4(),
            pseudo: validatedData.player.pseudo,
            country: validatedData.player.country,
            whatsapp: validatedData.player.whatsapp,
            deviceCheckVideo: body.player.deviceCheckVideo || '',
            status: 'pending',
            joinedAt: new Date(),
            isCaptain: false,
        };

        // Mettre à jour l'équipe
        const updatedPlayers = [...(teamData.players || []), newPlayer];
        const newStatus = updatedPlayers.length === 4 ? 'complete' : 'incomplete'; // Exactement 4 joueurs

        await teamDoc.ref.update({
            players: updatedPlayers,
            status: newStatus,
            updatedAt: new Date(),
        });

        // Les statistiques sont maintenant calculées dynamiquement, pas besoin de les mettre à jour

        return NextResponse.json({
            success: true,
            message: 'Joueur ajouté à l\'équipe avec succès',
            teamId: teamDoc.id,
            playerId: newPlayer.id,
        });

    } catch (error) {
        console.error('Erreur lors de l\'ajout à l\'équipe:', error);

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Données invalides', details: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
