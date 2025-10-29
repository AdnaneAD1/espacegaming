import { z } from 'zod';

// Schéma pour la validation d'un joueur
export const playerSchema = z.object({
    pseudo: z
        .string()
        .min(3, 'Le pseudo doit contenir au moins 3 caractères')
        .max(20, 'Le pseudo ne peut pas dépasser 20 caractères')
        .trim(), // Permet tous les caractères, supprime juste les espaces en début/fin
    country: z
        .string()
        .min(2, 'Veuillez sélectionner un pays')
        .refine((val) => {
            // Si "Autre" est sélectionné, le champ doit contenir le pays personnalisé (au moins 2 caractères)
            if (val === 'Autre') {
                return false; // "Autre" seul n'est pas valide
            }
            return true;
        }, 'Veuillez spécifier votre pays')
        .refine((val) => {
            // Si ce n'est pas un pays prédéfini et que c'est un pays personnalisé, vérifier la longueur
            const predefinedCountries = [
                'France', 'Algérie', 'Bénin', 'Maroc', 'Tunisie', 'Belgique', 'Suisse', 'Canada',
                'Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso', 'Niger', 'Madagascar',
                'Cameroun', 'Gabon', 'République démocratique du Congo'
            ];
            if (!predefinedCountries.includes(val) && val !== 'Autre') {
                return val.length >= 2; // Pays personnalisé doit avoir au moins 2 caractères
            }
            return true;
        }, 'Le nom du pays doit contenir au moins 2 caractères'),
    whatsapp: z
        .string()
        .min(8, 'Numéro WhatsApp invalide')
        .max(15, 'Numéro WhatsApp trop long')
        .regex(/^\+?[1-9]\d{7,14}$/, 'Format de numéro WhatsApp invalide'),
    deviceCheckVideo: z
        .string()
        .url('URL de la vidéo de device check requise')
        .min(1, 'La vidéo de device check est obligatoire'),
});

// Fonction pour créer un schéma d'inscription dynamique selon la taille d'équipe
export const getTeamRegistrationSchema = (teamSize: number) => {
    // Pour le mode Solo (teamSize = 1), le nom d'équipe est optionnel
    const teamNameSchema = teamSize === 1
        ? z.string().optional()
        : z.string()
            .min(3, 'Le nom d\'équipe doit contenir au moins 3 caractères')
            .max(30, 'Le nom d\'équipe ne peut pas dépasser 30 caractères')
            .regex(/^[a-zA-Z0-9\s_-]+$/, 'Le nom d\'équipe contient des caractères non autorisés');

    return z.object({
        teamName: teamNameSchema,
        captain: playerSchema,
        players: z
            .array(playerSchema)
            .min(0, `Vous pouvez créer une équipe sans coéquipiers et les ajouter plus tard`)
            .max(teamSize - 1, `Une équipe de ${teamSize} ne peut pas avoir plus de ${teamSize - 1} joueur(s) supplémentaire(s)`),
    });
};

// Schéma par défaut pour Squad (4 joueurs) - pour compatibilité
export const teamRegistrationSchema = getTeamRegistrationSchema(4);

// Schéma pour rejoindre une équipe
export const joinTeamSchema = z.object({
    teamCode: z
        .string()
        .length(6, 'Le code d\'équipe doit contenir exactement 6 caractères')
        .regex(/^[A-Z0-9]+$/, 'Code d\'équipe invalide'),
    player: playerSchema,
});

// Schéma pour le suivi d'équipe
export const teamTrackingSchema = z.object({
    teamCode: z
        .string()
        .length(6, 'Le code d\'équipe doit contenir exactement 6 caractères')
        .regex(/^[A-Z0-9]+$/, 'Code d\'équipe invalide'),
});

// Schéma pour la validation admin d'un joueur
export const adminPlayerValidationSchema = z.object({
    playerId: z.string().min(1, 'ID du joueur requis'),
    status: z.enum(['validated', 'rejected'], {
        message: 'Statut requis',
    }),
    rejectionReason: z.string().optional(),
});

// Schéma pour les paramètres du tournoi
export const tournamentSettingsSchema = z.object({
    maxTeams: z
        .number()
        .min(1, 'Le nombre maximum d\'équipes doit être au moins 1')
        .max(100, 'Le nombre maximum d\'équipes ne peut pas dépasser 100'),
    registrationEndDate: z
        .string()
        .datetime('Date de fin d\'inscription invalide'),
    status: z.enum(['upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed']),
});

// Schéma pour l'authentification admin
export const adminAuthSchema = z.object({
    secretKey: z
        .string()
        .min(1, 'Clé secrète requise'),
});

// Schéma pour l'upload de fichier
export const fileUploadSchema = z.object({
    file: z
        .instanceof(File)
        .refine((file) => file.size <= 50 * 1024 * 1024, 'La fichier doit faire moins de 50MB')
        .refine(
            (file) => ['video/mp4', 'video/mov', 'video/avi', 'video/mkv'].includes(file.type),
            'Format vidéo non supporté'
        ),
});

// Schéma pour les notifications push
export const pushNotificationSchema = z.object({
    title: z.string().min(1, 'Titre requis'),
    body: z.string().min(1, 'Message requis'),
    targetTeams: z.array(z.string()).optional(),
    targetPlayers: z.array(z.string()).optional(),
});

// Types dérivés des schémas
export type PlayerFormData = z.infer<typeof playerSchema>;
export type TeamRegistrationFormData = z.infer<typeof teamRegistrationSchema>;
export type JoinTeamFormData = z.infer<typeof joinTeamSchema>;
export type TeamTrackingFormData = z.infer<typeof teamTrackingSchema>;
export type AdminPlayerValidationFormData = z.infer<typeof adminPlayerValidationSchema>;
export type TournamentSettingsFormData = z.infer<typeof tournamentSettingsSchema>;
export type AdminAuthFormData = z.infer<typeof adminAuthSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type PushNotificationFormData = z.infer<typeof pushNotificationSchema>;
