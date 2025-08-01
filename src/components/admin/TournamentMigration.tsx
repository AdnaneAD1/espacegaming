'use client';

import { useState } from 'react';
import { TournamentService } from '@/services/tournamentService';
// Composants UI simples pour remplacer les imports manquants
const Button = ({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
  <button onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-lg font-medium transition-colors ${disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'} ${className}`}>
    {children}
  </button>
);

const Input = ({ id, value, onChange, placeholder, disabled }: { id?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; disabled?: boolean }) => (
  <input id={id} type="text" value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>{children}</div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4 border-b border-gray-200">{children}</div>
);

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);

const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-600 mt-1">{children}</p>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

const Alert = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 rounded-lg border ${className || 'border-yellow-200 bg-yellow-50'}`}>{children}</div>
);

const AlertDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm ${className}`}>{children}</div>
);
import { Loader2, Database, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TournamentMigration() {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [tournamentName, setTournamentName] = useState('Tournoi Janvier 2025');
  const [migratedTournamentId, setMigratedTournamentId] = useState<string | null>(null);

  const handleMigration = async () => {
    if (!tournamentName.trim()) {
      toast.error('Veuillez entrer un nom pour le tournoi');
      return;
    }

    setIsLoading(true);
    setMigrationStatus('idle');

    try {
      const tournamentId = await TournamentService.migrateExistingData(tournamentName);
      setMigratedTournamentId(tournamentId);
      setMigrationStatus('success');
      toast.success('Migration terminée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      setMigrationStatus('error');
      toast.error('Erreur lors de la migration des données');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migration vers le système multi-tournois
          </CardTitle>
          <CardDescription>
            Migrez vos données existantes vers la nouvelle architecture pour supporter plusieurs tournois
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {migrationStatus === 'idle' && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4 text-black" />
                <AlertDescription className="text-black">
                  Cette opération va créer un nouveau tournoi avec toutes vos données actuelles (équipes et résultats).
                  Les données originales seront conservées pour sécurité.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label htmlFor="tournament-name" className="text-sm font-medium">
                  Nom du tournoi migré
                </label>
                <Input
                  id="tournament-name"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="Ex: Tournoi Janvier 2025"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Données actuelles</p>
                    <p className="text-sm text-gray-600">Équipes et résultats existants</p>
                  </div>
                </div>
                
                <ArrowRight className="w-5 h-5 text-gray-400" />
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Nouveau système</p>
                    <p className="text-sm text-gray-600">Architecture multi-tournois</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleMigration}
                disabled={isLoading || !tournamentName.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Migration en cours...
                  </>
                ) : (
                  'Démarrer la migration'
                )}
              </Button>
            </>
          )}

          {migrationStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-medium">Migration terminée avec succès !</p>
                  <p>Tournoi créé avec l&apos;ID: <code className="bg-white px-2 py-1 rounded">{migratedTournamentId}</code></p>
                  <p>Toutes vos données ont été migrées et le nouveau tournoi est maintenant actif.</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {migrationStatus === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p className="font-medium">Erreur lors de la migration</p>
                  <p>Veuillez vérifier la console pour plus de détails et réessayer.</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {migrationStatus === 'success' && (
        <Card>
          <CardHeader>
            <CardTitle>Prochaines étapes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>✅ Données migrées vers la nouvelle structure</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>✅ Tournoi actif configuré</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>✅ Interface existante compatible</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Vos pages existantes (classement, admin) fonctionneront normalement. 
                La prochaine étape sera de créer une page d&apos;historique des tournois.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
