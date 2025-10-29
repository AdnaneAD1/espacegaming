import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TikTokSection from '@/components/TikTokSection';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function InscriptionClosed() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl space-y-8">
          <div className="bg-gray-900/80 rounded-2xl shadow-lg p-10 text-center border border-blue-700/30">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Inscriptions fermées</h1>
            <p className="text-lg text-gray-200 mb-2">
              Les inscriptions au tournoi sont désormais closes.
            </p>
            <p className="text-md text-gray-400 mb-6">
              Merci de votre intérêt et à bientôt pour un prochain événement !
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Home className="w-5 h-5" />
              Retour à l&apos;accueil
            </Link>
          </div>
          
          {/* Section TikTok */}
          <TikTokSection />
        </div>
      </div>
      <Footer />
    </div>
  );
}
