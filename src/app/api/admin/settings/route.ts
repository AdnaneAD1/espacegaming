import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
    try {
        // Récupérer les paramètres du tournoi
        const settingsDoc = await adminDb.collection('settings').doc('tournament').get()

        if (!settingsDoc.exists) {
            // Créer les paramètres par défaut
            const defaultSettings = {
                registrationOpen: true,
                maxTeams: 50,
                currentTeams: 0,
                registrationStartDate: new Date(),
                registrationEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
                tournamentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
                lastUpdated: new Date()
            }

            await adminDb.collection('settings').doc('tournament').set(defaultSettings)
            return NextResponse.json(defaultSettings)
        }

        return NextResponse.json(settingsDoc.data())
    } catch (error) {
        console.error('Erreur lors de la récupération des paramètres:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des paramètres' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { registrationOpen, maxTeams, registrationEndDate, tournamentDate } = body

        const updates: Record<string, unknown> = {
            lastUpdated: new Date()
        }

        if (typeof registrationOpen === 'boolean') {
            updates.registrationOpen = registrationOpen
        }

        if (typeof maxTeams === 'number' && maxTeams > 0) {
            updates.maxTeams = maxTeams
        }

        if (registrationEndDate) {
            updates.registrationEndDate = new Date(registrationEndDate)
        }

        if (tournamentDate) {
            updates.tournamentDate = new Date(tournamentDate)
        }

        await adminDb.collection('settings').doc('tournament').update(updates)

        return NextResponse.json({
            success: true,
            message: 'Paramètres mis à jour avec succès'
        })
    } catch (error) {
        if (error instanceof Error) {
            console.error('Erreur lors de la mise à jour des paramètres:', error.message);
        } else {
            console.error('Erreur lors de la mise à jour des paramètres:', error);
        }
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour des paramètres' },
            { status: 500 }
        )
    }
}
