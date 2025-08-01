import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Fonction pour générer un code d'équipe unique
export function generateTeamCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Fonction pour formater les dates
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

// Fonction pour formater les dates relatives
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Il y a quelques secondes';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
}

// Fonction pour valider les numéros WhatsApp
export function validateWhatsApp(number: string): boolean {
    // Supprime tous les espaces et caractères spéciaux
    const cleanNumber = number.replace(/[\s\-\(\)\+]/g, '');

    // Vérifie que c'est un numéro valide (8-15 chiffres)
    const phoneRegex = /^\d{8,15}$/;
    return phoneRegex.test(cleanNumber);
}

// Fonction pour formater les numéros WhatsApp
export function formatWhatsApp(number: string): string {
    const cleanNumber = number.replace(/[\s\-\(\)\+]/g, '');

    if (!cleanNumber.startsWith('+')) {
        return `+${cleanNumber}`;
    }

    return cleanNumber;
}

// Fonction pour valider le format vidéo
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Format vidéo non supporté. Utilisez MP4, MOV, AVI ou MKV.',
        };
    }

    if (file.size > maxSize) {
        return {
            isValid: false,
            error: 'La vidéo doit faire moins de 50MB.',
        };
    }

    return { isValid: true };
}

// Fonction pour calculer le statut d'une équipe
type PlayerForStatus = { status: string };

export function calculateTeamStatus(players: PlayerForStatus[]): 'incomplete' | 'complete' | 'validated' | 'rejected' {
    if (players.length < 3) {
        return 'incomplete';
    }

    const validatedPlayers = players.filter(p => p.status === 'validated');
    const rejectedPlayers = players.filter(p => p.status === 'rejected');

    if (rejectedPlayers.length > 0) {
        return 'rejected';
    }

    if (validatedPlayers.length >= 3) {
        return 'validated';
    }

    return 'complete';
}

// Fonction pour générer un slug à partir d'un nom
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Fonction pour vérifier si les inscriptions sont ouvertes
// Prend en compte le deadline_register du tournoi actif ou fallback sur l'ancienne méthode
export async function isRegistrationOpen(): Promise<boolean> {
    try {
        // Importer dynamiquement pour éviter les problèmes de dépendances circulaires
        const { TournamentService } = await import('@/services/tournamentService');
        
        const activeTournament = await TournamentService.getActiveTournament();
        
        if (activeTournament && activeTournament.deadline_register) {
            // Utiliser la deadline du tournoi actif
            return new Date() < activeTournament.deadline_register;
        }
        
        // Fallback sur l'ancienne méthode si pas de tournoi actif ou pas de deadline
        const endDate = new Date(process.env.NEXT_PUBLIC_REGISTRATION_END_DATE || '');
        return new Date() < endDate;
    } catch (error) {
        console.error('Erreur lors de la vérification des inscriptions:', error);
        // Fallback sur l'ancienne méthode en cas d'erreur
        const endDate = new Date(process.env.NEXT_PUBLIC_REGISTRATION_END_DATE || '');
        return new Date() < endDate;
    }
}

// Version synchrone pour la compatibilité (utilise l'ancienne méthode)
export function isRegistrationOpenSync(): boolean {
    const endDate = new Date(process.env.NEXT_PUBLIC_REGISTRATION_END_DATE || '');
    return new Date() < endDate;
}

// Fonction pour obtenir le temps restant avant la fin des inscriptions
// Prend en compte le deadline_register du tournoi actif ou fallback sur l'ancienne méthode
export async function getTimeUntilRegistrationEnd(): Promise<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}> {
    try {
        // Importer dynamiquement pour éviter les problèmes de dépendances circulaires
        const { TournamentService } = await import('@/services/tournamentService');
        
        const activeTournament = await TournamentService.getActiveTournament();
        let endDate: Date;
        
        if (activeTournament && activeTournament.deadline_register) {
            // Utiliser la deadline du tournoi actif
            endDate = activeTournament.deadline_register;
        } else {
            // Fallback sur l'ancienne méthode
            endDate = new Date(process.env.NEXT_PUBLIC_REGISTRATION_END_DATE || '');
        }
        
        const now = new Date();
        const diffInMs = endDate.getTime() - now.getTime();

        if (diffInMs <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    } catch (error) {
        console.error('Erreur lors du calcul du temps restant:', error);
        // Fallback sur l'ancienne méthode en cas d'erreur
        const endDate = new Date(process.env.NEXT_PUBLIC_REGISTRATION_END_DATE || '');
        const now = new Date();
        const diffInMs = endDate.getTime() - now.getTime();

        if (diffInMs <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    }
}

// Version synchrone pour la compatibilité (utilise l'ancienne méthode)
export function getTimeUntilRegistrationEndSync(): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
} {
    const endDate = new Date(process.env.NEXT_PUBLIC_REGISTRATION_END_DATE || '');
    const now = new Date();
    const diffInMs = endDate.getTime() - now.getTime();

    if (diffInMs <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
}
