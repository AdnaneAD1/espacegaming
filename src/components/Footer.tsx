import Link from 'next/link';
import { Trophy, MessageCircle, Instagram, Youtube, Users } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo et description */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Espace Gaming CODM
                            </span>
                        </div>
                        <p className="text-gray-400 mb-6 max-w-md">
                            Communauté dédiée aux tournois Call of Duty Mobile.
                            Rejoignez-nous pour des compétitions épiques et des récompenses extraordinaires !
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-200"
                                aria-label="Discord"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-pink-600 transition-all duration-200"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 transition-all duration-200"
                                aria-label="YouTube"
                            >
                                <Youtube className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-green-600 transition-all duration-200"
                                aria-label="Telegram"
                            >
                                <Users className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Navigation</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link href="/regles" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    Règles
                                </Link>
                            </li>
                            <li>
                                <Link href="/inscription" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    Inscription
                                </Link>
                            </li>
                            <li>
                                <Link href="/suivi" className="text-gray-400 hover:text-white transition-colors duration-200">
                                    Suivi d&apos;équipe
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Informations */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Tournoi</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li>Mode : Battle Royale Squad</li>
                            <li>Récompense : 4000 CP</li>
                            <li>Équipes max : 50</li>
                            <li>Joueurs par équipe : 4</li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 pt-8 mt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm">
                            © {currentYear} Espace Gaming CODM. Tous droits réservés.
                        </p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <Link href="/mentions-legales" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                                Mentions légales
                            </Link>
                            <Link href="/politique-confidentialite" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                                Politique de confidentialité
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
