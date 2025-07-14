'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, Crown, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoUpload from '@/components/VideoUpload';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { teamRegistrationSchema, TeamRegistrationFormData } from '@/lib/validations';

const countries = [
    'France', 'Algérie', 'Bénin', 'Maroc', 'Tunisie', 'Belgique', 'Suisse', 'Canada',
    'Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso', 'Niger', 'Madagascar',
    'Cameroun', 'Gabon', 'République démocratique du Congo', 'Autre'
];

export default function InscriptionPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    type UploadState = { isUploading?: boolean; uploadedUrl?: string; error?: string | null };
type UploadStates = { [key: string]: UploadState };
const [uploadStates, setUploadStates] = useState<UploadStates>({});
    const { upload } = useCloudinaryUpload();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        setValue,

    } = useForm<TeamRegistrationFormData>({
        resolver: zodResolver(teamRegistrationSchema),
        defaultValues: {
            teamName: '',
            captain: {
                pseudo: '',
                country: '',
                whatsapp: '',
                deviceCheckVideo: '',
            },
            players: [],
        },
    });

    // Gestion dynamique des joueurs avec useFieldArray
    const { fields: playerFields, append, remove } = useFieldArray({
        control,
        name: 'players',
    });

    const onSubmit = async (data: TeamRegistrationFormData) => {
        setIsSubmitting(true);
        console.log('onSubmit called', data);
        try {
            // Vérifier que le capitaine a uploadé sa vidéo
            if (!uploadStates.captain?.uploadedUrl) {
                toast.error('La vidéo de device check du capitaine est obligatoire');
                setIsSubmitting(false);
                return;
            }

            // Vérifier que chaque joueur a uploadé sa vidéo
            for (let i = 0; i < (data.players?.length || 0); i++) {
                if (!uploadStates[`player-${i}`]?.uploadedUrl) {
                    toast.error(`La vidéo de device check du joueur ${i + 1} est obligatoire`);
                    setIsSubmitting(false);
                    return;
                }
            }

            // Ajouter les URLs des vidéos aux données
            const completeData = {
                ...data,
                captain: {
                    ...data.captain,
                    deviceCheckVideo: uploadStates.captain.uploadedUrl,
                },
                players: (data.players || []).map((player) => ({
                    ...player,
                })),
            };

            // Préparer les données pour l'API (sans code, il sera généré côté serveur)
            const teamData = {
                ...completeData,
                status: completeData.players.length === 3 ? 'complete' : 'incomplete',
                createdAt: new Date(),
            };

            // Appel API pour créer l'équipe
            const response = await fetch('/api/teams/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(teamData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error) {
                    toast.error(errorData.error);
                    setIsSubmitting(false);
                    return;
                }
                throw new Error(errorData.error || 'Erreur lors de l&apos;inscription');
            }

            const result = await response.json();

            toast.success('Équipe créée avec succès !');

            // Rediriger vers la page de confirmation avec le code d&apos;équipe retourné par l'API
            router.push(`/inscription/confirmation?code=${result.teamCode}`);

        } catch (error: unknown) {
            if (error instanceof Error && error.message === "Ce nom d&apos;équipe est déjà pris") {
                toast.error(error.message);
                // Pas de console.error ici pour l'erreur métier
            } else {
                toast.error('Erreur lors de l&apos;inscription. Veuillez réessayer.');
                console.error('Erreur inscription:', error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gestion upload vidéo pour chaque joueur
    const handleVideoUpload = async (file: File, playerKey: string) => {
        try {
            setUploadStates(prev => ({
                ...prev,
                [playerKey]: { isUploading: true, error: null }
            }));

            console.log('Démarrage upload pour:', playerKey, file.name);
            const result = await upload(file, 'device-checks');
            console.log('Upload terminé:', result.secure_url);

            setUploadStates(prev => ({
                ...prev,
                [playerKey]: {
                    isUploading: false,
                    uploadedUrl: result.secure_url,
                    error: null
                }
            }));

            // Mettre à jour le formulaire avec l'URL de la vidéo
            if (playerKey === 'captain') {
                setValue('captain.deviceCheckVideo', result.secure_url);
            } else if (playerKey.startsWith('player-')) {
                const idx = Number(playerKey.split('-')[1]);
                setValue(`players.${idx}.deviceCheckVideo`, result.secure_url);
            }

            toast.success('Vidéo uploadée avec succès !');

        } catch (error) {
            console.error('Erreur upload:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l&apos;upload de la vidéo';

            setUploadStates(prev => ({
                ...prev,
                [playerKey]: {
                    isUploading: false,
                    error: errorMessage
                }
            }));

            toast.error(errorMessage);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                        Inscription au tournoi
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Créez votre équipe avec le capitaine. Les autres joueurs pourront rejoindre plus tard avec le code d&apos;équipe.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Informations de l&apos;équipe */}
                    <section className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <Users className="w-6 h-6 mr-3 text-blue-400" />
                            Informations de l&apos;équipe
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nom de l&apos;équipe *
                                </label>
                                <input
                                    {...register('teamName')}
                                    type="text"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Entrez le nom d&apos;inscrire votre équipe"
                                />
                                {errors.teamName && (
                                    <p className="mt-1 text-sm text-red-400">{errors.teamName.message}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Capitaine */}
                    <section className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <Crown className="w-6 h-6 mr-3 text-yellow-400" />
                            Capitaine de l&apos;équipe
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Pseudo en jeu *
                                </label>
                                <input
                                    {...register('captain.pseudo')}
                                    type="text"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Votre pseudo COD Mobile"
                                />
                                {errors.captain?.pseudo && (
                                    <p className="mt-1 text-sm text-red-400">{errors.captain.pseudo.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Pays *
                                </label>
                                <select
                                    {...register('captain.country')}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Sélectionnez votre pays</option>
                                    {countries.map((country) => (
                                        <option key={country} value={country}>
                                            {country}
                                        </option>
                                    ))}
                                </select>
                                {errors.captain?.country && (
                                    <p className="mt-1 text-sm text-red-400">{errors.captain.country.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Numéro WhatsApp *
                                </label>
                                <input
                                    {...register('captain.whatsapp')}
                                    type="tel"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="+33 6 12 34 56 78"
                                />
                                {errors.captain?.whatsapp && (
                                    <p className="mt-1 text-sm text-red-400">{errors.captain.whatsapp.message}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <VideoUpload
                                    onUpload={(file) => handleVideoUpload(file, 'captain')}
                                    isUploading={uploadStates.captain?.isUploading}
                                    uploadedUrl={uploadStates.captain?.uploadedUrl ?? undefined}
                                    error={uploadStates.captain?.error ?? undefined}
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section coéquipiers */}
                    <section className="mb-10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" /> Coéquipiers (jusqu&apos;à 3)
                        </h3>
                        {playerFields.map((field, idx) => (
                            <div key={field.id} className="grid md:grid-cols-2 gap-6 mb-8 bg-gray-800 p-4 rounded-lg relative">
                                <button
                                    type="button"
                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                                    onClick={() => remove(idx)}
                                    aria-label="Supprimer ce joueur"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Pseudo *</label>
                                    <input
                                        {...register(`players.${idx}.pseudo` as const)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder={`Pseudo du joueur ${idx + 1}`}
                                    />
                                    {errors.players?.[idx]?.pseudo && (
                                        <p className="mt-1 text-sm text-red-400">{errors.players[idx]?.pseudo?.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Pays *</label>
                                    <select
                                        {...register(`players.${idx}.country` as const)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Sélectionnez le pays</option>
                                        {countries.map((country) => (
                                            <option key={country} value={country}>{country}</option>
                                        ))}
                                    </select>
                                    {errors.players?.[idx]?.country && (
                                        <p className="mt-1 text-sm text-red-400">{errors.players[idx]?.country?.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Numéro WhatsApp *</label>
                                    <input
                                        {...register(`players.${idx}.whatsapp` as const)}
                                        type="tel"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                    {errors.players?.[idx]?.whatsapp && (
                                        <p className="mt-1 text-sm text-red-400">{errors.players[idx]?.whatsapp?.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Vidéo device check *</label>
                                    <VideoUpload
                                        onUpload={(file) => handleVideoUpload(file, `player-${idx}`)}
                                        isUploading={uploadStates[`player-${idx}`]?.isUploading}
                                        uploadedUrl={uploadStates[`player-${idx}`]?.uploadedUrl ?? undefined}
                                        error={uploadStates[`player-${idx}`]?.error ?? undefined}
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                        {playerFields.length < 3 && (
                            <button
                                type="button"
                                className="flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold mt-2"
                                onClick={() => append({ pseudo: '', country: '', whatsapp: '', deviceCheckVideo: '' })}
                            >
                                <Plus size={18} /> Ajouter un coéquipier
                            </button>
                        )}
                    </section>

                    {/* Bouton de soumission */}
                    <div className="text-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Inscription en cours...</span>
                                </div>
                            ) : (
                                'Créer l\'équipe'
                            )}
                        </button>

                        <p className="mt-4 text-gray-400 text-sm">
                            En vous inscrivant, vous acceptez les règles du tournoi et la politique de confidentialité.
                        </p>
                    </div>
                </form>
            </div>

            <Footer />
        </div>
    );
}
