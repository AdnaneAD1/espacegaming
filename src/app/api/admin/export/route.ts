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
        const tournamentId = searchParams.get('tournament')

        let teams: Team[] = []
        let tournamentName = 'Tournoi Battle Royale CODM'

        if (tournamentId && tournamentId !== 'all') {
            // Charger les équipes d'un tournoi spécifique
            const tournamentDoc = await adminDb.collection('tournaments').doc(tournamentId).get()
            if (!tournamentDoc.exists) {
                return NextResponse.json({ error: 'Tournoi non trouvé' }, { status: 404 })
            }
            
            const tournamentData = tournamentDoc.data()
            tournamentName = tournamentData?.name || 'Tournoi'
            
            const teamsSnapshot = await adminDb
                .collection('tournaments')
                .doc(tournamentId)
                .collection('teams')
                .orderBy('createdAt', 'desc')
                .get()
            
            teams = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Team[]
        } else {
            // Charger toutes les équipes (ancien système)
            const teamsSnapshot = await adminDb.collection('teams').orderBy('createdAt', 'desc').get()
            teams = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Team[]
            
            if (tournamentId !== 'all') {
                tournamentName = 'Toutes les données (ancien système)'
            }
        }

        if (format === 'pdf') {
            // Filtrer uniquement les équipes validées
            const validatedTeams = teams.filter(team => team.status === 'validated')

            const pdfDoc = await PDFDocument.create();
            pdfDoc.registerFontkit(fontkit);
            
            // Constantes pour la gestion des pages
            const PAGE_WIDTH = 800;
            const PAGE_HEIGHT = 1120;
            const MARGIN_TOP = 60;
            const MARGIN_BOTTOM = 80;
            const HEADER_HEIGHT = 48;
            
            let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            let currentY = PAGE_HEIGHT - MARGIN_TOP;
            let pageCount = 1;

            // Police Unicode (Noto Sans)
            const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Symbola.ttf');
            const fontBytes = fs.readFileSync(fontPath);
            const customFont = await pdfDoc.embedFont(fontBytes);

            // Fonction pour ajouter une nouvelle page
            const addNewPage = async () => {
                currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                currentY = PAGE_HEIGHT - MARGIN_TOP;
                pageCount++;
                
                // Ajouter le titre sur chaque nouvelle page
                const pngBuffer = textToPngBuffer(`${tournamentName} — Liste des équipes validées`, 28, 'Noto Sans', '#181c2c', 700, 48);
                const pngImage = await pdfDoc.embedPng(pngBuffer);
                currentPage.drawImage(pngImage, { x: 60, y: currentY - 10, width: 700, height: 48 });
                currentY -= HEADER_HEIGHT + 20;
                
                // Numéro de page
                currentPage.drawText(`Page ${pageCount}`, {
                    x: PAGE_WIDTH - 100,
                    y: 30,
                    size: 10,
                    font: customFont,
                    color: rgb(0.5, 0.5, 0.5)
                });
            };

            // Fonction pour vérifier si on a assez d'espace pour une équipe
            const checkSpaceForTeam = async (team: Team) => {
                const playersCount = team.players?.length || 0;
                const teamHeight = 36 + 12 + 20 + 22 + (playersCount * 18) + 20; // Estimation de la hauteur nécessaire
                
                if (currentY - teamHeight < MARGIN_BOTTOM) {
                    await addNewPage();
                }
            };

            // Bandeau titre sur la première page
            {
                const pngBuffer = textToPngBuffer(`${tournamentName} — Liste des équipes validées`, 28, 'Noto Sans', '#181c2c', 700, 48);
                const pngImage = await pdfDoc.embedPng(pngBuffer);
                currentPage.drawImage(pngImage, { x: 60, y: currentY - 10, width: 700, height: 48 });
            }
            currentY -= HEADER_HEIGHT + 20;

            // Numéro de page sur la première page
            currentPage.drawText(`Page 1`, {
                x: PAGE_WIDTH - 100,
                y: 30,
                size: 10,
                font: customFont,
                color: rgb(0.5, 0.5, 0.5)
            });

            for (let idx = 0; idx < validatedTeams.length; idx++) {
                const team = validatedTeams[idx];
                
                // Vérifier si on a assez d'espace pour cette équipe
                await checkSpaceForTeam(team);
                
                // Calculer la hauteur du bloc équipe
                const playersCount = team.players?.filter(p => 
                    !(team.captain && p.pseudo === team.captain.pseudo && p.country === team.captain.country)
                ).length || 0;
                const blockHeight = 36 + 12 + 20 + (team.captain ? 22 : 0) + (playersCount * 18) + 20;
                
                // Fond très léger sous chaque équipe
                currentPage.drawRectangle({ 
                    x: 52, 
                    y: currentY - blockHeight + 8, 
                    width: 370, 
                    height: blockHeight, 
                    color: rgb(0.93, 0.97, 1), 
                    opacity: 0.7 
                });
                
                // Titre équipe (en image)
                {
                    const pngBuffer = textToPngBuffer(`ÉQUIPE #${idx + 1} : ${team.name}`, 21, 'Noto Sans', '#2266b2', 540, 36);
                    const pngImage = await pdfDoc.embedPng(pngBuffer);
                    currentPage.drawImage(pngImage, { x: 60, y: currentY - 3, width: 540, height: 36 });
                }
                currentY -= 36;
                
                // Ligne colorée
                currentPage.drawLine({ 
                    start: { x: 60, y: currentY }, 
                    end: { x: 400, y: currentY }, 
                    thickness: 1.2, 
                    color: rgb(0.13, 0.36, 0.7) 
                });
                currentY -= 12;
                
                // Statut (en image)
                {
                    const pngBuffer = textToPngBuffer('Statut : Validée', 14, 'Noto Sans', '#395478', 200, 20);
                    const pngImage = await pdfDoc.embedPng(pngBuffer);
                    currentPage.drawImage(pngImage, { x: 72, y: currentY - 2, width: 200, height: 20 });
                }
                currentY -= 20;
                
                // Capitaine
                if (team.captain) {
                    const pngBuffer = textToPngBuffer(`★ ${team.captain.pseudo}  (${team.captain.country})`, 16, 'Noto Sans', '#13807a', 420, 22);
                    const pngImage = await pdfDoc.embedPng(pngBuffer);
                    currentPage.drawImage(pngImage, { x: 82, y: currentY - 2, width: 420, height: 22 });
                    currentY -= 22;
                }
                
                // Joueurs
                if (team.players && Array.isArray(team.players)) {
                    for (const player of team.players) {
                        // Ne pas dupliquer le capitaine
                        if (team.captain && player.pseudo === team.captain.pseudo && player.country === team.captain.country) continue;
                        
                        const pngBuffer = textToPngBuffer(`• ${player.pseudo} (${player.country})`, 13, 'Noto Sans', '#2e3550', 400, 18);
                        const pngImage = await pdfDoc.embedPng(pngBuffer);
                        currentPage.drawImage(pngImage, { x: 88, y: currentY - 1, width: 400, height: 18 });
                        currentY -= 18;
                    }
                }
                currentY -= 20;
            }

            // Ajouter le pied de page sur toutes les pages
            const pages = pdfDoc.getPages();
            pages.forEach((page) => {
                page.drawLine({ 
                    start: { x: 250, y: 40 }, 
                    end: { x: 550, y: 40 }, 
                    thickness: 0.8, 
                    color: rgb(0.7, 0.7, 0.7) 
                });
                page.drawText(`Exporté le : ${formatDate(new Date())}   —   EspaceGaming`, {
                    x: 300,
                    y: 22,
                    size: 10,
                    font: customFont,
                    color: rgb(0.4, 0.4, 0.4)
                });
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

            const fileName = tournamentId && tournamentId !== 'all' 
                ? `tournoi-${tournamentId}-equipes-validees-${new Date().toISOString().split('T')[0]}.csv`
                : `tournoi-codm-equipes-validees-${new Date().toISOString().split('T')[0]}.csv`
            
            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${fileName}"`
                }
            })
        }

        if (format === 'json') {
            // Export JSON détaillé
            const exportData = {
                exportDate: new Date().toISOString(),
                tournament: {
                    id: tournamentId || 'legacy',
                    name: tournamentName,
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

            const jsonFileName = tournamentId && tournamentId !== 'all' 
                ? `tournoi-${tournamentId}-${new Date().toISOString().split('T')[0]}.json`
                : `tournoi-codm-${new Date().toISOString().split('T')[0]}.json`
            
            return NextResponse.json(exportData, {
                headers: {
                    'Content-Disposition': `attachment; filename="${jsonFileName}"`
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

