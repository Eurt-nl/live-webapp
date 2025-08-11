/**
 * PocketBase configuratie
 * Hier worden alle PocketBase-gerelateerde configuratie-instellingen beheerd
 */

// PocketBase server URL - gebruik environment variables voor verschillende omgevingen
const getPocketBaseUrl = (): string => {
  // Gebruik environment variable als die beschikbaar is
  if (import.meta.env.VITE_PB_URL) {
    return import.meta.env.VITE_PB_URL;
  }

  // Fallback naar live server URL
  return 'https://pb.pitch-putt.live';
};

export const POCKETBASE_URL = getPocketBaseUrl();

// PocketBase instantie
import PocketBase from 'pocketbase';

let pb: PocketBase | null = null;

// Functie om PocketBase te initialiseren
const initializePocketBase = (): PocketBase => {
  if (!pb) {
    try {
      pb = new PocketBase(POCKETBASE_URL);
      console.log('PocketBase initialized successfully with URL:', POCKETBASE_URL);
    } catch (error) {
      console.error('Failed to initialize PocketBase:', error);
      throw new Error('Failed to initialize PocketBase');
    }
  }

  if (!pb) {
    console.error('PocketBase instance is null or undefined');
    throw new Error('PocketBase instance is not available');
  }

  return pb;
};

// Initialiseer PocketBase
try {
  pb = initializePocketBase();
} catch (error) {
  console.error('Failed to initialize PocketBase during module load:', error);
  // We laten pb null blijven en zullen het later opnieuw proberen
}

// Configureer de redirect URL voor password reset
// Dit zorgt ervoor dat de reset link naar de juiste pagina verwijst
const getRedirectUrl = (): string => {
  // Gebruik de huidige window.location om de juiste URL te bepalen
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    return `${currentOrigin}/#/auth/reset-password`;
  }

  // Fallback URLs
  if (import.meta.env.DEV) {
    return 'https://localhost:9000/#/auth/reset-password';
  }
  return 'https://pitch-putt.live/#/auth/reset-password';
};

// Stel de redirect URL in voor password reset
pb.authStore.onChange(() => {
  // Deze hook wordt aangeroepen wanneer de auth store verandert
  // We kunnen hier eventueel extra logica toevoegen
});

// Exporteer de redirect URL voor gebruik in andere delen van de app
export const PASSWORD_RESET_REDIRECT_URL = getRedirectUrl();

// Exporteer de PocketBase instantie als default
export default pb;
