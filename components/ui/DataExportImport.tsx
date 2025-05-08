import React, { useState } from 'react';
import { getAllChatSessions } from '@/lib/storage';

interface DataExportImportProps {
  onImportComplete: () => void;
  onCancel: () => void;
}

export const DataExportImport: React.FC<DataExportImportProps> = ({ 
  onImportComplete,
  onCancel
}) => {
  const [importData, setImportData] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(true);

  // Exporter les données
  const handleExport = () => {
    try {
      const sessions = getAllChatSessions();
      const dataToExport = {
        version: '1.0',
        timestamp: Date.now(),
        sessions
      };
      
      const jsonData = JSON.stringify(dataToExport, null, 2);
      
      // Créer un blob et un lien de téléchargement
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `tetika-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Une erreur est survenue lors de l\'exportation des données.');
    }
  };

  // Importer les données
  const handleImport = () => {
    try {
      if (!importData.trim()) {
        setError('Veuillez coller les données JSON à importer.');
        return;
      }
      
      const parsedData = JSON.parse(importData);
      
      // Vérification de base
      if (!parsedData.version || !parsedData.sessions || !Array.isArray(parsedData.sessions)) {
        setError('Format de données invalide. Assurez-vous d\'importer un fichier d\'exportation Tetika valide.');
        return;
      }
      
      // Sauvegarder les sessions
      localStorage.setItem('tetika-chat-sessions', JSON.stringify(parsedData.sessions));
      
      // Informer le parent que l'importation est terminée
      onImportComplete();
    } catch (error) {
      console.error('Error importing data:', error);
      setError('Une erreur est survenue lors de l\'importation des données. Assurez-vous que le format JSON est valide.');
    }
  };

  return (
    <div className="futuristic-panel p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-cyan-400 mb-6">
        {isExporting ? 'Exporter vos données' : 'Importer des données'}
      </h2>
      
      {error && (
        <div className="bg-red-900/40 border border-red-500/50 text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        {isExporting ? (
          <>
            <p className="text-gray-300 text-sm">
              Exportez vos conversations pour les sauvegarder ou les transférer vers un autre appareil.
              Cela inclut toutes vos sessions de chat et leurs messages.
            </p>
            
            <button
              className="futuristic-button w-full py-3"
              onClick={handleExport}
            >
              Télécharger mes données
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-300 text-sm mb-2">
              Collez les données JSON exportées précédemment pour restaurer vos conversations.
              Attention : cela remplacera toutes vos conversations actuelles.
            </p>
            
            <textarea
              className="futuristic-input w-full h-40"
              placeholder="Collez ici les données JSON exportées..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
            
            <button
              className="futuristic-button w-full py-3"
              onClick={handleImport}
            >
              Importer les données
            </button>
          </>
        )}
        
        <div className="pt-4 flex justify-between items-center">
          <button
            className="text-gray-400 hover:text-cyan-400 text-sm"
            onClick={() => setIsExporting(!isExporting)}
          >
            {isExporting ? 'Passer à l\'importation' : 'Passer à l\'exportation'}
          </button>
          
          <button
            className="text-gray-400 hover:text-white text-sm"
            onClick={onCancel}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};