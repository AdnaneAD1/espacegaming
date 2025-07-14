'use client';

import { useState } from 'react';
import { CloudinaryUploadResult } from '@/types';

interface UseCloudinaryUploadReturn {
    upload: (file: File, folder?: string) => Promise<CloudinaryUploadResult>;
    isUploading: boolean;
    error: string | null;
    uploadedUrl: string | null;
    progress: number;
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const upload = async (file: File, folder = 'device-checks'): Promise<CloudinaryUploadResult> => {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        try {
            console.log('Début de l\'upload pour:', file.name, 'Taille:', file.size);

            // Récupérer la signature d'upload depuis notre API (le timestamp sera généré côté serveur)
            const uploadParams = {
                folder,
            };

            console.log('Demande de signature avec params:', uploadParams);

            const signatureResponse = await fetch('/api/cloudinary/signature', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadParams),
            });

            if (!signatureResponse.ok) {
                const errorText = await signatureResponse.text();
                console.error('Erreur signature response:', errorText);
                throw new Error(`Erreur lors de la génération de la signature: ${signatureResponse.status}`);
            }

            const { signature, api_key, folder: returnedFolder, timestamp } = await signatureResponse.json();
            console.log('Signature reçue:', { signature, api_key, folder: returnedFolder, timestamp });
            console.log('Timestamp reçu:', timestamp, 'Date:', new Date(timestamp * 1000).toISOString());

            // Préparer les données pour l'upload (SANS resource_type car l'endpoint /video/upload le définit déjà)
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', api_key);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);
            formData.append('folder', returnedFolder);

            console.log('FormData préparée pour upload');
            console.log('URL d\'upload:', `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`);

            // Upload vers Cloudinary
            const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            console.log('Réponse Cloudinary status:', uploadResponse.status);

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('Erreur Cloudinary response:', errorText);
                throw new Error(`Erreur lors de l'upload de la vidéo: ${uploadResponse.status} - ${errorText}`);
            }

            const result: CloudinaryUploadResult = await uploadResponse.json();
            console.log('Upload réussi:', result.secure_url);

            setUploadedUrl(result.secure_url);
            setProgress(100);

            return result;
        } catch (err) {
            console.error('Erreur détaillée:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'upload';
            setError(errorMessage);
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        upload,
        isUploading,
        error,
        uploadedUrl,
        progress,
    };
}
