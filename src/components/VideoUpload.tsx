'use client';

import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { validateVideoFile } from '@/lib/utils';

interface VideoUploadProps {
    onUpload: (file: File) => void;
    isUploading?: boolean;
    uploadedUrl?: string;
    error?: string;
    required?: boolean;
    maxSize?: number; // en MB
}

export default function VideoUpload({
    onUpload,
    isUploading = false,
    uploadedUrl,
    error,
    required = false,
    maxSize = 50
}: VideoUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        console.log('Fichier sélectionné:', file.name, file.type, file.size);

        const validation = validateVideoFile(file);
        console.log('Résultat validation:', validation);

        if (!validation.isValid) {
            console.error('Validation échouée:', validation.error);
            return;
        }

        setSelectedFile(file);

        // Créer une URL de prévisualisation
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // Déclencher l'upload
        console.log('Déclenchement de l\'upload...');
        onUpload(file);
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            {/* Zone de drop */}
            {!uploadedUrl && !preview && (
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${dragActive
                        ? 'border-blue-400 bg-blue-500/10'
                        : error
                            ? 'border-red-400 bg-red-500/10'
                            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/mov,video/avi,video/mkv"
                        onChange={handleChange}
                        className="hidden"
                        aria-label="Sélectionner une vidéo de device check"
                    />

                    <div className="flex flex-col items-center space-y-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${error ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                            <Upload className="w-8 h-8" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">
                                Vidéo de device check {required && <span className="text-red-400">*</span>}
                            </h3>
                            <p className="text-gray-300">
                                Cliquez ici ou glissez-déposez votre vidéo
                            </p>
                            <p className="text-gray-500 text-xs">
                                Formats supportés : MP4, MOV, AVI, MKV • Taille max : {maxSize}MB
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Prévisualisation de la vidéo */}
            {preview && !uploadedUrl && (
                <div className="relative bg-gray-800 rounded-xl overflow-hidden">
                    <video
                        src={preview}
                        className="w-full h-48 object-cover"
                        controls
                    />
                    <div className="absolute top-2 right-2">
                        <button
                            onClick={clearFile}
                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors duration-200"
                            title="Supprimer la vidéo"
                            aria-label="Supprimer la vidéo"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                                <p className="text-white text-sm">Upload en cours...</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Vidéo uploadée avec succès */}
            {uploadedUrl && (
                <div className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-green-500">
                    <video
                        src={uploadedUrl}
                        className="w-full h-48 object-cover"
                        controls
                    />
                    <div className="absolute top-2 right-2 flex space-x-2">
                        <div className="bg-green-500 text-white p-1 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <button
                            onClick={clearFile}
                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors duration-200"
                            title="Supprimer la vidéo"
                            aria-label="Supprimer la vidéo"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Vidéo uploadée
                        </span>
                    </div>
                </div>
            )}

            {/* Message d'erreur */}
            {error && (
                <div className="mt-2 flex items-center space-x-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Information sur la vidéo sélectionnée */}
            {selectedFile && !error && (
                <div className="mt-2 text-sm text-gray-400">
                    <p>Fichier : {selectedFile.name}</p>
                    <p>Taille : {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            )}
        </div>
    );
}
