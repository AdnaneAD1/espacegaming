import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { teamRegistrationSchema } from '@/lib/validations';
import { generateTeamCode } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validation des données
        const validatedData = teamRegistrationSchema.parse(body);

        // Vérifier que le même pseudo n'est pas déjà inscrit dans une autre équipe
        const allPseudos = [
            validatedData.captain.pseudo,
            ...(validatedData.players || []).map((p: { pseudo: string }) => p.pseudo)
        ].map(p => p.trim().toLowerCase());

        // Récupérer toutes les équipes
        const teamsSnapshot = await adminDb.collection('teams').get();
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
                { error: `Le pseudo "${duplicatePseudo}" est déjà inscrit dans une autre équipe.` },
                { status: 400 }
            );
        }

        // Vérifier le nombre d'équipes existantes
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
        const maxTeams = parseInt(process.env.NEXT_PUBLIC_MAX_TEAMS || '50');

        if (filteredTeams.length >= maxTeams) {
            return NextResponse.json(
                { error: 'Le nombre maximum d\'équipes a été atteint' },
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

        // Vérifier l'unicité du nom d'équipe
        const existingTeamSnapshot = await adminDb
            .collection('teams')
            .where('name', '==', validatedData.teamName)
            .get();

        if (!existingTeamSnapshot.empty) {
            return NextResponse.json(
                { error: 'Ce nom d\'équipe est déjà pris' },
                { status: 400 }
            );
        }

        // Générer un code d'équipe unique
        let teamCode: string;
        let codeExists = true;
        let attempts = 0;

        while (codeExists && attempts < 10) {
            teamCode = generateTeamCode();
            const codeSnapshot = await adminDb
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

        // Toutes les données de l'équipe
        const teamData = {
            id: teamId,
            name: validatedData.teamName,
            code: teamCode!,
            captain,
            players: [captain, ...players],
            status: players.length === 3 ? 'complete' : 'incomplete', // 4 joueurs au total (capitaine + 3)
            createdAt: now,
            updatedAt: now,
        };

        // Sauvegarder dans Firestore
        await adminDb.collection('teams').doc(teamId).set(teamData);

        // Mettre à jour les statistiques
        const statsDoc = adminDb.collection('stats').doc('tournament');
        await statsDoc.set({
            totalTeams: teamsSnapshot.size + 1,
            totalPlayers: (settings?.totalPlayers || 0) + teamData.players.length,
            lastUpdated: now,
        }, { merge: true });

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
