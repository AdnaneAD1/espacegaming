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
        .min(2, 'Veuillez sélectionner un pays'),
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

// Schéma pour l'inscription d'une équipe
export const teamRegistrationSchema = z.object({
    teamName: z
        .string()
        .min(3, 'Le nom d\'équipe doit contenir au moins 3 caractères')
        .max(30, 'Le nom d\'équipe ne peut pas dépasser 30 caractères')
        .regex(/^[a-zA-Z0-9\s_-]+$/, 'Le nom d\'équipe contient des caractères non autorisés'),
    captain: playerSchema,
    players: z
        .array(playerSchema)
        .max(3, 'Une équipe ne peut avoir que 3 joueurs supplémentaires maximum'),
});

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
