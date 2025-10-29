import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getTeamRegistrationSchema } from '@/lib/validations';
import { generateTeamCode } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { GameMode, GameModeUtils } from '@/types/game-modes';
import { TournamentService } from '@/services/tournamentService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Déterminer le type de tournoi (BR par défaut pour compatibilité)
        const tournamentType: 'br' | 'mp' = body.tournamentType || 'br';

        // Charger le tournoi actif selon le type
        const activeTournament = tournamentType === 'br'
            ? await TournamentService.getActiveBRTournament()
            : await TournamentService.getActiveMPTournament();
        if (!activeTournament) {
            return NextResponse.json(
                { error: 'Aucun tournoi actif disponible pour l\'inscription' },
                { status: 400 }
            );
        }

        // Obtenir la taille d'équipe du tournoi actif
        const teamSize = GameModeUtils.getTeamSize(activeTournament.gameMode);

        // Validation des données avec le schéma dynamique
        const validatedData = getTeamRegistrationSchema(teamSize).parse(body);

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

        // Vérifier que le même pseudo n'est pas déjà inscrit dans le tournoi actif
        const allPseudos = [
            validatedData.captain.pseudo,
            ...(validatedData.players || []).map((p: { pseudo: string }) => p.pseudo)
        ].map(p => p.trim().toLowerCase());

        // Récupérer les équipes du tournoi actif
        const teamsSnapshot = await adminDb
            .collection('tournaments')
            .doc(activeTournament.id)
            .collection('teams')
            .get();
        
        let duplicatePseudo = null;
        teamsSnapshot.forEach(doc => {
            const team = doc.data();
            const teamPlayers = [
                team.captain?.pseudo,
                ...(team.players || []).map((p: { pseudo: string }) => p.pseudo)
            ].map((p: string) => p?.trim().toLowerCase());
            for (const pseudo of allPseudos) {
                if (teamPlayers.includes(pseudo)) {
                    duplicatePseudo = pseudo;
                }
            }
        });
        if (duplicatePseudo) {
            return NextResponse.json(
                { error: `Le pseudo "${duplicatePseudo}" est déjà inscrit dans ce tournoi.` },
                { status: 400 }
            );
        }

        // Vérifier la compatibilité avec le mode de jeu du tournoi
        const tournamentGameMode = activeTournament.gameMode || GameMode.BR_SQUAD; // Fallback pour les anciens tournois
        const requiredTeamSize = GameModeUtils.getTeamSize(tournamentGameMode);
        
        // Valider la taille de l'équipe selon le mode de jeu
        const totalPlayers = 1 + (validatedData.players || []).length; // Capitaine + joueurs
        
        // Vérifier que l'équipe ne dépasse pas la taille maximale
        if (totalPlayers > requiredTeamSize) {
            return NextResponse.json(
                { 
                    error: `Ce tournoi ${GameModeUtils.getDisplayName(tournamentGameMode)} accepte maximum ${requiredTeamSize} joueur(s). Vous avez fourni ${totalPlayers} joueur(s).` 
                },
                { status: 400 }
            );
        }
        
        // Note: Les équipes peuvent être incomplètes à l'inscription, d'autres joueurs peuvent rejoindre via /api/teams/join

        // Vérifier le nombre d'équipes existantes dans le tournoi actif
        const filteredTeams = [];
        teamsSnapshot.forEach(doc => {
            const team = doc.data();
            if (
                team.status === "validated" ||
                team.status === "incomplete" ||
                team.status === "complete"
            ) {
                filteredTeams.push(team);
            }
        });
        const maxTeams = activeTournament.settings?.maxTeams || parseInt(process.env.NEXT_PUBLIC_MAX_TEAMS || '50');

        if (filteredTeams.length >= maxTeams) {
            return NextResponse.json(
                { error: 'Le nombre maximum d\'équipes a été atteint pour ce tournoi' },
                { status: 400 }
            );
        }

        // Vérifier les inscriptions ouvertes
        const settingsDoc = await adminDb.collection('settings').doc('tournament').get();
        const settings = settingsDoc.data();

        if (settings?.registrationStatus === 'closed') {
            return NextResponse.json(
                { error: 'Les inscriptions sont fermées' },
                { status: 400 }
            );
        }

        // Vérifier l'unicité du nom d'équipe dans le tournoi actif (sauf en Solo)
        // En Solo, le nom d'équipe = pseudo du joueur, déjà vérifié pour unicité ci-dessus
        if (requiredTeamSize > 1 && validatedData.teamName) {
            const existingTeamSnapshot = await adminDb
                .collection('tournaments')
                .doc(activeTournament.id)
                .collection('teams')
                .where('name', '==', validatedData.teamName)
                .get();

            if (!existingTeamSnapshot.empty) {
                return NextResponse.json(
                    { error: 'Ce nom d\'équipe est déjà pris dans ce tournoi' },
                    { status: 400 }
                );
            }
        }

        // Générer un code d'équipe unique dans le tournoi actif
        let teamCode: string;
        let codeExists = true;
        let attempts = 0;

        while (codeExists && attempts < 10) {
            teamCode = generateTeamCode();
            const codeSnapshot = await adminDb
                .collection('tournaments')
                .doc(activeTournament.id)
                .collection('teams')
                .where('code', '==', teamCode)
                .get();
            codeExists = !codeSnapshot.empty;
            attempts++;
        }

        if (codeExists) {
            return NextResponse.json(
                { error: 'Erreur lors de la génération du code d\'équipe' },
                { status: 500 }
            );
        }

        // Créer l'équipe
        const teamId = uuidv4();
        const now = new Date();

        // Préparer les données du capitaine
        const captain = {
            id: uuidv4(),
            pseudo: validatedData.captain.pseudo,
            country: validatedData.captain.country,
            whatsapp: validatedData.captain.whatsapp,
            deviceCheckVideo: validatedData.captain.deviceCheckVideo,
            status: 'pending',
            joinedAt: now,
            isCaptain: true,
        };

        // Préparer les données des joueurs additionnels
        const players = validatedData.players.map((player) => ({
            id: uuidv4(),
            pseudo: player.pseudo,
            country: player.country,
            whatsapp: player.whatsapp,
            deviceCheckVideo: player.deviceCheckVideo,
            status: 'pending',
            joinedAt: now,
            isCaptain: false,
        }));

        // Déterminer le statut selon le mode de jeu
        const totalPlayersInTeam = 1 + players.length; // Capitaine + joueurs additionnels
        const isTeamComplete = totalPlayersInTeam === requiredTeamSize;
        
        // En mode Solo, utiliser le pseudo du joueur comme nom d'équipe
        const teamName = requiredTeamSize === 1 
            ? validatedData.captain.pseudo 
            : validatedData.teamName;
        
        // Toutes les données de l'équipe
        const teamData = {
            id: teamId,
            tournamentId: activeTournament.id,
            gameMode: tournamentGameMode,
            name: teamName,
            code: teamCode!,
            captain,
            players: [captain, ...players],
            status: isTeamComplete ? 'complete' : 'incomplete',
            createdAt: now,
            updatedAt: now,
        };

        // Sauvegarder dans le tournoi actif
        await adminDb
            .collection('tournaments')
            .doc(activeTournament.id)
            .collection('teams')
            .doc(teamId)
            .set(teamData);

        // Les statistiques sont maintenant calculées dynamiquement, pas besoin de les mettre à jour

        return NextResponse.json({
            success: true,
            teamId,
            teamCode: teamCode!,
            message: 'Équipe créée avec succès',
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);

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
