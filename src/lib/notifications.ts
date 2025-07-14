import { adminMessaging } from '@/lib/firebase-admin'

export interface NotificationData {
    title: string
    body: string
    data?: Record<string, string>
    tokens?: string[]
    topic?: string
}

export class NotificationService {
    static async sendToTokens(notification: NotificationData): Promise<boolean> {
        try {
            if (!notification.tokens || notification.tokens.length === 0) {
                console.log('Aucun token FCM fourni')
                return false
            }

            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body
                },
                data: notification.data || {},
                tokens: notification.tokens
            }

            const response = await adminMessaging.sendEachForMulticast(message)

            console.log('Notifications envoyées:', {
                success: response.successCount,
                failure: response.failureCount,
                total: notification.tokens.length
            })

            return response.successCount > 0
        } catch (error) {
            console.error('Erreur lors de l\'envoi des notifications:', error)
            return false
        }
    }

    static async sendToTopic(notification: NotificationData): Promise<boolean> {
        try {
            if (!notification.topic) {
                console.log('Aucun topic fourni')
                return false
            }

            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body
                },
                data: notification.data || {},
                topic: notification.topic
            }

            await adminMessaging.send(message)
            console.log(`Notification envoyée au topic: ${notification.topic}`)
            return true
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification au topic:', error)
            return false
        }
    }

    // Notifications spécifiques au tournoi
    static async notifyPlayerValidated(teamName: string, playerName: string, fcmToken?: string) {
        if (!fcmToken) return false

        return this.sendToTokens({
            title: '✅ Joueur validé !',
            body: `${playerName} a été validé dans l'équipe ${teamName}`,
            tokens: [fcmToken],
            data: {
                type: 'player_validated',
                teamName,
                playerName
            }
        })
    }

    static async notifyPlayerRejected(teamName: string, playerName: string, fcmToken?: string, reason?: string) {
        if (!fcmToken) return false

        return this.sendToTokens({
            title: '❌ Joueur rejeté',
            body: `${playerName} a été rejeté dans l'équipe ${teamName}${reason ? `: ${reason}` : ''}`,
            tokens: [fcmToken],
            data: {
                type: 'player_rejected',
                teamName,
                playerName,
                reason: reason || ''
            }
        })
    }

    static async notifyTeamValidated(teamName: string, fcmToken?: string) {
        if (!fcmToken) return false

        return this.sendToTokens({
            title: '🎉 Équipe validée !',
            body: `Félicitations ! Votre équipe ${teamName} est maintenant validée pour le tournoi`,
            tokens: [fcmToken],
            data: {
                type: 'team_validated',
                teamName
            }
        })
    }

    static async notifyPlayerJoined(teamName: string, newPlayerName: string, fcmToken?: string) {
        if (!fcmToken) return false

        return this.sendToTokens({
            title: '👥 Nouveau joueur',
            body: `${newPlayerName} a rejoint votre équipe ${teamName}`,
            tokens: [fcmToken],
            data: {
                type: 'player_joined',
                teamName,
                newPlayerName
            }
        })
    }

    static async notifyRegistrationClosed() {
        return this.sendToTopic({
            title: '⏰ Inscriptions fermées',
            body: 'Les inscriptions pour le tournoi Battle Royale CODM sont maintenant fermées',
            topic: 'tournament_updates',
            data: {
                type: 'registration_closed'
            }
        })
    }

    static async notifyTournamentStarting() {
        return this.sendToTopic({
            title: '🚀 Tournoi en cours !',
            body: 'Le tournoi Battle Royale CODM commence maintenant. Bonne chance à tous !',
            topic: 'tournament_updates',
            data: {
                type: 'tournament_starting'
            }
        })
    }
}
