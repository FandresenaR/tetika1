import React, { useState, useEffect } from 'react';
import { FiSettings, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import SettingsModal from './SettingsModal';

const SettingsButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Effet pour restaurer l'état collapsé quand la modal se ferme
  useEffect(() => {
    if (!isModalOpen) {
      // Petit délai pour éviter un changement visuel brusque
      const timer = setTimeout(() => {
        setIsCollapsed(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  return (
    <>
      {/* Version desktop - fixe en bas à droite */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-full shadow-lg hover:shadow-cyan-500/30 hover:scale-105 transition-all duration-200 z-50 border border-cyan-500/20 md:block hidden"
        aria-label="Paramètres"
        title="Paramètres"
      >
        <FiSettings size={24} className="text-white animate-pulse" />
      </button>
      
      {/* Version mobile - collapsable à gauche de l'écran */}
      <div className="fixed top-20 left-0 md:hidden z-50" id="mobile-settings-button">
        <div className={`flex items-center transition-all duration-200`}>
          <button
            onClick={toggleCollapse}
            className="py-2 px-1.5 rounded-r-md transition-colors duration-200 text-gray-300 hover:text-gray-100 bg-gray-800/90 hover:bg-gray-700/90 border-r border-gray-700/60 shadow-lg"
            aria-label={isCollapsed ? "Ouvrir les paramètres" : "Fermer les paramètres"}
            title={isCollapsed ? "Ouvrir les paramètres" : "Fermer les paramètres"}
          >
            {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <button
              onClick={openModal}
              className="p-2 transition-colors duration-200 text-gray-300 hover:text-gray-100 hover:bg-gray-700/90 bg-gray-800/90 shadow-lg"
              aria-label="Paramètres"
              title="Paramètres"
            >
              <FiSettings size={20} />
            </button>
          </div>
        </div>
      </div>
      
      <SettingsModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

export default SettingsButton;
