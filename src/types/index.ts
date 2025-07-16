// Types pour l'application de tournoi Call of Duty Mobile

export interface Player {
    id: string;
    pseudo: string;
    country: string;
    whatsapp: string;
    deviceCheckVideo: string; // URL Cloudinary - Obligatoire
    status: 'pending' | 'validated' | 'rejected';
    joinedAt: Date;
    validatedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    isCaptain?: boolean;
}

export interface Team {
    id: string;
    name: string;
    code: string; // Code unique pour rejoindre l'équipe
    captain: Player;
    players: Player[];
    status: 'incomplete' | 'complete' | 'validated' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
    validatedAt?: Date;
    fcmToken?: string; // Token FCM du capitaine
}

export interface Tournament {
    id: string;
    name: string;
    description: string;
    maxTeams: number;
    currentTeams: number;
    registrationStartDate: Date;
    registrationEndDate: Date;
    tournamentDate: Date;
    status: 'upcoming' | 'registration_open' | 'registration_closed' | 'ongoing' | 'completed';
    prizePool: {
        currency: string;
        amount: number;
        perPlayer: number;
    };
    rules: string[];
    pointSystem: PointSystem[];
}

export interface PointSystem {
    placement: string;
    points: number;
    kills: number;
}

export interface RegistrationFormData {
    teamName: string;
    captain: {
        pseudo: string;
        country: string;
        whatsapp: string;
        deviceCheckVideo: File;
    };
    players: {
        pseudo: string;
        country: string;
        whatsapp: string;
        deviceCheckVideo: File;
    }[];
}

export interface JoinTeamFormData {
    teamCode: string;
    player: {
        pseudo: string;
        country: string;
        whatsapp: string;
        deviceCheckVideo: File;
    };
}

export interface AdminStats {
    totalTeams: number;
    validatedTeams: number;
    pendingTeams: number;
    rejectedTeams: number;
    totalPlayers: number;
    validatedPlayers: number;
    pendingPlayers: number;
    rejectedPlayers: number;
}

export interface CloudinaryUploadResult {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    tags: string[];
    bytes: number;
    type: string;
    etag: string;
    url: string;
    secure_url: string;
    original_filename: string;
    api_key: string;
}

export interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

export interface Partner {
    id: string;
    name: string;
    logo: string;
    website?: string;
    description?: string;
}

export interface Community {
    name: string;
    description: string;
    foundedYear: number;
    members: number;
    socialLinks: {
        discord?: string;
        telegram?: string;
        instagram?: string;
        youtube?: string;
    };
}
