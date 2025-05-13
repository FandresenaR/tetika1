// Script pour gérer le bouton des paramètres mobile
// Cette fonction est maintenant simplifiée car le bouton est positionné directement via CSS

export function moveSettingsButton() {
  if (typeof window === 'undefined') return; // S'assurer que nous sommes côté client

  // Fonction pour s'assurer que le bouton des paramètres est correctement positionné
  const adjustButton = () => {
    // Détection du mode portrait/paysage sur mobile et ajustement de la position du bouton
    const mobileSettingsButton = document.getElementById('mobile-settings-button');
    
    if (mobileSettingsButton) {
      // Ajuster la position en fonction de l'orientation de l'écran
      if (window.innerHeight > window.innerWidth) {
        // Mode portrait
        mobileSettingsButton.style.top = '76px'; // Position légèrement plus haute en portrait
      } else {
        // Mode paysage
        mobileSettingsButton.style.top = '70px'; // Position légèrement plus basse en paysage
      }
    }
  };

  // Fonction pour gérer le collapse automatique du bouton quand la textarea est focus
  const handleTextareaFocus = () => {
    const mobileSettingsButton = document.getElementById('mobile-settings-button');
    const textareas = document.querySelectorAll('textarea');
    
    if (mobileSettingsButton && textareas.length > 0) {
      // Écouter les événements de focus sur la textarea
      textareas[0].addEventListener('focus', () => {
        // Si l'écran est petit, réduire le bouton des paramètres au focus
        if (window.innerWidth < 640) { // Valeur du breakpoint sm
          const collapseButton = mobileSettingsButton.querySelector('button');
          if (collapseButton) {
            // Simuler un clic pour réduire le menu si ouvert
            if (!collapseButton.getAttribute('aria-label')?.includes('Ouvrir')) {
              collapseButton.click();
            }
          }
        }
      });
    }
  };

  // Exécuter après le chargement du DOM
  if (document.readyState === 'complete') {
    adjustButton();
    setTimeout(handleTextareaFocus, 500);
  } else {
    window.addEventListener('load', () => {
      adjustButton();
      setTimeout(handleTextareaFocus, 500);
    });
  }

  // Gérer les changements de taille d'écran et d'orientation
  window.addEventListener('resize', adjustButton);
  window.addEventListener('orientationchange', adjustButton);
  
  // Exécuter avec un léger délai pour s'assurer que React a fini son rendu
  setTimeout(adjustButton, 500);
  
  // Nettoyer les événements quand le composant se démonte
  return () => {
    window.removeEventListener('resize', adjustButton);
    window.removeEventListener('orientationchange', adjustButton);
  };
}
