import React from 'react';

type ErrorType = 'api' | 'network' | 'auth' | 'config' | 'general';

interface ErrorAlertProps {
  type: ErrorType;
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  type,
  message,
  onRetry,
  onDismiss,
}) => {
  const getErrorIcon = () => {
    switch (type) {
      case 'api':
        return '🔌';
      case 'network':
        return '📡';
      case 'auth':
        return '🔒';
      case 'config':
        return '⚙️';
      default:
        return '⚠️';
    }
  };

  const getErrorTitle = () => {
    switch (type) {
      case 'api':
        return 'Erreur API';
      case 'network':
        return 'Erreur réseau';
      case 'auth':
        return 'Erreur d\'authentification';
      case 'config':
        return 'Erreur de configuration';
      default:
        return 'Erreur';
    }
  };

  const getErrorBgClass = () => {
    switch (type) {
      case 'api':
        return 'bg-red-900/40 border-red-500/50';
      case 'network':
        return 'bg-orange-900/40 border-orange-500/50';
      case 'auth':
        return 'bg-purple-900/40 border-purple-500/50';
      case 'config':
        return 'bg-blue-900/40 border-blue-500/50';
      default:
        return 'bg-red-900/40 border-red-500/50';
    }
  };

  return (
    <div className={`border ${getErrorBgClass()} rounded-lg p-4 my-4 text-white`}>
      <div className="flex items-start">
        <div className="text-xl mr-3">{getErrorIcon()}</div>
        <div className="flex-1">
          <h3 className="font-medium mb-1">{getErrorTitle()}</h3>
          <p className="text-sm opacity-90">{message}</p>
          
          <div className="mt-3 flex gap-3">
            {onRetry && (
              <button 
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm"
                onClick={onRetry}
              >
                Réessayer
              </button>
            )}
            <button 
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-sm"
              onClick={onDismiss}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};