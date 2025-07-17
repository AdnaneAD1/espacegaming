import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Team } from '@/types'
import { PDFDocument, rgb } from 'pdf-lib'
import fs from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';
import { textToPngBuffer } from '@/utils/textToImage';

// Ajoute le type Firestore Timestamp si disponible
import type { Timestamp } from 'firebase/firestore';

const formatDate = (date: Timestamp | Date | string | undefined): string => {
    if (!date) return '';
    if (date instanceof Date) return date.toLocaleDateString("fr-FR");
    // Vérifie si c'est un Timestamp Firestore
    if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as Timestamp).toDate === 'function') {
        return (date as Timestamp).toDate().toLocaleDateString("fr-FR");
    }
    return new Date(date as string).toLocaleDateString("fr-FR");
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const format = searchParams.get('format') || 'csv'

        // Récupérer toutes les équipes
        const teamsSnapshot = await adminDb.collection('teams').orderBy('createdAt', 'desc').get()
        const teams = teamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Team[]

        if (format === 'pdf') {
            // Filtrer uniquement les équipes validées
            const validatedTeams = teams.filter(team => team.status === 'validated')

            const pdfDoc = await PDFDocument.create();
            pdfDoc.registerFontkit(fontkit);
            const page = pdfDoc.addPage([800, Math.max(1120, 200 + validatedTeams.length * 120)]);
            const { height } = page.getSize();

            // Police Unicode (Noto Sans)
            const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Symbola.ttf');
            const fontBytes = fs.readFileSync(fontPath);
            const customFont = await pdfDoc.embedFont(fontBytes);

            let y = height - 60;
            // Bandeau titre sobre (en image)
            {
                const pngBuffer = textToPngBuffer('Tournoi Battle Royale CODM — Liste des équipes validées', 28, 'Noto Sans', '#181c2c', 700, 48);
                const pngImage = await pdfDoc.embedPng(pngBuffer);
                page.drawImage(pngImage, { x: 60, y: y-10, width: 700, height: 48 });
            }
            y -= 48;


            for (let idx = 0; idx < validatedTeams.length; idx++) {
                const team = validatedTeams[idx];
                // Fond très léger sous chaque équipe
                const blockHeight = 38 + (team.players?.length || 0) * 12 + 13 + 20;
                page.drawRectangle({ x: 52, y: y - blockHeight + 8, width: 370, height: blockHeight, color: rgb(0.93,0.97,1), opacity: 0.7 });
                // Titre équipe bleu clair
                // Titre équipe (en image)
                {
                    const pngBuffer = textToPngBuffer(`ÉQUIPE #${idx + 1} : ${team.name}`, 21, 'Noto Sans', '#2266b2', 540, 36);
                    const pngImage = await pdfDoc.embedPng(pngBuffer);
                    page.drawImage(pngImage, { x: 60, y: y-3, width: 540, height: 36 });
                }
                y -= 36;
                // Ligne colorée
                // Ligne colorée (on garde en vectoriel)
                page.drawLine({ start: { x: 60, y: y }, end: { x: 400, y: y }, thickness: 1.2, color: rgb(0.13,0.36,0.7) });
                y -= 12;
                // Statut/date gris-bleu
                // Statut (en image)
                {
                    const pngBuffer = textToPngBuffer('Statut : Validée', 14, 'Noto Sans', '#395478', 200, 20);
                    const pngImage = await pdfDoc.embedPng(pngBuffer);
                    page.drawImage(pngImage, { x: 72, y: y-2, width: 200, height: 20 });
                }
                y -= 20;
                // Liste des membres (capitaine en premier)
                if (team.captain) {
                    // Capitaine (en image)
                    {
                        const pngBuffer = textToPngBuffer(`★ ${team.captain.pseudo}  (${team.captain.country})`, 16, 'Noto Sans', '#13807a', 420, 22);
                        const pngImage = await pdfDoc.embedPng(pngBuffer);
                        page.drawImage(pngImage, { x: 82, y: y-2, width: 420, height: 22 });
                    }
                    y -= 22;
                }
                if (team.players && Array.isArray(team.players)) {
                    for (const player of team.players) {
                        // Ne pas dupliquer le capitaine dans la liste joueurs
                        if (team.captain && player.pseudo === team.captain.pseudo && player.country === team.captain.country) continue;
                        // Joueur (en image)
                        {
                            const pngBuffer = textToPngBuffer(`• ${player.pseudo} (${player.country})`, 13, 'Noto Sans', '#2e3550', 400, 18);
                            const pngImage = await pdfDoc.embedPng(pngBuffer);
                            page.drawImage(pngImage, { x: 88, y: y-1, width: 400, height: 18 });
                        }
                        y -= 18;
                    }
                }
                y -= 20;
            }

            // Pied de page sobre et centré
            page.drawLine({ start: { x: 250, y: 40 }, end: { x: 550, y: 40 }, thickness: 0.8, color: rgb(0.7,0.7,0.7) });
            page.drawText(`Exporté le : ${formatDate(new Date())}   —   EspaceGaming`, {
                x: 300,
                y: 22,
                size: 10,
                font: customFont,
                color: rgb(0.4, 0.4, 0.4)
            });

            const pdfBytes = await pdfDoc.save()
            return new NextResponse(Buffer.from(pdfBytes), {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename="teams_validated.pdf"'
                }
            })
        }

        if (format === 'csv') {
            // Générer CSV
            const csvHeaders = [
                'Équipe ID',
                'Nom Équipe',
                'Code Équipe',
                'Statut Équipe',
                'Date Création',
                'Capitaine Pseudo',
                'Capitaine Pays',
                'Capitaine WhatsApp',
                'Capitaine Statut',
                'Joueur Pseudo',
                'Joueur Pays',
                'Joueur WhatsApp',
                'Joueur Statut',
                'Joueur Vidéo',
                'Date Rejointe'
            ]

            const csvRows = []
            csvRows.push(csvHeaders.join(','))

            teams.forEach(team => {
                // Ligne pour le capitaine
                csvRows.push([
                    team.id,
                    `"${team.name}"`,
                    team.code,
                    team.status,
                    formatDate(team.createdAt),
                    `"${team.captain.pseudo}"`,
                    team.captain.country,
                    team.captain.whatsapp,
                    team.captain.status,
                    '', // Pas de données joueur pour le capitaine
                    '',
                    '',
                    '',
                    team.captain.deviceCheckVideo || '',
                    formatDate(team.captain.joinedAt)
                ].join(','))

                // Lignes pour les autres joueurs
                team.players.forEach(player => {
                    if (player.id !== team.captain.id) {
                        csvRows.push([
                            team.id,
                            `"${team.name}"`,
                            team.code,
                            team.status,
                            formatDate(team.createdAt),
                            '', // Pas de données capitaine pour les joueurs
                            '',
                            '',
                            '',
                            `"${player.pseudo}"`,
                            player.country,
                            player.whatsapp,
                            player.status,
                            player.deviceCheckVideo || '',
                            formatDate(player.joinedAt)
                        ].join(','))
                    }
                })
            })

            const csvContent = csvRows.join('\n')

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="tournoi-codm-${new Date().toISOString().split('T')[0]}.csv"`
                }
            })
        }

        if (format === 'json') {
            // Export JSON détaillé
            const exportData = {
                exportDate: new Date().toISOString(),
                tournament: {
                    name: 'Tournoi Battle Royale CODM',
                    totalTeams: teams.length,
                    validatedTeams: teams.filter(t => t.status === 'validated').length,
                    totalPlayers: teams.reduce((acc, team) => acc + team.players.length, 0)
                },
                teams: teams.map(team => ({
                    id: team.id,
                    name: team.name,
                    code: team.code,
                    status: team.status,
                    createdAt: formatDate(team.createdAt),
                    updatedAt: formatDate(team.updatedAt),
                    captain: {
                        id: team.captain.id,
                        pseudo: team.captain.pseudo,
                        country: team.captain.country,
                        whatsapp: team.captain.whatsapp,
                        status: team.captain.status,
                        deviceCheckVideo: team.captain.deviceCheckVideo,
                        joinedAt: formatDate(team.captain.joinedAt)
                    },
                    players: team.players.map(player => ({
                        id: player.id,
                        pseudo: player.pseudo,
                        country: player.country,
                        whatsapp: player.whatsapp,
                        status: player.status,
                        deviceCheckVideo: player.deviceCheckVideo,
                        joinedAt: formatDate(player.joinedAt),
                        validatedAt: formatDate(player.validatedAt),
                        rejectedAt: formatDate(player.rejectedAt),
                        rejectionReason: player.rejectionReason
                    }))
                }))
            }

            return NextResponse.json(exportData, {
                headers: {
                    'Content-Disposition': `attachment; filename="tournoi-codm-${new Date().toISOString().split('T')[0]}.json"`
                }
            })
        }

        return NextResponse.json({ error: 'Format non supporté' }, { status: 400 })

    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        // Ajoute le message d'erreur détaillé en dev
        const isDev = process.env.NODE_ENV !== 'production';
        return NextResponse.json(
            isDev
                ? { error: 'Erreur lors de l\'export des données', details: error instanceof Error ? error.message : String(error) }
                : { error: 'Erreur lors de l\'export des données' },
            { status: 500 }
        );
    }
}

