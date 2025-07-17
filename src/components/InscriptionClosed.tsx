import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function InscriptionClosed() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="bg-gray-900/80 rounded-2xl shadow-lg p-10 text-center border border-blue-700/30 max-w-lg">
          <h1 className="text-3xl font-bold text-red-400 mb-4">Inscriptions fermées</h1>
          <p className="text-lg text-gray-200 mb-2">
            Les inscriptions au tournoi sont désormais closes.
          </p>
          <p className="text-md text-gray-400">
            Merci de votre intérêt et à bientôt pour un prochain événement !
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
