'use client';

import { useEffect } from 'react';
import { Users } from 'lucide-react';

export default function TikTokSection() {
  useEffect(() => {
    // Charger le script TikTok embed de manière asynchrone
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    
    // Vérifier si le script n'est pas déjà chargé
    const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
    if (!existingScript) {
      document.body.appendChild(script);
    } else {
      // Si le script existe déjà, forcer le rechargement des embeds
      if (window.tiktokEmbed) {
        window.tiktokEmbed.lib.render(document.querySelectorAll('.tiktok-embed'));
      }
    }

    return () => {
      // Nettoyage optionnel
    };
  }, []);

  return (
    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 mb-8 max-w-4xl mx-auto border border-gray-700">
      <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center justify-center gap-2">
        <Users className="w-5 h-5" />
        Suivez les tournois en direct
      </h3>
      <p className="text-center text-gray-400 mb-6">
        Ne manquez aucune action ! Suivez le déroulement des tournois en direct sur nos comptes TikTok.
        <br />
        <span className="text-white font-semibold">Abonnez-vous pour être notifié des lives :</span>
      </p>
      
      {/* Comptes TikTok */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h4 className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-pink-400" />
            Mister A YT
          </h4>
          <div className="flex justify-center">
            <blockquote 
              className="tiktok-embed" 
              cite="https://www.tiktok.com/@misteraytcodm" 
              data-unique-id="misteraytcodm" 
              data-embed-type="creator" 
              style={{maxWidth: '300px', minWidth: '288px'}}
            >
              <section>
                <a 
                  target="_blank" 
                  rel="noopener noreferrer"
                  href="https://www.tiktok.com/@misteraytcodm?refer=creator_embed"
                  className="text-pink-400 hover:text-pink-300 transition-colors font-semibold text-lg"
                >
                  @misteraytcodm
                </a>
              </section>
            </blockquote>
          </div>
        </div>
        
        <div className="text-center">
          <h4 className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-pink-400" />
            Adoooooo
          </h4>
          <div className="flex justify-center">
            <blockquote 
              className="tiktok-embed" 
              cite="https://www.tiktok.com/@goatcoincoin" 
              data-unique-id="goatcoincoin" 
              data-embed-type="creator" 
              style={{maxWidth: '300px', minWidth: '288px'}}
            >
              <section>
                <a 
                  target="_blank" 
                  rel="noopener noreferrer"
                  href="https://www.tiktok.com/@goatcoincoin?refer=creator_embed"
                  className="text-pink-400 hover:text-pink-300 transition-colors font-semibold text-lg"
                >
                  @goatcoincoin
                </a>
              </section>
            </blockquote>
          </div>
        </div>
      </div>
      
      <p className="text-center text-gray-400 text-sm mt-6">
        <span className="text-white font-semibold">🔔 Activez les notifications pour ne rien manquer !</span>
      </p>
      <p className="text-center text-gray-500 text-xs mt-2">
        Replays, highlights et annonces des prochains tournois disponibles sur ces comptes
      </p>
    </div>
  );
}

// Déclaration TypeScript pour window.tiktokEmbed
declare global {
  interface Window {
    tiktokEmbed?: {
      lib: {
        render: (elements: NodeListOf<Element>) => void;
      };
    };
  }
}
