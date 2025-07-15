import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Team } from '@/types'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Ajoute le type Firestore Timestamp si disponible
import type { Timestamp } from 'firebase/firestore';

const formatDate = (date: Timestamp | Date | string | undefined): string => {
    if (!date) return '';
    if (date instanceof Date) return date.toISOString();
    // Vérifie si c'est un Timestamp Firestore
    if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as Timestamp).toDate === 'function') {
        return (date as Timestamp).toDate().toISOString();
    }
    return new Date(date as string).toISOString();
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

            const pdfDoc = await PDFDocument.create()
            const page = pdfDoc.addPage([800, Math.max(1120, 200 + validatedTeams.length * 120)])
            const { height } = page.getSize()

            // Fonts
            const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
            const fontText = await pdfDoc.embedFont(StandardFonts.Helvetica)

            let y = height - 60
            page.drawText('Liste des équipes validées - Tournoi CODM', {
                x: 40,
                y,
                size: 24,
                font: fontTitle,
                color: rgb(0.2, 0.4, 0.8)
            })
            y -= 40

            validatedTeams.forEach((team, idx) => {
                y -= 20
                page.drawText(`Équipe #${idx + 1} : ${team.name} (${team.code})`, {
                    x: 40,
                    y,
                    size: 18,
                    font: fontTitle,
                    color: rgb(0.3, 0.8, 0.6)
                })
                y -= 18
                page.drawText(`Statut : ${team.status} | Créée le : ${formatDate(team.createdAt)}`, {
                    x: 60,
                    y,
                    size: 12,
                    font: fontText,
                    color: rgb(0.4, 0.4, 0.4)
                })
                y -= 16
                // Capitaine
                if (team.captain) {
                    page.drawText(`Capitaine : ${team.captain.pseudo} (${team.captain.country}) | WhatsApp : ${team.captain.whatsapp} | Statut : ${team.captain.status} | Vidéo : ${team.captain.deviceCheckVideo ? 'Oui' : 'Non'} | Rejoint le : ${formatDate(team.captain.joinedAt)}`, {
                        x: 60,
                        y,
                        size: 10,
                        font: fontText,
                        color: rgb(0.2, 0.2, 0.2)
                    })
                    y -= 14
                }
                // Joueurs
                if (team.players && Array.isArray(team.players)) {
                    team.players.forEach((player, pi) => {
                        page.drawText(`Joueur ${pi + 1} : ${player.pseudo} (${player.country}) | WhatsApp : ${player.whatsapp} | Statut : ${player.status} | Vidéo : ${player.deviceCheckVideo ? 'Oui' : 'Non'} | Rejoint le : ${formatDate(player.joinedAt)}`, {
                            x: 80,
                            y,
                            size: 10,
                            font: fontText,
                            color: rgb(0.2, 0.2, 0.2)
                        })
                        y -= 12
                    })
                }
                y -= 10
            })

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
        console.error('Erreur lors de l\'export:', error)
        return NextResponse.json(
            { error: 'Erreur lors de l\'export des données' },
            { status: 500 }
        )
    }
}
