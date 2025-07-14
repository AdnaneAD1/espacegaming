import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary côté serveur
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Configuration côté client
export const cloudinaryConfig = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
};

// Fonction pour générer l'URL de signature d'upload
export const getCloudinarySignature = async (paramsToSign: Record<string, unknown>) => {
    const response = await fetch('/api/cloudinary/signature', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(paramsToSign),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la génération de la signature Cloudinary');
    }

    return response.json();
};
