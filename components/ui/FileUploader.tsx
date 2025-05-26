import React, { useState, useRef } from 'react';

interface FileUploaderProps {
  onFileUpload?: (file: File) => void;
  onFileSelect?: (file: File) => void; // Nouvelle prop pour la sélection du fichier
  onClose?: () => void;
  theme?: 'dark' | 'light';
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileUpload, 
  onFileSelect,
  onClose, 
  theme = 'dark' 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extensions de fichiers autorisées
  const allowedExtensions = [
    '.txt', '.md', '.js', '.jsx', '.ts', '.tsx', 
    '.py', '.java', '.c', '.cpp', '.cs', '.php', 
    '.html', '.css', '.scss', '.json', '.xml', 
    '.yaml', '.yml', '.sql', '.sh', '.rb', '.go', 
    '.rs', '.swift', '.kt', '.dart', '.pdf', '.doc', 
    '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv',
    // Extensions d'images
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff', '.ico',
    // Extensions de vidéos
    '.mp4', '.webm', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.m4v'
  ];

  // Taille maximale de fichier (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Vérifier l'extension du fichier
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      setError(`Type de fichier non pris en charge. Extensions autorisées: ${allowedExtensions.join(', ')}`);
      return false;
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      setError(`La taille du fichier dépasse la limite de 10MB.`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = () => {
    if (selectedFile) {
      // Si onFileSelect est fourni, utiliser cette fonction pour renvoyer le fichier
      // sans fermer le modal (nouvelle UX)
      if (onFileSelect) {
        onFileSelect(selectedFile);
        if (onClose) {
          onClose();
        }
      } 
      // Sinon utiliser l'ancienne méthode
      else if (onFileUpload) {
        onFileUpload(selectedFile);
        if (onClose) {
          onClose();
        }
      } else {
        console.log('File uploaded for analysis:', selectedFile);
        if (onClose) {
          onClose();
        }
      }
    }
  };

  // Apply theme-specific classes
  const bgColor = theme === 'dark' 
    ? 'bg-gray-900 border-cyan-800/50' 
    : 'bg-white border-blue-200/50';

  const textColor = theme === 'dark'
    ? 'text-white' 
    : 'text-gray-800';
  
  const headingColor = theme === 'dark'
    ? 'text-cyan-400'
    : 'text-blue-600';

  const closeButtonColor = theme === 'dark'
    ? 'text-gray-400 hover:text-white'
    : 'text-gray-500 hover:text-gray-800';

  const dragAreaClasses = dragActive 
    ? theme === 'dark'
      ? 'border-cyan-500 bg-cyan-900/20' 
      : 'border-blue-500 bg-blue-50'
    : theme === 'dark'
      ? 'border-gray-600 hover:border-cyan-600 bg-gray-800/50'
      : 'border-gray-300 hover:border-blue-400 bg-gray-50';

  const browseButtonClasses = theme === 'dark'
    ? 'bg-cyan-800 hover:bg-cyan-700 text-cyan-200'
    : 'bg-blue-100 hover:bg-blue-200 text-blue-700';

  const uploadButtonClasses = theme === 'dark'
    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
    : 'bg-blue-600 hover:bg-blue-500 text-white';

  const errorClasses = theme === 'dark'
    ? 'bg-red-900/30 border-red-700 text-red-300'
    : 'bg-red-50 border-red-300 text-red-700';

  const noteColor = theme === 'dark'
    ? 'text-gray-400'
    : 'text-gray-500';

  return (
    <div className={`w-full ${bgColor} border rounded-lg shadow-xl p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-semibold ${headingColor}`}>Ajouter un fichier</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className={closeButtonColor}
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <p className={`${textColor} opacity-80 mb-4`}>
        Sélectionnez un fichier à analyser par l&apos;IA. L&apos;IA peut analyser du code, des documents texte et d&apos;autres formats.
      </p>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${dragAreaClasses}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={allowedExtensions.join(',')}
          aria-label="Sélectionner un fichier à télécharger"
          title="Sélectionner un fichier à télécharger"
        />
        
        {selectedFile ? (
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${theme === 'dark' ? 'text-cyan-500' : 'text-blue-500'} mb-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className={`${theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'} font-medium mb-1`}>{selectedFile.name}</p>
            <p className={`opacity-60 ${textColor} text-sm mb-3`}>
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <button 
              onClick={handleUpload}
              className={`font-medium py-2 px-4 rounded-md transition-colors ${uploadButtonClasses}`}
            >
              Utiliser ce fichier
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className={`${textColor} opacity-80 mb-2`}>Glissez-déposez un fichier ici ou</p>
            <button 
              onClick={handleButtonClick}
              className={`font-medium py-2 px-4 rounded-md transition-colors ${browseButtonClasses}`}
            >
              Parcourir les fichiers
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className={`mt-4 p-3 border rounded-md ${errorClasses}`}>
          {error}
        </div>
      )}
      
      <div className={`mt-4 text-xs ${noteColor}`}>
        <p>Formats acceptés: documents texte, fichiers de code, PDF et autres formats standards.</p>
        <p>Taille maximale: 10MB</p>
      </div>
    </div>
  );
};