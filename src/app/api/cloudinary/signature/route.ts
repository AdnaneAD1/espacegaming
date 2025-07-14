import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { folder = 'device-checks' } = body;

        // Générer un timestamp UTC actuel avec une légère avance pour éviter les problèmes de décalage
        const now = new Date();
        const timestamp = Math.round(now.getTime() / 1000);

        console.log('Heure système:', now.toISOString());
        console.log('Timestamp Unix:', timestamp);
        console.log('Timestamp vérifié:', new Date(timestamp * 1000).toISOString());

        // Vérifier que le timestamp n'est pas dans le futur (plus de 10 minutes)
        const maxFuture = Math.round(Date.now() / 1000) + (10 * 60);
        if (timestamp > maxFuture) {
            console.warn('Timestamp trop dans le futur, utilisation du timestamp actuel');
            const correctedTimestamp = Math.round(Date.now() / 1000);

            const params = {
                folder,
                timestamp: correctedTimestamp,
            };

            const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

            return NextResponse.json({
                signature,
                timestamp: correctedTimestamp,
                api_key: process.env.CLOUDINARY_API_KEY,
                folder,
            });
        }

        // Paramètres pour la signature (SANS resource_type pour l'endpoint /video/upload)
        const params = {
            folder,
            timestamp,
        };

        console.log('Paramètres pour signature:', params);

        // Générer la signature
        const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

        console.log('Signature générée:', signature);

        return NextResponse.json({
            signature,
            timestamp,
            api_key: process.env.CLOUDINARY_API_KEY,
            folder,
        });
    } catch (error) {
        console.error('Erreur lors de la génération de la signature Cloudinary:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération de la signature' },
            { status: 500 }
        );
    }
}
